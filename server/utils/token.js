import jwt from "jsonwebtoken";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set in server/.env");
  return s;
};

export const signToken = (userId) => jwt.sign({ id: userId }, secret(), { expiresIn: "7d" });

export const verifyToken = (token) => jwt.verify(token, secret());
