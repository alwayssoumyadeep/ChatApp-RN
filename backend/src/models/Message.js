const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  message: { type: String, required: true, trim: true },  // stores ciphertext (hex)
  iv: { type: String, required: true },                    // AES-GCM nonce (hex)
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;