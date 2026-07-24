// Base URL of the backend API/socket server.
//
// - Local dev: leave VITE_API_URL unset. This stays "" so requests hit the
//   same origin and the Vite dev proxy (see vite.config.js) forwards /api and
//   /socket.io to http://localhost:5000.
// - Production: set VITE_API_URL to the deployed backend origin, e.g.
//   https://chirp-backend.onrender.com  (no trailing slash, no /api suffix).
//
// Vite only exposes vars prefixed with VITE_ to the client bundle.
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
