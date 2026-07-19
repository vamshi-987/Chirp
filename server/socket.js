import { Server } from "socket.io";
import { verifyToken } from "./utils/token.js";
import User from "./models/User.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  // Authenticate every socket via the JWT passed in the handshake.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const payload = verifyToken(token);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    // Each user has a personal room keyed by their id, so we can target them.
    socket.join(socket.userId);
    await markLastSeen(socket.userId);

    socket.on("disconnect", () => {
      markLastSeen(socket.userId);
    });
  });

  return io;
};

const markLastSeen = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
  } catch {
    /* non-fatal */
  }
};

// Notify a user's chat list to refetch.
export const emitChatsUpdate = (userId) => {
  io?.to(String(userId)).emit("chats:update");
};

// Notify a user that a conversation received a new message.
export const emitNewMessage = (userId, messageId) => {
  io?.to(String(userId)).emit("message:new", { messageId });
};
