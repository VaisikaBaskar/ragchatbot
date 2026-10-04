require('dotenv').config();
const mongoose = require('mongoose');
const Chunk = require('./src/models/Chunk');
const { generateEmbedding, calculateCosineSimilarity } = require('./src/utils/embedding');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const query = 'What is ARPANET and why was it created?';
    const queryEmbedding = await generateEmbedding(query);
    const chunks = await Chunk.find({}).lean();
    console.log('Total chunks:', chunks.length);

    const scored = chunks.map((chunk) => ({
      id: chunk._id.toString(),
      text: chunk.text,
      score: calculateCosineSimilarity(queryEmbedding, chunk.embedding || []),
      hasArpanet: /arpanet/i.test(chunk.text),
    }));

    const relevant = scored.filter(c => c.hasArpanet).sort((a,b)=>b.score-a.score);
    console.log('Chunks containing ARPANET:', relevant.length);
    relevant.forEach((r, i) => {
      console.log(`${i+1}. score=${r.score.toFixed(3)} text=${r.text.substring(0, 200)}...`);
    });

    const top = scored.sort((a,b)=>b.score-a.score).slice(0, 30);
    console.log('\nTop 30 chunks by score:');
    top.forEach((r, i) => {
      console.log(`${i+1}. score=${r.score.toFixed(3)} arpanet=${r.hasArpanet} text=${r.text.substring(0, 120).replace(/\n/g,' ')}...`);
    });
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();