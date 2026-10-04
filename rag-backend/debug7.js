require('dotenv').config();
const { generateAnswer } = require('./src/services/llmService');
const { generateEmbedding } = require('./src/utils/embedding');
const mongoose = require('mongoose');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const query = 'What is ARPANET and why was it created?';
    const chunk = await Chunk.findOne({ text: { $regex: /As cold war tensions grew/i } }).lean();
    if (!chunk) {
      console.error('No chunk found');
      process.exit(1);
    }
    console.log('Chunk text:', chunk.text);

    const answer = await generateAnswer([chunk.text], query);
    console.log('ANSWER:', answer);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  }
  process.exit(0);
})();