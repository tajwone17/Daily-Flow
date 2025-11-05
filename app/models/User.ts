import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profession: { type: String },
    bio: { type: String },
    profilePicture: { type: String },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema);
export default User;
