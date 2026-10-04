const logger = require("./logger");

/**
 * Generates a deterministic hash-based embedding for a given text.
 * Improved formula using prime-multiplied indexing.
 * @param {string} text - The input text (chunk or query)
 * @returns {number[]} - 1536-dimensional normalized vector
 */
function generateEmbedding(text) {
  if (!text || typeof text !== "string") return new Array(1536).fill(0);

  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const vector = new Array(1536).fill(0);
  const len = normalized.length;

  for (let i = 0; i < len; i++) {
    const index = (i * 31) % 1536;
    vector[index] += normalized.charCodeAt(i) / 255;
  }

  return vector.map((v) => v / (len || 1));
}

/**
 * Calculates cosine similarity between two vectors.
 * Higher value means more similar (max 1.0).
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

module.exports = {
  generateEmbedding,
  calculateCosineSimilarity,
};
