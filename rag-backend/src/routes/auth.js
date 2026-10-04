const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { register, login, getMe } = require("../controllers/authController");

// Bruteforce protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Keep strict throttling in production, but allow smoother local testing
  // where emulator/browser traffic may share the same loopback IP.
  max: process.env.NODE_ENV === "development" ? 100 : 10,
  message: { success: false, message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post("/register", register);

const { authenticateToken } = require("../middlewares/auth");

// POST /api/auth/login
router.post("/login", loginLimiter, login);

// GET /api/auth/me
router.get("/me", authenticateToken, getMe);

module.exports = router;
