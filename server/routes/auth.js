import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import redis from "../config/redis.js";
import { generateOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/email.js";
import { signToken } from "../utils/token.js";

const router = express.Router();

const OTP_TTL = () => Number(process.env.OTP_TTL_SECONDS) || 600;
const MAX_ATTEMPTS = 5;
const pendingKey = (email) => `pending:${email}`;
const resetKey = (email) => `reset:${email}`;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeUsername = (username) => String(username || "").trim().toLowerCase();

const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---- Signup step 1: validate, stash pending user in Redis, email an OTP ----
router.post("/signup", async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Reject if the username or email already belongs to a real (verified) user.
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      return res.status(409).json({ message: `${field} already taken` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // OTP DISABLED (local testing): create the account immediately and return a
    // session token, skipping email verification. Set DISABLE_OTP=false (or
    // remove it) in server/.env to restore the normal OTP flow.
    if (process.env.DISABLE_OTP === "true") {
      const user = await User.create({ username, email, passwordHash });
      await Chat.create({ userId: user._id.toString(), chatsData: [] });
      const token = signToken(user._id.toString());
      return res.json({ token, user: user.toPublic() });
    }

    const otp = generateOtp();

    await redis.set(
      pendingKey(email),
      JSON.stringify({ username, email, passwordHash, otp, attempts: 0 }),
      "EX",
      OTP_TTL()
    );

    await sendOtpEmail({ to: email, otp, purpose: "verify" });

    return res.json({ pending: true, email, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({ message: error.message || "Signup failed" });
  }
});

// ---- Signup step 2: verify OTP, create the user + chat doc in Mongo ----
router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    const raw = await redis.get(pendingKey(email));
    if (!raw) {
      return res.status(400).json({ message: "Code expired or not found. Please sign up again." });
    }

    const pending = JSON.parse(raw);

    if (pending.otp !== otp) {
      const attempts = (pending.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await redis.del(pendingKey(email));
        return res.status(429).json({ message: "Too many wrong attempts. Please sign up again." });
      }
      // Preserve the remaining TTL while bumping the attempt counter.
      const ttl = await redis.ttl(pendingKey(email));
      pending.attempts = attempts;
      await redis.set(pendingKey(email), JSON.stringify(pending), "EX", ttl > 0 ? ttl : OTP_TTL());
      return res.status(400).json({ message: "Incorrect code" });
    }

    // Guard against a race where the account got created between step 1 and 2.
    const existing = await User.findOne({ $or: [{ username: pending.username }, { email }] });
    if (existing) {
      await redis.del(pendingKey(email));
      return res.status(409).json({ message: "Account already exists. Please log in." });
    }

    const user = await User.create({
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
    });
    await Chat.create({ userId: user._id.toString(), chatsData: [] });
    await redis.del(pendingKey(email));

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toPublic() });
  } catch (error) {
    console.error("verify-otp error:", error);
    // Duplicate key (unique index) if two verifications race.
    if (error.code === 11000) {
      return res.status(409).json({ message: "Account already exists. Please log in." });
    }
    return res.status(500).json({ message: error.message || "Verification failed" });
  }
});

// ---- Login ----
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toPublic() });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ message: error.message || "Login failed" });
  }
});

// ---- Forgot password: email an OTP if the account exists ----
router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }

    const user = await User.findOne({ email });
    // Only email a code when the account exists, but don't leak which emails exist.
    if (user) {
      const otp = generateOtp();
      await redis.set(resetKey(email), JSON.stringify({ otp, attempts: 0 }), "EX", OTP_TTL());
      await sendOtpEmail({ to: email, otp, purpose: "reset" });
    }
    return res.json({ message: "If that email exists, a reset code has been sent" });
  } catch (error) {
    console.error("forgot-password error:", error);
    return res.status(500).json({ message: error.message || "Could not send reset code" });
  }
});

// ---- Reset password: verify OTP, set a new hashed password ----
router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const raw = await redis.get(resetKey(email));
    if (!raw) {
      return res.status(400).json({ message: "Code expired or not found. Request a new one." });
    }

    const data = JSON.parse(raw);
    if (data.otp !== otp) {
      const attempts = (data.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await redis.del(resetKey(email));
        return res.status(429).json({ message: "Too many wrong attempts. Request a new code." });
      }
      const ttl = await redis.ttl(resetKey(email));
      data.attempts = attempts;
      await redis.set(resetKey(email), JSON.stringify(data), "EX", ttl > 0 ? ttl : OTP_TTL());
      return res.status(400).json({ message: "Incorrect code" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await redis.del(resetKey(email));
      return res.status(404).json({ message: "Account not found" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    await redis.del(resetKey(email));

    return res.json({ message: "Password updated. You can log in now." });
  } catch (error) {
    console.error("reset-password error:", error);
    return res.status(500).json({ message: error.message || "Could not reset password" });
  }
});

export default router;
