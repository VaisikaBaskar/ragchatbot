const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const { authenticateToken } = require("../middlewares/auth");

// GET chat list
router.get("/list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const chats = await Chat.find({ userId })
      .select("_id title updatedAt")
      .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ success: false, message: "Error fetching chats" });
  }
});

// GET single chat
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: userId
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error("Fetch single chat error:", error);
    res.status(500).json({ success: false, message: "Error fetching chat" });
  }
});

module.exports = router;
