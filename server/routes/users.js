import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// Current logged-in user.
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toPublic());
});

// Update profile (name / bio / avatar).
router.put("/me", requireAuth, async (req, res) => {
  const update = {};
  if (typeof req.body.name === "string") update.name = req.body.name;
  if (typeof req.body.bio === "string") update.bio = req.body.bio;
  if (typeof req.body.avatar === "string") update.avatar = req.body.avatar;

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toPublic());
});

// Heartbeat used by the client to keep lastSeen fresh.
router.post("/lastseen", requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { lastSeen: Date.now() });
  res.json({ ok: true });
});

// Search users by exact username (mirrors the old Firestore query).
router.get("/search", requireAuth, async (req, res) => {
  const username = String(req.query.username || "").trim().toLowerCase();
  if (!username) return res.json({ user: null });

  const user = await User.findOne({ username });
  if (!user || user._id.toString() === req.userId) {
    return res.json({ user: null });
  }
  res.json({ user: user.toPublic() });
});

export default router;
