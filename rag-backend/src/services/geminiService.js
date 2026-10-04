const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates an AI response using Google Gemini 1.5 Flash.
 * Strictly adheres to retrieved context and safety rules.
 * @param {string[]} contextArray - Array of retrieved text chunks
 * @param {string} query - User's question
 * @returns {Promise<string>} - The AI generated answer
 */
const generateGeminiResponse = async (contextArray, query) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Hybrid Context logic
    const contextAvailable = contextArray && contextArray.length > 0;
    const formattedContext = contextAvailable ? contextArray.join("\n\n").slice(0, 12000) : "";

    const prompt = contextAvailable 
      ? `
You are a highly accurate RAG (Retrieval-Augmented Generation) assistant.

CRITICAL INSTRUCTIONS:
1. Answer ONLY using the provided context.
2. If relevant context exists, answer clearly.
3. If no relevant context exists, say: 'The uploaded documents do not contain this information.'
4. Do NOT use general knowledge, training data, or external information.
5. Do NOT hallucinate or make up information.

Context:
${formattedContext}

Query:
${query}
`
      : `
You are a document-based RAG assistant.

STATUS: No relevant information was found in the uploaded documents.

RESPONSE: The uploaded documents do not contain this information.
`;

    logger.info(`[GEMINI] Requesting response for query. Context length: ${formattedContext.length}`);
    
    const result = await model.generateContent(prompt);
    
    // Check for safety blocks
    if (result.response.promptFeedback?.blockReason) {
      throw new Error(`Gemini Safety Block (Prompt): ${result.response.promptFeedback.blockReason}`);
    }

    const responseText = result.response.text();
    
    // Some models might return empty text if blocked during generation
    if (!responseText || responseText.trim() === "") {
       throw new Error("Gemini returned an empty or blocked response.");
    }

    logger.info("[GEMINI] Response received successfully");
    return responseText;
  } catch (err) {
    logger.error(`[GEMINI] Runtime Error: ${err.message}`);
    // Re-throw to allow llmService to handle fallback
    throw err;
  }
};

module.exports = {
  generateGeminiResponse,
};
