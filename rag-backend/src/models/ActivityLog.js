const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["CHAT", "UPLOAD", "FAILED_UPLOAD", "BLOCKED_QUERY"],
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ip: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
