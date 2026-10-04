require('dotenv').config();
const { retrieveSimilarDocuments } = require('./src/services/retrievalService');
const { generateEmbedding } = require('./src/utils/embedding');

(async () => {
  try {
    console.log('=== TESTING RETRIEVAL FOR USER QUERIES ===');

    // Test queries that should work
    const testQueries = [
      "What is ARPANET and why was it created?",
      "What is cloud computing and how does Infrastructure as a Service (IaaS) work?",
      "Brief History of the Internet"
    ];

    for (const query of testQueries) {
      console.log(`\n--- Testing query: "${query}" ---`);

      const queryEmbedding = await generateEmbedding(query);
      console.log(`Query embedding length: ${queryEmbedding.length}`);

      // Use the test user ID from previous tests
      const results = await retrieveSimilarDocuments(queryEmbedding, query, '69ef45d6241f8e35dafec15f', 'user', 5);
      console.log(`Retrieved results: ${results.length}`);

      results.forEach((r, i) => {
        console.log(`Result ${i+1}: score=${r.score.toFixed(3)}, text="${r.text.substring(0, 100)}..."`);
      });

      if (results.length === 0) {
        console.log('❌ NO RESULTS FOUND - This is the bug!');
      }
    }

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();