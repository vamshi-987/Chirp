import "dotenv/config";
import express from "express";
import http from "http";
import fs from "fs";
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
  const indexHtml = path.join(clientDist, "index.html");

  // Only serve the SPA if it was actually built and shipped alongside the API.
  // `client/dist` is gitignored, so a git-based deploy won't include it unless
  // the build runs on the host — and a serverless bundle won't include it at
  // all. Without this guard, every non-API request tried to sendFile a missing
  // index.html and failed with ENOENT. When the build is absent we run API-only
  // and say so, instead of 500-ing every page load.
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    // SPA fallback: any non-API route returns index.html for client-side routing.
    app.get(/^\/(?!api|socket\.io).*/, (req, res) => {
      res.sendFile(indexHtml);
    });
    console.log(`Serving SPA from ${clientDist}`);
  } else {
    console.warn(
      `client/dist not found at ${clientDist} — running API-only. ` +
        "Build the frontend (cd client && npm run build) and include client/dist " +
        "in the deploy, or host the frontend separately and point it at this API " +
        "via VITE_API_URL."
    );
  }
}

// Centralised error handler (registered last, after every route). Any error
// forwarded via next(err) — see middleware/asyncHandler.js — lands here and
// returns a clean JSON response instead of leaving the request hanging or
// crashing the process.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.originalUrl} ->`, err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// Last-resort safety net: never let a stray rejection/exception kill the
// server. These should be rare now that route handlers forward errors properly.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

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
