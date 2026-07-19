import mongoose from "mongoose";

const chatItemSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true },
    lastMessage: { type: String, default: "" },
    rId: { type: String, required: true },
    updatedAt: { type: Number, default: () => Date.now() },
    messageSeen: { type: Boolean, default: true },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  chatsData: { type: [chatItemSchema], default: [] },
});

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
