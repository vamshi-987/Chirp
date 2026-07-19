# Chat App — Backend

Node/Express API backing the React client with MongoDB Atlas, Redis, Resend (email OTP),
Cloudinary (images) and Socket.io (real-time).

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

- `MONGO_URI` — your MongoDB Atlas connection string
- `RESEND_API_KEY` — your Resend API key (and `RESEND_FROM`, a verified sender; `onboarding@resend.dev` works for testing)
- `REDIS_URL` — a Redis instance (local `redis://localhost:6379`, or an Upstash / Redis Cloud URL)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `JWT_SECRET` — any long random string

## Run

```bash
npm run dev     # auto-reloads on change
# or
npm start
```

Server runs on `http://localhost:5000`. The Vite client proxies `/api` and `/socket.io` here.

## Auth flow

1. `POST /api/auth/signup` — stashes the pending user (with a bcrypt password hash) in Redis and
   emails a 6-digit OTP via Resend. **No user is written to MongoDB yet.**
2. `POST /api/auth/verify-otp` — on the correct OTP, creates the user + chat doc in MongoDB and
   returns a JWT.
3. `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
