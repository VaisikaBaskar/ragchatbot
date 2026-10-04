const ActivityLog = require("../models/ActivityLog");

/**
 * Detect suspicious behavior based on recent activity frequency.
 * Returns { suspicious: boolean, reason: string|null }
 */
const detectAnomaly = async (userId) => {
  try {
    const since = new Date(Date.now() - 60 * 1000); // Last 1 minute

    // 1. Total Activity Count (Rate Limit)
    const totalActions = await ActivityLog.countDocuments({
      userId,
      timestamp: { $gte: since }
    });

    if (totalActions > 20) {
      return { suspicious: true, reason: "Too many requests" };
    }

    // 2. Malicious Intent Count (Repeated Security Blocks)
    const blockedEvents = await ActivityLog.countDocuments({
      userId,
      action: "BLOCKED_QUERY",
      timestamp: { $gte: since }
    });

    if (blockedEvents > 3) {
      return { suspicious: true, reason: "Repeated malicious queries" };
    }

    return { suspicious: false, reason: null };
  } catch (err) {
    console.error(`[ANOMALY_DETECTOR_FAIL] Error checking user ${userId}:`, err.message);
    return { suspicious: false, reason: null }; // Default to safe on error
  }
};

module.exports = { detectAnomaly };
