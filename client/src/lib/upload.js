import { api } from "./api";

// Uploads a file to the backend, which stores it on Cloudinary and returns the URL.
const upload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload", formData);
  return res.url;
};

export default upload;
