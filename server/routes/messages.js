import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import requireAuth from "../middleware/auth.js";
import { emitChatsUpdate, emitNewMessage } from "../socket.js";

const router = express.Router();

// Load a conversation's messages (newest first, matching the old client behaviour).
router.get("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Conversation not found" });
  }
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Conversation not found" });
  res.json({ messages: [...message.messages].reverse() });
});

// Send a text or image message.
router.post("/:id", requireAuth, async (req, res) => {
  const messageId = req.params.id;
  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const image = typeof req.body.image === "string" ? req.body.image : "";

  if (!text && !image) {
    return res.status(400).json({ message: "Message is empty" });
  }

  const entry = { sId: req.userId, createdAt: new Date() };
  if (image) entry.image = image;
  else entry.text = text;

  // Atomic append — avoids a read-modify-write race between concurrent sends.
  const message = await Message.findByIdAndUpdate(
    messageId,
    { $push: { messages: entry } },
    { new: true }
  );
  if (!message) return res.status(404).json({ message: "Conversation not found" });

  const preview = image ? "Image" : text;
  const now = Date.now();

  // Update lastMessage/updatedAt on every chat entry that references this conversation.
  await Chat.updateMany(
    { "chatsData.messageId": messageId },
    { $set: { "chatsData.$.lastMessage": preview, "chatsData.$.updatedAt": now } }
  );
  // Mark unread only for the recipient(s) — the entry whose rId is the sender.
  await Chat.updateMany(
    { chatsData: { $elemMatch: { messageId, rId: req.userId } } },
    { $set: { "chatsData.$.messageSeen": false } }
  );

  // Notify all participants (both sender and recipient) in real time.
  const participants = await Chat.find({ "chatsData.messageId": messageId }).select("userId");
  for (const p of participants) {
    emitChatsUpdate(p.userId);
    if (p.userId !== req.userId) emitNewMessage(p.userId, messageId);
  }

  res.json({ message: entry });
});

export default router;
