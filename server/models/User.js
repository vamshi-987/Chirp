import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: "" },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "Hey, There i am using chat app" },
  lastSeen: { type: Number, default: () => Date.now() },
});

// What the client is allowed to see about a user (never the passwordHash).
userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    name: this.name,
    avatar: this.avatar,
    bio: this.bio,
    lastSeen: this.lastSeen,
  };
};

const User = mongoose.model("User", userSchema);
export default User;
