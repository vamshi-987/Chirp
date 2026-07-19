import { toast } from "react-toastify";
import { api, setToken, clearToken } from "./api";
import { disconnectSocket } from "./socket";

// Step 1 of signup: request an email OTP. No account is created yet.
// Returns the email on success (so the UI can move to the OTP step), or null.
const signup = async (username, email, password) => {
  try {
    const res = await api.post("/auth/signup", { username, email, password });
    // OTP disabled: server created the account and returned a token — log in now.
    if (res.token) {
      setToken(res.token);
      return { loggedIn: true };
    }
    toast.success(res.message || "Verification code sent");
    return { email: res.email || email };
  } catch (error) {
    toast.error(error.message);
    return null;
  }
};

// Step 2 of signup: verify the OTP and receive a session token.
const verifyOtp = async (email, otp) => {
  try {
    const res = await api.post("/auth/verify-otp", { email, otp });
    setToken(res.token);
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    setToken(res.token);
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

const logout = () => {
  clearToken();
  disconnectSocket();
  // Full reset of client state, back to the login screen.
  window.location.href = "/";
};

// Forgot password: request a reset OTP.
const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return false;
  }
  try {
    const res = await api.post("/auth/forgot-password", { email });
    toast.success(res.message || "Reset code sent");
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

// Complete the reset with the OTP and a new password.
const resetPasswordConfirm = async (email, otp, newPassword) => {
  try {
    const res = await api.post("/auth/reset-password", { email, otp, newPassword });
    toast.success(res.message || "Password updated");
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

export { signup, verifyOtp, login, logout, resetPass, resetPasswordConfirm };
