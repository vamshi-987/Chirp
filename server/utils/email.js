import resend from "../config/resend.js";

// Resend's shared testing sender. Requires no domain verification, but only
// delivers to the email address that owns your Resend account.
const RESEND_TEST_FROM = "onboarding@resend.dev";

// On localhost, always use Resend's default test sender so signup OTPs work
// without a verified domain. In production, use your verified RESEND_FROM.
const from = () =>
  process.env.NODE_ENV === "production"
    ? process.env.RESEND_FROM || RESEND_TEST_FROM
    : RESEND_TEST_FROM;

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const title = purpose === "reset" ? "Reset your password" : "Verify your email";
  const line =
    purpose === "reset"
      ? "Use the code below to reset your Chat App password."
      : "Use the code below to finish creating your Chat App account.";

  const { error } = await resend.emails.send({
    from: from(),
    to,
    subject: `${title} — ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2>${title}</h2>
        <p>${line}</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0">${otp}</p>
        <p style="color:#666">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    // Surface Resend failures to the caller so the route can report them.
    throw new Error(error.message || "Failed to send email");
  }
};
