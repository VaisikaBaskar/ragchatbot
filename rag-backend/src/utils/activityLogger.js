const ActivityLog = require("../models/ActivityLog");

/**
 * Log user activity asynchronously without blocking the main thread.
 * Fails silently to prevent system crashes.
 */
const logActivity = async (userId, action, metadata = {}, req) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";

    await ActivityLog.create({
      userId,
      action,
      metadata,
      ip
    });
  } catch (err) {
    // Non-blocking failure
    console.warn(`[ACTIVITY_LOG_FAIL] Failed to log ${action} for user ${userId}:`, err.message);
  }
};

module.exports = { logActivity };
