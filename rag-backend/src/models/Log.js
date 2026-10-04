const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "error", "warn", "debug", "critical"],
      default: "info",
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Log || mongoose.model("Log", logSchema);
