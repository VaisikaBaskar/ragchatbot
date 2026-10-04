const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // may be null for unauth attempts
    },
    type: {
      type: String,
      required: true,
      enum: ["LOGIN", "UPLOAD", "ERROR", "BLOCKED_QUERY", "PROMPT_INJECTION", "UNAUTHORIZED_ACCESS", "MALICIOUS_UPLOAD", "ANOMALY_DETECTION"],
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      query: String, // context of injection
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.SecurityLog || mongoose.model("SecurityLog", securityLogSchema);
