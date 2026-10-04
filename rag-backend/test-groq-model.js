const { ChatGroq } = require("@langchain/groq");
require("dotenv").config();

async function testGroq() {
  try {
    const groqModel = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.1-8b-instant", 
    });
    const res = await groqModel.invoke([["user", "Hello!"]]);
    console.log("Groq Success Llama 3.1 8B:", res.content);
  } catch (err) {
    console.error("Groq Error 3.1 8B:", err.message);
  }
}
testGroq();
