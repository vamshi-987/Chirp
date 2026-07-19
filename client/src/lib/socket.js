import { io } from "socket.io-client";
import { getToken } from "./api";

let socket = null;

// Connect (or reuse) an authenticated socket. Same-origin, so the Vite proxy
// forwards /socket.io to the backend in dev.
export const connectSocket = () => {
  const token = getToken();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io({ auth: { token }, autoConnect: true });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
