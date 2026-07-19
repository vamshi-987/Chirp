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
  messages: { type: [messageItemSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
