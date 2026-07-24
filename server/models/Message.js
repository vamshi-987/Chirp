import mongoose from "mongoose";

const messageItemSchema = new mongoose.Schema(
  {
    sId: { type: String, required: true },
    text: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema({
  // Both user ids in this conversation. Lets a message-send materialise the
  // recipient's chat entry even before they have one (see routes/messages.js).
  participants: { type: [String], default: [] },
  messages: { type: [messageItemSchema], default: [] },
  // Per-user "cleared" timestamp: messages older than this are hidden from that
  // user only. Set when a user deletes the conversation, so restarting it
  // doesn't bring back the history they deleted (the other user keeps it).
  clearedAt: { type: Map, of: Number, default: {} },
  createdAt: { type: Date, default: () => new Date() },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
