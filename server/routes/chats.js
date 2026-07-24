import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { emitChatsUpdate } from "../socket.js";

const router = express.Router();

// Get the current user's chat list, each entry populated with the other user's data.
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ userId: req.userId });
  const items = chat?.chatsData || [];

  // Batch-load all the other participants in one query.
  const otherIds = [...new Set(items.map((i) => i.rId))];
  const users = await User.find({ _id: { $in: otherIds } });
  const byId = new Map(users.map((u) => [u._id.toString(), u.toPublic()]));

  const data = items
    .map((item) => ({
      messageId: item.messageId,
      lastMessage: item.lastMessage,
      rId: item.rId,
      updatedAt: item.updatedAt,
      messageSeen: item.messageSeen,
      userData: byId.get(item.rId) || null,
    }))
    .filter((item) => item.userData)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ chatsData: data });
}));

// Start a chat with another user: create a Message doc and add it to both chat lists.
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const rId = String(req.body.rId || "");
  if (!rId || rId === req.userId || !mongoose.isValidObjectId(rId)) {
    return res.status(400).json({ message: "Invalid user" });
  }

  const other = await User.findById(rId);
  if (!other) return res.status(404).json({ message: "User not found" });

  // If a conversation with this user already exists, return it instead of
  // creating a duplicate (guards against stale client state / double-clicks).
  const existing = await Chat.findOne({ userId: req.userId, "chatsData.rId": rId });
  if (existing) {
    const entry = existing.chatsData.find((c) => c.rId === rId);
    return res.json({
      chat: {
        messageId: entry.messageId,
        lastMessage: entry.lastMessage,
        rId,
        updatedAt: entry.updatedAt,
        messageSeen: entry.messageSeen,
        userData: other.toPublic(),
      },
    });
  }

  // Reuse the existing conversation between these two users if there is one
  // (e.g. the current user deleted it earlier — deletes are one-sided), else
  // create a fresh one. The chat entry is added ONLY to the initiator's list;
  // the other user doesn't see the conversation until the first message is
  // actually sent (materialised in routes/messages.js).
  let conversation = await Message.findOne({ participants: { $all: [req.userId, rId] } });
  if (!conversation) {
    conversation = await Message.create({ participants: [req.userId, rId], messages: [] });
  }
  const messageId = conversation._id.toString();
  const now = Date.now();

  await Chat.updateOne(
    { userId: req.userId },
    { $push: { chatsData: { messageId, lastMessage: "", rId, updatedAt: now, messageSeen: true } } },
    { upsert: true }
  );

  emitChatsUpdate(req.userId);

  res.json({
    chat: {
      messageId,
      lastMessage: "",
      rId,
      updatedAt: now,
      messageSeen: true,
      userData: other.toPublic(),
    },
  });
}));

// Delete a conversation for the current user only. This removes the chat entry
// from *this* user's list; the shared Message doc and the other participant's
// entry are left intact, so the other user still sees the full conversation.
router.delete("/:messageId", requireAuth, asyncHandler(async (req, res) => {
  const messageId = String(req.params.messageId || "");
  if (!messageId) return res.status(400).json({ message: "Invalid conversation" });

  await Chat.updateOne(
    { userId: req.userId },
    { $pull: { chatsData: { messageId } } }
  );

  // Hide the existing history from this user only. If they start the chat again
  // later, messages sent before now stay hidden for them, while the other user
  // keeps the full conversation.
  // Scope the clear to conversations the user actually belongs to, so a caller
  // can't stamp clearedAt onto arbitrary Message docs by guessing ids.
  if (mongoose.isValidObjectId(messageId)) {
    await Message.updateOne(
      { _id: messageId, participants: req.userId },
      { $set: { [`clearedAt.${req.userId}`]: Date.now() } }
    );
  }

  emitChatsUpdate(req.userId);
  res.json({ ok: true });
}));

// Mark a conversation as seen for the current user.
router.post("/seen", requireAuth, asyncHandler(async (req, res) => {
  const messageId = String(req.body.messageId || "");
  await Chat.updateOne(
    { userId: req.userId, "chatsData.messageId": messageId },
    { $set: { "chatsData.$.messageSeen": true } }
  );
  res.json({ ok: true });
}));

export default router;
