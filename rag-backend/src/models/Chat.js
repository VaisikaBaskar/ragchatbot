const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: "New Chat"
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
