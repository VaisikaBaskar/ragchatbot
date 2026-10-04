const express = require("express");
const router = express.Router();
const { upgradeUserToPro } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/auth");

// PATCH /api/user/upgrade
router.patch("/upgrade", authenticateToken, upgradeUserToPro);

module.exports = router;
