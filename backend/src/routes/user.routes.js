const express = require("express");
const protect = require("../middleware/auth.middleware");
const { getAllUsers, getMyProfile, updateMyProfile, getUserById } = require("../controllers/user.controller");

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/me", protect, getMyProfile);
router.patch("/me", protect, updateMyProfile);
router.get("/:userId", protect, getUserById);

module.exports = router;