const express = require('express');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

// TODO: Implement post creation with a Post model and controller
router.post("/create", protect, (req, res) => {
  res.status(501).json({ message: "Post creation is not yet implemented" });
});

module.exports = router;