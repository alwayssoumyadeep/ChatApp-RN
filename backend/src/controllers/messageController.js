const Message = require('../models/Message');
const mongoose = require('mongoose');

async function sendMessage(req, res) {
  try {
    const senderId = req.userId;
    const { receiverId, message, iv } = req.body;

    if (!receiverId || !message || !iv) {
      return res.status(400).json({ message: "receiverId, message, and iv are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId format" });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
      iv,
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
