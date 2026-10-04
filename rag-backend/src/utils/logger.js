const Log = require("../models/Log");

const saveLog = async (level, message) => {
  try {
    // Only persist error logs or messages tagged as ingestion/critical
    if (level === "error" || message.includes("[RAG] File processing started") || message.includes("[CRITICAL]")) {
      await Log.create({ level, message });
    }
  } catch (err) {
    // Silently fail if DB is unavailable, avoiding recursive crashes
    console.error("[LOGGER_SYS] Failed to save log to DB:", err.message);
  }
};

const logger = {
  info: (msg) => {
    console.log(`[INFO] ${msg}`);
    saveLog("info", msg);
  },
  warn: (msg) => {
    console.warn(`[WARN] ${msg}`);
    saveLog("warn", msg);
  },
  error: (msg) => {
    console.error(`[ERROR] ${msg}`);
    saveLog("error", msg);
  },
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

module.exports = logger;
