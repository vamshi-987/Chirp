import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import { emitChatsUpdate } from "../socket.js";

const router = express.Router();

// Get the current user's chat list, each entry populated with the other user's data.
router.get("/", requireAuth, async (req, res) => {
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
});

// Start a chat with another user: create a Message doc and add it to both chat lists.
router.post("/", requireAuth, async (req, res) => {
  const rId = String(req.body.rId || "");
  if (!rId || rId === req.userId) {
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

  const message = await Message.create({ messages: [] });
  const messageId = message._id.toString();
  const now = Date.now();

  // Push a chat entry pointing at the *other* participant for each side.
  await Chat.updateOne(
    { userId: rId },
    { $push: { chatsData: { messageId, lastMessage: "", rId: req.userId, updatedAt: now, messageSeen: true } } },
    { upsert: true }
  );
  await Chat.updateOne(
    { userId: req.userId },
    { $push: { chatsData: { messageId, lastMessage: "", rId, updatedAt: now, messageSeen: true } } },
    { upsert: true }
  );

  emitChatsUpdate(rId);
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
});

// Mark a conversation as seen for the current user.
router.post("/seen", requireAuth, async (req, res) => {
  const messageId = String(req.body.messageId || "");
  await Chat.updateOne(
    { userId: req.userId, "chatsData.messageId": messageId },
    { $set: { "chatsData.$.messageSeen": true } }
  );
  res.json({ ok: true });
});

export default router;
