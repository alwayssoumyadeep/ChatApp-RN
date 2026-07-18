const express = require('express');
const userModel = require('../models/user.model');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.post("/create", protect, async (req, res) => {
  const user = await userModel.findOne({ _id: req.userId });
  console.log(user);
  res.send("Post created successfully");
});

module.exports = router;