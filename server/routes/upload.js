import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// Keep the file in memory, then stream it to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "chat-app",
      resource_type: "image",
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
