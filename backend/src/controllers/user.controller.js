const userModel = require("../models/user.model");

async function getAllUsers(req, res) {
  try {
    const users = await userModel
      .find({ _id: { $ne: req.userId } })
      .select("username email about profilePicture publicKey isOnline");

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getMyProfile(req, res) {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function updateMyProfile(req, res) {
  try {
    const { username, about, profilePicture } = req.body;

    if (username) {
      const existing = await userModel.findOne({ username, _id: { $ne: req.userId } });
      if (existing) return res.status(409).json({ message: "Username already taken" });
    }

    const updated = await userModel.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          ...(username && { username }),
          ...(about !== undefined && { about }),
          ...(profilePicture !== undefined && { profilePicture }),
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}




module.exports = { getAllUsers, getMyProfile, updateMyProfile };