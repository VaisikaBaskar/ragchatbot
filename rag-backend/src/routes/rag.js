const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const uploadMiddleware = require("../middlewares/upload");
const { uploadDocument, chatWithRAG, getLogs, getDocuments } = require("../controllers/ragController");
const { authenticateToken, authorize } = require("../middlewares/auth");

// Chat spam protection
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased to 100 queries per minute for stability
  message: { success: false, message: "Rate limit exceeded. Please wait a moment." },
  standardHeaders: true,
});

// POST /api/rag/upload
// Uses multer memory storage single file upload with field name "file"
// Accessible by BOTH ADMIN and USER
router.post("/upload", authenticateToken, authorize(["admin", "user"]), uploadMiddleware.single("file"), uploadDocument);

// POST /api/rag/chat
// Accessible by BOTH ADMIN and USER
router.post("/chat", authenticateToken, authorize(["admin", "user"]), chatLimiter, chatWithRAG);

// GET /api/rag/logs
// Accessible ONLY by ADMIN
router.get("/logs", authenticateToken, authorize(["admin"]), getLogs);

// GET /api/rag/documents
// Accessible ONLY by ADMIN
router.get("/documents", authenticateToken, authorize(["admin"]), getDocuments);

module.exports = router;
