const { generateGeminiResponse } = require("./geminiService");
const { ChatGroq } = require("@langchain/groq");
const logger = require("../utils/logger");

/**
 * Unified LLM Orchestrator
 * Attempts Gemini first, falls back to Groq on failure.
 * @param {string[]} contextArray - Array of text chunks
 * @param {string} query - User question context
 * @returns {Promise<string>} - Generated answer
 */
const generateAnswer = async (contextArray, query) => {
  try {
    // 1. PRIMARY: Google Gemini 1.5 Flash
    logger.info("[LLM] Attempting generation with Gemini (Primary)");
    return await generateGeminiResponse(contextArray, query);
    
  } catch (geminiError) {
    logger.warn(`[LLM] Gemini generation failed: ${geminiError.message}. Switching to Groq fallback...`);

    // 2. FALLBACK: Groq (Llama 3)
    if (!process.env.GROQ_API_KEY) {
      logger.error("[LLM] Critical: Gemini failed and GROQ_API_KEY is missing.");
      return "I'm sorry, I'm having trouble connecting to my AI services. Please check your configuration.";
    }

    try {
      const groqModel = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.1-8b-instant", // Updated due to groq deprecating older llama models
      });

      const contextAvailable = contextArray && contextArray.length > 0;
      const formattedContext = contextAvailable ? contextArray.join("\n\n").slice(0, 12000) : "No specific documents provided.";

      const systemPrompt = contextAvailable 
        ? `You are a RAG assistant. Answer ONLY using the provided context. If relevant context exists, answer clearly. If no relevant context exists, say: 'The uploaded documents do not contain this information.' Do NOT use general knowledge or external information.

Context:
${formattedContext}`
        : `You are a document-based RAG assistant. No relevant information was found in the uploaded documents. Respond with: 'The uploaded documents do not contain this information.'`;
      
      logger.info(`[LLM] Calling Groq (Fallback) - Context Available: ${contextAvailable}`);
      const response = await groqModel.invoke([
        ["system", systemPrompt],
        ["user", query]
      ]);

      return response.content;
    } catch (groqError) {
      logger.error(`[LLM] Groq fallback also failed: ${groqError.message}`);
      return "Sorry, I'm experiencing an outage across all AI providers. Please try again later.";
    }
  }
};

module.exports = {
  generateAnswer,
};
