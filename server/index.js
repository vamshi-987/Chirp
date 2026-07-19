import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import connectDB from "./config/db.js";
import "./config/redis.js"; // establishes the Redis connection on startup
import { initSocket } from "./socket.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// In production, serve the built React app from the same origin as the API,
// so no CORS/proxy is needed and the socket connects to this host directly.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  // SPA fallback: any non-API route returns index.html for client-side routing.
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

initSocket(server);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
