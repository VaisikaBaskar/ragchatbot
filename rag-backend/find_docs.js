require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('=== FINDING DOCUMENTS WITH ARPANET/CLOUD CONTENT ===');

    // Find chunks containing ARPANET
    const arpanetChunks = await Chunk.find({
      text: { $regex: /ARPANET/i }
    }).lean();

    console.log('ARPANET chunks found:', arpanetChunks.length);

    const arpanetDocIds = [...new Set(arpanetChunks.map(c => c.documentId.toString()))];
    console.log('Documents containing ARPANET:', arpanetDocIds);

    // Find chunks containing cloud computing
    const cloudChunks = await Chunk.find({
      text: { $regex: /cloud computing/i }
    }).lean();

    console.log('Cloud computing chunks found:', cloudChunks.length);

    const cloudDocIds = [...new Set(cloudChunks.map(c => c.documentId.toString()))];
    console.log('Documents containing cloud computing:', cloudDocIds);

    // Find chunks containing "Brief History of the Internet"
    const historyChunks = await Chunk.find({
      text: { $regex: /Brief History of the Internet/i }
    }).lean();

    console.log('Internet history chunks found:', historyChunks.length);

    const historyDocIds = [...new Set(historyChunks.map(c => c.documentId.toString()))];
    console.log('Documents containing internet history:', historyDocIds);

    // Get all unique document IDs that contain the content we need
    const allNeededDocIds = [...new Set([...arpanetDocIds, ...cloudDocIds, ...historyDocIds])];
    console.log('All documents needed for testing:', allNeededDocIds);

    // Get document details
    console.log('\n=== DOCUMENT DETAILS ===');
    for (const docId of allNeededDocIds) {
      const doc = await Document.findById(docId).lean();
      if (doc) {
        console.log(`ID: ${doc._id.toString()}`);
        console.log(`File: ${doc.fileName}`);
        console.log(`Owner: ${doc.uploadedBy || 'null'}`);
        console.log(`Public: ${doc.isPublic || false}`);
        console.log('');
      }
    }

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();