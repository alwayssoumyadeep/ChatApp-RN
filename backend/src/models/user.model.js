const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  about: { type: String, default: "Hey there! I'm using MeChat." },
  profilePicture: { type: String, default: "" },
  publicKey: { type: String, default: null },  // for RSA/ECC, added later
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;