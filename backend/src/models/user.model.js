const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  about: { type: String, default: "Hey there! I'm using MeChat." },
  profilePicture: { type: String, default: "" },
  publicKey: { type: String, default: null },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },
}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;