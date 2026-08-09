const Message = require('../models/Message');
const userModel = require('../models/user.model');
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

/**
 * GET /api/messages/conversations
 * Returns the list of users the current user has exchanged at least one message
 * with, ordered by the most recent message (desc). Each entry includes the
 * other user's profile fields plus the raw last message ciphertext + iv +
 * timestamp so the client can decrypt and display a preview.
 */
async function getConversations(req, res) {
  try {
    const myId = new mongoose.Types.ObjectId(req.userId);

    // Aggregate: for each conversation partner, get the latest message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", myId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$message" },
          lastIv: { $first: "$iv" },
          lastSenderId: { $first: "$senderId" },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$userInfo._id",
            username: "$userInfo.username",
            email: "$userInfo.email",
            about: "$userInfo.about",
            profilePicture: "$userInfo.profilePicture",
            isOnline: "$userInfo.isOnline",
            publicKey: "$userInfo.publicKey",
          },
          lastMessage: 1,
          lastIv: 1,
          lastSenderId: 1,
          lastMessageAt: 1,
        },
      },
    ]);

    res.status(200).json({ conversations });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = { sendMessage, getMessages, getConversations };
