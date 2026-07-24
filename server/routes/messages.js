import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { emitChatsUpdate, emitNewMessage } from "../socket.js";

const router = express.Router();

// True if `userId` belongs to this conversation. Prefers the stored participant
// list; for legacy docs without one, falls back to the chat entries that
// reference the conversation. Prevents reading/writing other people's threads.
const isParticipant = async (message, userId) => {
  if (message.participants?.length) return message.participants.includes(userId);
  const entry = await Chat.findOne({
    userId,
    "chatsData.messageId": message._id.toString(),
  }).select("_id");
  return Boolean(entry);
};

// Load a conversation's messages (newest first, matching the old client behaviour).
router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Conversation not found" });
  }
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Conversation not found" });

  // Only participants may read a conversation. Legacy docs without a stored
  // participant list fall back to the chat entries that reference this message.
  if (!(await isParticipant(message, req.userId))) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  // Hide anything the user cleared by deleting the conversation earlier.
  const clearedAt = message.clearedAt?.get(req.userId) || 0;
  const visible = message.messages.filter((m) => new Date(m.createdAt).getTime() > clearedAt);
  res.json({ messages: [...visible].reverse() });
}));

// Send a text or image message.
router.post("/:id", requireAuth, asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const image = typeof req.body.image === "string" ? req.body.image : "";

  if (!text && !image) {
    return res.status(400).json({ message: "Message is empty" });
  }

  // Load the conversation first so we can authorize the sender before writing.
  const existing = await Message.findById(messageId);
  if (!existing) return res.status(404).json({ message: "Conversation not found" });
  if (!(await isParticipant(existing, req.userId))) {
    return res.status(404).json({ message: "Conversation not found" });
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

  // Who's in this conversation. Prefer the stored participant list; fall back to
  // whoever currently has a chat entry (for older conversations without it).
  let participants = message.participants?.length ? [...message.participants] : [];
  if (!participants.length) {
    const chats = await Chat.find({ "chatsData.messageId": messageId }).select("userId");
    participants = chats.map((c) => c.userId);
  }
  if (!participants.includes(req.userId)) participants.push(req.userId);

  // Update each participant's chat entry — creating the recipient's entry here
  // if they don't have one yet. This is the point at which the recipient first
  // sees the conversation (it isn't pushed to them when the chat is created).
  for (const p of participants) {
    const isSender = p === req.userId;
    const otherId = participants.find((x) => x !== p) || req.userId;

    const updated = await Chat.updateOne(
      { userId: p, "chatsData.messageId": messageId },
      {
        $set: {
          "chatsData.$.lastMessage": preview,
          "chatsData.$.updatedAt": now,
          "chatsData.$.messageSeen": isSender,
        },
      }
    );
    if (updated.matchedCount === 0) {
      await Chat.updateOne(
        { userId: p },
        { $push: { chatsData: { messageId, lastMessage: preview, rId: otherId, updatedAt: now, messageSeen: isSender } } },
        { upsert: true }
      );
    }
  }

  // Notify all participants (both sender and recipient) in real time.
  for (const p of participants) {
    emitChatsUpdate(p);
    if (p !== req.userId) emitNewMessage(p, messageId);
  }

  res.json({ message: entry });
}));

export default router;
