import express from "express";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { emitChatsUpdate } from "../socket.js";

const router = express.Router();

// Current logged-in user.
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toPublic());
}));

// Update profile (name / bio / avatar).
router.put("/me", requireAuth, asyncHandler(async (req, res) => {
  const update = {};
  if (typeof req.body.name === "string") update.name = req.body.name;
  if (typeof req.body.bio === "string") update.bio = req.body.bio;
  if (typeof req.body.avatar === "string") update.avatar = req.body.avatar;

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toPublic());
}));

// Permanently delete the current user's account and all their data.
router.delete("/me", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Everyone this user had a conversation with, so we can refresh their lists
  // once the user is gone (their chat entry will no longer resolve).
  const conversations = await Message.find({ participants: userId });
  const otherIds = new Set();
  for (const convo of conversations) {
    for (const p of convo.participants) {
      if (p !== userId) otherIds.add(p);
    }
  }

  // Remove the shared conversation docs, this user's own chat list, and this
  // user's entry from every other user's chat list, then the account itself.
  await Message.deleteMany({ participants: userId });
  await Chat.deleteOne({ userId });
  await Chat.updateMany(
    { "chatsData.rId": userId },
    { $pull: { chatsData: { rId: userId } } }
  );
  await User.deleteOne({ _id: userId });

  // Nudge the remaining participants so the deleted user drops out of their UI.
  for (const id of otherIds) emitChatsUpdate(id);

  res.json({ ok: true });
}));

// Heartbeat used by the client to keep lastSeen fresh.
router.post("/lastseen", requireAuth, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { lastSeen: Date.now() });
  res.json({ ok: true });
}));

// Search users by exact username (mirrors the old Firestore query).
router.get("/search", requireAuth, asyncHandler(async (req, res) => {
  const username = String(req.query.username || "").trim().toLowerCase();
  if (!username) return res.json({ user: null });

  const user = await User.findOne({ username });
  if (!user || user._id.toString() === req.userId) {
    return res.json({ user: null });
  }
  res.json({ user: user.toPublic() });
}));

export default router;
