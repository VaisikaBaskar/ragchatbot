const { generateEmbedding } = require("../utils/embedding");
const { retrieveSimilarDocuments } = require("./retrievalService");
const { generateAnswer } = require("./llmService");
const logger = require("../utils/logger");

const runRAGPipeline = async ({ query, userId, role }) => {
  logger.info(`[RAG] Incoming query: ${query}`);

  let relevantDocs = [];
  try {
    // Upload and query both use the same embedding utility.
    const queryEmbedding = await generateEmbedding(query);
    logger.info(`[RAG][DEBUG] Query embedding length: ${queryEmbedding.length}`);
    logger.info(`[RAG][DEBUG] Query vector sample: ${JSON.stringify(queryEmbedding.slice(0, 5))}`);

    if (!queryEmbedding || queryEmbedding.length !== 1536) {
      throw new Error(`Invalid query embedding: expected 1536 dimensions, got ${queryEmbedding?.length ?? 0}`);
    }

    relevantDocs = await retrieveSimilarDocuments(queryEmbedding, query, userId, role, 20);
    logger.info(`[RAG][DEBUG] Retrieved docs count: ${relevantDocs.length}`);
    relevantDocs.slice(0, Math.min(5, relevantDocs.length)).forEach((doc, index) => {
      logger.info(
        `[RAG][DEBUG] Retrieved ${index + 1}: score=${Number(doc.score || 0).toFixed(3)}, file=${doc.fileName || "Unknown"}, preview=${(doc.text || "").substring(0, 160).replace(/\n/g, " ")}...`
      );
    });
  } catch (err) {
    logger.error(`[RAG] Retrieval error: ${err.message}`);
  }

  if (!relevantDocs || relevantDocs.length === 0) {
    logger.warn("[RAG] No relevant documents found for query.");
    return "The uploaded documents do not contain information about this topic.";
  }

  const contextChunks = relevantDocs
    .map((doc) => doc.text || doc.content || "")
    .filter(Boolean);

  let answer = "";
  try {
    answer = await generateAnswer(contextChunks, query);
    logger.info(`[RAG][DEBUG] LLM answer preview: ${String(answer).substring(0, 200).replace(/\n/g, " ")}...`);
  } catch (error) {
    logger.error(`[RAG] LLM service error: ${error.message}`);
    return "AI service temporarily unavailable.";
  }

  const { maskPII } = require("../utils/piiMasker");
  const sanitizedAnswer = maskPII(answer);

  if (!sanitizedAnswer || typeof sanitizedAnswer !== "string") {
    return "Unable to generate response. Please try again.";
  }

  return sanitizedAnswer;
};

module.exports = {
  runRAGPipeline,
};
