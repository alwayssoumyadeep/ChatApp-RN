const Message = require('../models/Message');
const mongoose = require('mongoose');

async function sendMessage(req, res) {
  try {
    const senderId = req.userId;
    const { receiverId, message } = req.body;

    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({ message: "receiverId and message are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId format" });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: message.trim()
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getMessages(req, res) {
  try {
    const { senderId, receiverId } = req.params;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid senderId or receiverId format" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = { sendMessage, getMessages };
