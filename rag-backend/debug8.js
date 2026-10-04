require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Chunk = require('./src/models/Chunk');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const chunk = await Chunk.findOne({ text: { $regex: /As cold war tensions grew/i } }).lean();
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `You are a highly accurate RAG (Retrieval-Augmented Generation) assistant.

CRITICAL INSTRUCTIONS:
1. Answer ONLY from the Context provided below.
2. If the Context does not contain information about the query, respond EXACTLY with: "The uploaded documents do not contain information about this topic."
3. Do NOT use general knowledge, training data, or external information.
4. Do NOT hallucinate or make up information.
5. If unsure, respond with the exact message above.

Context:
${chunk.text}

Query:
What is ARPANET and why was it created?
`;
    console.log('Prompt length:', prompt.length);
    const result = await model.generateContent(prompt);
    console.log('Result raw:', result);
    console.log('Response text:', result.response.text());
    console.log('Feedback:', JSON.stringify(result.response.promptFeedback, null, 2));
  } catch (e) {
    console.error('ERR', e);
  }
  process.exit(0);
})();