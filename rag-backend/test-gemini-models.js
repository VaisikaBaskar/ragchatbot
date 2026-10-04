const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listGeminiModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Actually we need to fetch from REST because SDK might not have listModels trivially if we just want to see raw list
  // Wait, no, we can fetch from REST API directly using fetch
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
  } catch (err) {
    console.error(err);
  }
}
listGeminiModels();
