const User = require("../models/User");
const Document = require("../models/Document");
const ChatLog = require("../models/ChatLog");
const Chunk = require("../models/Chunk");
const SecurityLog = require("../models/SecurityLog");
const ActivityLog = require("../models/ActivityLog");
const logger = require("../utils/logger");

// 1. ANALYTICS: Get system overview counts
const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ isPro: true });
    const totalDocs = await Document.countDocuments();
    const totalChats = await ChatLog.countDocuments();

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        proUsers,
        totalDocs,
        totalChats
      }
    });
  } catch (error) {
    logger.error(`[Admin] Analytics Error: ${error.message}`);
    next(error);
  }
};

// 2. DOCUMENTS: List all documents with metadata
const listDocuments = async (req, res, next) => {
  try {
    // Populate uploadedBy to get user names/emails
    const documents = await Document.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error(`[Admin] Document List Error: ${error.message}`);
    next(error);
  }
};

// 3. DOCUMENTS: Delete document and its chunks
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete related chunks from vector collection
    const chunkResult = await Chunk.deleteMany({ documentId: id });
    
    // Delete document entry
    const docResult = await Document.findByIdAndDelete(id);

    if (!docResult) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({
      success: true,
      message: "Document and associated embeddings deleted successfully",
      deletedChunks: chunkResult.deletedCount
    });
  } catch (error) {
    logger.error(`[Admin] Document Delete Error: ${error.message}`);
    next(error);
  }
};

// 4. USERS: List all users
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    logger.error(`[Admin] User List Error: ${error.message}`);
    next(error);
  }
};

// 5. USERS: Upgrade user (Set isPro and bump limit)
const upgradeUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isPro = true;
    user.uploadLimit = 9999;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.email} upgraded to Pro tier`,
      user
    });
  } catch (error) {
    logger.error(`[Admin] User Upgrade Error: ${error.message}`);
    next(error);
  }
};

// 6. USERS: Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await User.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User removed successfully"
    });
  } catch (error) {
    logger.error(`[Admin] User Delete Error: ${error.message}`);
    next(error);
  }
};

// 7. CHATS: Monitor all chat logs
const getChatLogs = async (req, res, next) => {
  try {
    const logs = await ChatLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error(`[Admin] Chat Log Error: ${error.message}`);
    next(error);
  }
};

// 8. SECURITY: Monitor incident logs
const getSecurityLogs = async (req, res, next) => {
  try {
    const logs = await SecurityLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error(`[Admin] Security Log Error: ${error.message}`);
    next(error);
  }
};

// 9. ACTIVITY: Unified system activity monitoring
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error(`[Admin] Activity Log Error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getAnalytics,
  listDocuments,
  deleteDocument,
  listUsers,
  upgradeUser,
  deleteUser,
  getChatLogs,
  getSecurityLogs,
  getActivityLogs
};
