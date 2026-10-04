const express = require("express");
const router = express.Router();
const { 
  getAnalytics, 
  listDocuments, 
  deleteDocument, 
  listUsers, 
  upgradeUser, 
  deleteUser, 
  getChatLogs,
  getSecurityLogs,
  getActivityLogs
} = require("../controllers/adminController");
const { authenticateToken, authorize } = require("../middlewares/auth");

// Apply admin protection to ALL routes in this file
router.use(authenticateToken);
router.use(authorize(["admin"]));

// 1. Analytics Dashboard
router.get("/analytics", getAnalytics);

// 2. Document Management
router.get("/documents", listDocuments);
router.delete("/document/:id", deleteDocument);

// 3. User Management
router.get("/users", listUsers);
router.patch("/user/:id/upgrade", upgradeUser);
router.delete("/user/:id", deleteUser);

// 4. Chat Log Monitoring
router.get("/chats", getChatLogs);

// 5. Security Incident Monitoring
router.get("/security-logs", getSecurityLogs);

// 6. Activity Monitoring
router.get("/activity-logs", getActivityLogs);

module.exports = router;
