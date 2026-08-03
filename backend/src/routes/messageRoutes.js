const express = require('express');
const protect = require('../middleware/auth.middleware');
const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:senderId/:receiverId', protect, getMessages);

module.exports = router;
