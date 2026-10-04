const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Legacy fields (Made optional for new ingestion pipeline)
    content: {
      type: String,
      required: false,
    },
    embedding: {
      type: [Number],
      required: false,
    },
    // Legacy metadata
    metadata: {
      fileName: { type: String, required: false },
      uploadedAt: { type: Date, default: Date.now },
      userId: { type: String, default: null },
    },
    
    // New fields for Phase 3 ingestion
    fileName: {
      type: String,
      required: false, // fallback logic handles it
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);


// We need to ensure that the user manually sets up the Vector Index in MongoDB Atlas with:
/*
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
*/

module.exports = mongoose.models.Document || mongoose.model("Document", documentSchema);
