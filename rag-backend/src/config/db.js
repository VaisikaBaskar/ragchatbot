const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    // DO NOT override existing connection if mongoose is already connected
    if (mongoose.connection.readyState >= 1) {
      logger.info("[RAG] Mongoose already connected, skipping new connection.");
      return;
    }

    const mUri = process.env.MONGO_URI;
    if (!mUri) {
      logger.warn("[RAG] MONGO_URI not found in env values. DB connection skipped.");
      return;
    }

    await mongoose.connect(mUri);
    logger.info("[RAG] MongoDB successfully connected.");
  } catch (error) {
    logger.error(`[RAG] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
