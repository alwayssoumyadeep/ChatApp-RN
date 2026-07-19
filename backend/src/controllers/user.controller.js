const userModel = require("../models/user.model");

async function getAllUsers(req, res) {
  try {
    const users = await userModel
      .find({ _id: { $ne: req.userId } })
      .select("username email publicKey isOnline");

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = { getAllUsers };