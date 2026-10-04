require('dotenv').config();
const { retrieveSimilarDocuments } = require('./src/services/retrievalService');
const { generateAnswer } = require('./src/services/llmService');
const { generateEmbedding } = require('./src/utils/embedding');

(async () => {
  try {
    const query = 'What is ARPANET and why was it created?';
    const queryEmbedding = await generateEmbedding(query);
    console.log('Generated embedding length:', queryEmbedding.length);

    const results = await retrieveSimilarDocuments(queryEmbedding, query, '69ef45d6241f8e35dafec15f', 'user', 10);
    console.log('Retrieved docs:', results.length);
    results.forEach((r, i) => {
      console.log(`${i+1}. score=${r.score.toFixed(3)} preview=${r.text.substring(0, 150)}...`);
    });

    const contextChunks = results.map((doc) => doc.text);
    const answer = await generateAnswer(contextChunks, query);
    console.log('ANSWER:', answer);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  }
  process.exit(0);
})();