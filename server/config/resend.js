import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn("RESEND_API_KEY is not set. OTP emails will fail until you add it to server/.env");
}

// Pass a placeholder when the key is missing so the constructor doesn't throw at
// startup — the server still boots; only the actual email send will error (and we
// catch/surface that in utils/email.js).
const resend = new Resend(apiKey || "re_missing_api_key");

export default resend;
