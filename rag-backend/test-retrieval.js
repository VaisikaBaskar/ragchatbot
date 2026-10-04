require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const { retrieveSimilarDocuments } = require("./src/services/retrievalService");
const { generateEmbedding } = require("./src/utils/embedding");
const { runRAGPipeline } = require("./src/services/ragPipeline");

async function testRetrieval() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB Connected.");

  const query = "Explain different types of cyber attacks like phishing, malware, and ransomware.";
  
  // Provide mock user that matches ruthvik@gmail.com
  const user = await User.findOne({ email: "ruthvik@gmail.com" });
  if (!user) {
    console.log("User ruthvik not found");
    process.exit(1);
  }

  console.log("Testing with user:", user.email, "id:", user._id);
  const userPayload = { userId: user._id.toString(), role: user.role };

  const emb = await generateEmbedding(query);
  const docs = await retrieveSimilarDocuments(emb, query, userPayload.userId, userPayload.role, 5);
  
  console.log(`\nRetrieved ${docs.length} docs for user`);
  docs.forEach((doc, i) => {
    console.log(`Doc ${i+1}: score=${doc.score}, fileName=${doc.fileName}, text=${doc.text.slice(0, 50)}...`);
  });

  console.log("\nRunning full RAG pipeline...");
  const answer = await runRAGPipeline(query, userPayload);
  console.log("\nPipeline Answer:", answer);
  
  process.exit(0);
}
testRetrieval();
