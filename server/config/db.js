import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Add your MongoDB Atlas connection string to server/.env");
  }
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));
  await mongoose.connect(uri);
};

export default connectDB;
