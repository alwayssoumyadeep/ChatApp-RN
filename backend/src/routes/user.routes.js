const express = require("express");
const protect = require("../middleware/auth.middleware");
const { getAllUsers } = require("../controllers/user.controller");

const router = express.Router();

router.get("/", protect, getAllUsers);

module.exports = router;