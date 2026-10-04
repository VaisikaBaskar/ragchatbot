require("dotenv").config();
const mongoose = require("mongoose");
const ChunkModel = require("./src/models/Chunk");
const DocumentModel = require("./src/models/Document");
const User = require("./src/models/User");

async function debugDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB Connected.");

  const docs = await DocumentModel.find({}).populate("uploadedBy");
  console.log("Documents in DB:");
  docs.forEach(doc => {
    console.log(`- Doc: ${doc.fileName}, id: ${doc._id}, uploadedBy: ${doc.uploadedBy ? doc.uploadedBy.email : "null"}`);
  });

  const chunks = await ChunkModel.find({}).populate("documentId");
  console.log(`\nTotal chunks: ${chunks.length}`);
  
  process.exit(0);
}
debugDB();
