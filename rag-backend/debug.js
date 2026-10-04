require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('=== DOCUMENTS IN DATABASE ===');
    const docs = await Document.find({}).lean();
    console.log('Total documents:', docs.length);

    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      console.log(`${i+1}. ID: ${d._id.toString()}`);
      console.log(`   File: ${d.fileName}`);
      console.log(`   Owner: ${d.uploadedBy || 'null'}`);
      console.log(`   Public: ${d.isPublic || false}`);
      console.log(`   Content length: ${d.content ? d.content.length : 'N/A'}`);
      console.log('');
    }

    console.log('=== CHUNKS SAMPLE ===');
    const chunks = await Chunk.find({}).limit(10).lean();
    console.log('Total chunks (sample):', chunks.length);

    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      const c = chunks[i];
      console.log(`${i+1}. Chunk ID: ${c._id.toString()}`);
      console.log(`   Document ID: ${c.documentId.toString()}`);
      console.log(`   Text length: ${c.text.length}`);
      console.log(`   Text preview: ${c.text.substring(0, 100)}...`);
      console.log(`   Has embedding: ${!!c.embedding}`);
      console.log(`   Embedding length: ${c.embedding ? c.embedding.length : 0}`);
      console.log('');
    }

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();