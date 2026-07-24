import { io } from "socket.io-client";
import { getToken } from "./api";
import { API_URL } from "./config";

let socket = null;

// Connect (or reuse) an authenticated socket. In dev API_URL is "" so the
// socket is same-origin and the Vite proxy forwards /socket.io to the backend;
// in production it connects directly to the deployed backend (VITE_API_URL).
export const connectSocket = () => {
  const token = getToken();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = API_URL
    ? io(API_URL, { auth: { token }, autoConnect: true })
    : io({ auth: { token }, autoConnect: true });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
