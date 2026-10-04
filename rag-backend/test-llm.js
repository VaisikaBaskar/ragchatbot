const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ChatGroq } = require("@langchain/groq");
require("dotenv").config();

async function testLLMs() {
  console.log("Testing Gemini...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const res = await model.generateContent("Hello!");
    console.log("Gemini Success:", res.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }

  console.log("\nTesting Groq...");
  try {
    const groqModel = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama3-8b-8192", 
    });
    const res = await groqModel.invoke([["user", "Hello!"]]);
    console.log("Groq Success:", res.content);
  } catch (err) {
    console.error("Groq Error:", err.message);
  }
}

testLLMs();
