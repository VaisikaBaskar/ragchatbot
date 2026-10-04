require('dotenv').config();
const mongoose = require('mongoose');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const arpanetChunks = await Chunk.find({ text: { $regex: /ARPANET/i } }).lean();
    console.log('ARPANET chunks found:', arpanetChunks.length);
    arpanetChunks.forEach((c, i) => {
      console.log(`--- Chunk ${i+1} ---`);
      console.log(c.text);
      console.log('');
    });
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();