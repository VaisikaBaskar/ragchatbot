const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: false, // fallback for legacy
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Chunk || mongoose.model("Chunk", chunkSchema);
