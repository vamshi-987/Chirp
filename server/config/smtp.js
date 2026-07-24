import nodemailer from "nodemailer";

// SMTP transport for sending OTP emails. Configure these in server/.env:
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   e.g. 587 (STARTTLS) or 465 (SSL)
//   SMTP_SECURE "true" for port 465, otherwise "false"
//   SMTP_USER   the SMTP account/login
//   SMTP_PASS   the SMTP password / app password
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !user || !pass) {
  console.warn(
    "SMTP is not fully configured. OTP emails will fail until you set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env"
  );
}

// `secure` must be true only for implicit-TLS ports (465). For 587 we use
// STARTTLS, which nodemailer negotiates automatically with secure=false.
const secure =
  process.env.SMTP_SECURE != null
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
});

export default transporter;
