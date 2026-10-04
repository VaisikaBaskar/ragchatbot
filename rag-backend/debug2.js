require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('=== SEARCHING FOR SPECIFIC CONTENT ===');

    // Search for chunks containing ARPANET
    const arpanetChunks = await Chunk.find({
      text: { $regex: /ARPANET/i }
    }).limit(5).lean();

    console.log('Chunks containing "ARPANET":', arpanetChunks.length);
    arpanetChunks.forEach((c, i) => {
      console.log(`${i+1}. ${c.text.substring(0, 200)}...`);
    });

    // Search for chunks containing internet history
    const internetChunks = await Chunk.find({
      text: { $regex: /internet|history|ARPANET|cloud computing/i }
    }).limit(10).lean();

    console.log('\nChunks containing internet/cloud content:', internetChunks.length);
    internetChunks.forEach((c, i) => {
      console.log(`${i+1}. ${c.text.substring(0, 150)}...`);
    });

    // Check all document filenames again
    console.log('\n=== ALL DOCUMENT FILENAMES ===');
    const docs = await Document.find({}).lean();
    docs.forEach((d, i) => {
      console.log(`${i+1}. ${d.fileName}`);
    });

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();