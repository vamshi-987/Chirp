import mongoose from "mongoose";
import { verifyToken } from "../utils/token.js";

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const payload = verifyToken(token);
    // Reject tokens whose id isn't a valid Mongo ObjectId (e.g. a stale token
    // from before the Firebase→MongoDB migration). Otherwise User.findById()
    // throws a CastError deep inside the route handlers.
    if (!mongoose.isValidObjectId(payload.id)) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

export default requireAuth;
