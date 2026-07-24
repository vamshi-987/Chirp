import transporter from "../config/smtp.js";

// Sender address for OTP emails. Defaults to SMTP_USER when SMTP_FROM isn't set.
const from = () =>
  process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@chirp.app";

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const title = purpose === "reset" ? "Reset your password" : "Verify your email";
  const line =
    purpose === "reset"
      ? "Use the code below to reset your Chirp password."
      : "Use the code below to finish creating your Chirp account.";

  try {
    await transporter.sendMail({
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
  } catch (error) {
    // Surface SMTP failures to the caller so the route can report them.
    throw new Error(error.message || "Failed to send email");
  }
};
