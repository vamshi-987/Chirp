import crypto from "crypto";

// 6-digit numeric OTP, cryptographically random, always zero-padded.
export const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");
