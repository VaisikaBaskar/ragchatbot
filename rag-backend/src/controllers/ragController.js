const { processFile } = require("../services/ingestionService");
const { runRAGPipeline } = require("../services/ragPipeline");
const logger = require("../utils/logger");
const Document = require("../models/Document");
const SecurityLog = require("../models/SecurityLog");
const { logActivity } = require("../utils/activityLogger");
const { detectPromptInjection, isMaliciousQuery } = require("../utils/security.js");
const { detectAnomaly } = require("../utils/anomalyDetector");
const ChatLog = require("../models/ChatLog");

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    // Get userId from the verified JWT (req.user)
    const userId = req.user?.userId || req.user?.id || null;

    // 1. SECURE DOCUMENT INGESTION CHECKS
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      await SecurityLog.create({
        userId,
        type: "MALICIOUS_UPLOAD",
        message: `Rejected upload type: ${req.file.mimetype} for file ${req.file.originalname}`,
        metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
      });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid file type. Only TXT, PDF, DOCX allowed." 
      });
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (req.file.size > MAX_SIZE) {
      await SecurityLog.create({
        userId,
        type: "MALICIOUS_UPLOAD",
        message: `Rejected oversized file: ${req.file.size} bytes`,
        metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
      });
      return res.status(400).json({ 
        success: false, 
        message: "File too large. Max size is 2MB." 
      });
    }

    // SAFE FILE NAME HANDLING (for logging/usage)
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "*");

    // Load full user object to check upload limits and role
    const User = require("../models/User");
    const userDoc = await User.findById(userId);

    // ... (rest of the limit checking logic) ...

    logger.info(`[RAG] Secure upload attempt: ${safeFileName} by userId: ${userId}`);

    let result;
    try {
      result = await processFile(req.file, userId);
    } catch (err) {
      if (err.message === "MALICIOUS_CONTENT") {
        await SecurityLog.create({
          userId,
          type: "MALICIOUS_UPLOAD",
          message: `Blocked malicious file content in: ${safeFileName}`,
          metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
        });

        return res.status(400).json({
          success: false,
          message: "File contains unsafe content."
        });
      }
      throw err; // preserve existing error flow
    }

    // LOG SUCCESSFUL UPLOAD
    await SecurityLog.create({
      userId,
      type: "UPLOAD",
      message: `Uploaded file: ${safeFileName}`
    });

    logActivity(userId, "UPLOAD", { fileName: safeFileName }, req);

    // After successful upload, increment the counter only for standard (non-pro) users
    if (userDoc && userDoc.role !== "admin" && !userDoc.isPro) {
      userDoc.uploadCount += 1;
      await userDoc.save();
    }
    
    res.status(200).json({
      success: true,
      message: "File ingested and embedded successfully.",
      data: result,
    });
  } catch (error) {
    // LOG FAILED UPLOAD
    logActivity(req.user?.userId || req.user?.id || "unknown", "FAILED_UPLOAD", { error: error.message }, req);
    next(error);
  }
};

const sanitizeQuery = (query) => {
  if (typeof query !== "string") return null;
  // Trim spaces and limit to 500 chars
  let clean = query.trim().substring(0, 500);
  // Remove scripts
  clean = clean.replace(/script/gi, "");
  // Remove < and >
  clean = clean.replace(/[<>]/g, "");
  return clean;
};

const chatWithRAG = async (req, res, next) => {
  let finalQuery = "";
  let finalResponse = "";
  let logStatus = "safe";

  try {
    const { query } = req.body;
    const userId = req.user?.userId || req.user?.id || null;

    // STEP 0: ANOMALY DETECTION (Circuit Breaker)
    const anomaly = await detectAnomaly(userId);
    if (anomaly.suspicious) {
      return res.json({
        blocked: true,
        message: `Suspicious activity detected: ${anomaly.reason}. Please try again later.`
      });
    }

    // STEP 1: STRICT MALICIOUS QUERY BLOCKING (PRE-CHECK)
    if (isMaliciousQuery(query)) {
      try {
        await SecurityLog.create({
          userId: req.user?.userId || req.user?.id || null,
          type: "BLOCKED_QUERY",
          message: query,
          metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
        });
        // Log to ActivityLog as requested
        logActivity(userId, "BLOCKED_QUERY", { query }, req);
      } catch (err) {
        console.error("Security log failed:", err.message);
      }

      return res.json({
        success: true,
        blocked: true,
        answer: "⚠️ This request violates system security policies and cannot be processed."
      });
    }
    
    if (!query || typeof query !== "string") {
      logStatus = "blocked";
      return res.status(400).json({ success: false, message: "Invalid query format. Must be a string." });
    }

    finalQuery = sanitizeQuery(query);
    logger.info(`[RAG] SECURE Chat request received. Query Length: ${finalQuery.length}`);

    // LOG ACTIVITY: CHAT
    logActivity(userId, "CHAT", { query: finalQuery }, req);

    // ANOMALY DETECTION: Rate limit (> 20 queries/min)
    const oneMinAgo = new Date(Date.now() - 60000);
    const recentQueries = await ChatLog.countDocuments({
      userId: req.user?.userId,
      createdAt: { $gte: oneMinAgo }
    });

    if (recentQueries > 20) {
      await SecurityLog.create({
        userId: req.user?.userId,
        type: "ANOMALY_DETECTION",
        message: "High frequency query anomaly detected (>20/min)",
        metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
      });
    }

    // PROMPT INJECTION PROTECTION
    if (detectPromptInjection(finalQuery)) {
      logStatus = "flagged";
      finalResponse = "Your query was blocked due to security policy.";
      
      // Log security incident
      await SecurityLog.create({
        userId: req.user?.userId,
        type: "PROMPT_INJECTION",
        message: finalQuery,
        metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
      });

      // Store flagged log before returning safely
      try {
        await ChatLog.create({
          userId: req.user?.userId,
          query: finalQuery,
          response: finalResponse,
          status: logStatus,
          ipAddress: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"]
        });
      } catch (logErr) {
        console.warn("⚠️ Failed to store flagged chat log:", logErr.message);
      }

      return res.status(200).json({
        success: true,
        answer: finalResponse
      });
    }

    // Call RAG passing the user identity
    try {
      const { chatId } = req.body;
      const safeUserId = req.user?.userId || req.user?.id;
      const result = await runRAGPipeline({ 
        query: finalQuery, 
        userId: safeUserId, 
        role: req.user?.role 
      });

      // FORCE SAFE RESPONSE
      const safeAnswer =
        result && typeof result === "string"
          ? result
          : "No response generated.";

      // Document the response safely in thread histories
      const Chat = require("../models/Chat");
      let chatDoc;

      try {
        if (chatId) {
          chatDoc = await Chat.findOne({ _id: chatId, userId: safeUserId });
        }
        
        if (!chatDoc) {
          chatDoc = new Chat({
            userId: safeUserId,
            title: finalQuery.substring(0, 30) || "New Chat"
          });
        }

        chatDoc.messages.push(
          { role: "user", content: query },
          { role: "assistant", content: safeAnswer }
        );

        await chatDoc.save();
      } catch (dbErr) {
        console.warn("⚠️ Failed to store chat context history:", dbErr.message);
      }

      // Log safe interaction (Catch errors locally to prevent interrupt)
      try {
        await ChatLog.create({
          userId: safeUserId,
          query: finalQuery,
          response: safeAnswer,
          status: logStatus,
          ipAddress: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"]
        });
      } catch (logErr) {
        console.warn("⚠️ Failed to store chat log:", logErr.message);
      }

      // FINAL PII MASKING STEP (Senior Backend Security Request)
      const { maskPII: finalMask } = require("../utils/piiMasker");
      const egressAnswer = finalMask(safeAnswer);

      console.log("🚀 FINAL RESPONSE SENT:", egressAnswer);

      return res.status(200).json({
        success: true,
        answer: egressAnswer,
        chatId: chatDoc ? chatDoc._id : null
      });
    } catch (error) {
      console.error("❌ Controller Error:", error);

      const errorAnswer = "Something went wrong. Please try again.";
      console.log("🚀 FINAL RESPONSE SENT (ERROR):", errorAnswer);

      return res.status(200).json({
        success: false,
        answer: errorAnswer
      });
    }
  } catch (outerError) {
    console.error("❌ RAG Controller Error (Top Level):", outerError.stack);
    next(outerError);
  }
};

const getLogs = async (req, res, next) => {
  try {
    // Placeholder logs (since there's no DB/file logger yet)
    return res.status(200).json({
      success: true,
      message: "System logs retrieved",
      data: [
        { timestamp: new Date().toISOString(), level: "INFO", message: "Server started on port 5000" },
        { timestamp: new Date().toISOString(), level: "INFO", message: "Database connected successfully" },
        { timestamp: new Date().toISOString(), level: "INFO", message: "Admin access granted for logs" }
      ]
    });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({}, { embedding: 0 }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  chatWithRAG,
  getLogs,
  getDocuments,
};
