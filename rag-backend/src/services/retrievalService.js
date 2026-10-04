const DocumentModel = require("../models/Document");
const ChunkModel = require("../models/Chunk");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const logger = require("../utils/logger");
const { calculateCosineSimilarity } = require("../utils/embedding");

const STOP_WORDS = new Set([
  "what",
  "why",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "how",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "done",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "and",
  "or",
  "but",
  "for",
  "from",
  "with",
  "into",
  "onto",
  "about",
  "this",
  "that",
  "these",
  "those",
  "they",
  "their",
  "them",
  "you",
  "your",
  "yours",
  "it",
  "its",
  "to",
  "of",
  "in",
  "on",
  "by",
  "as",
  "at",
  "an",
  "a",
  "the",
]);

const normalizeQueryWords = (text) => {
  if (!text || typeof text !== "string") return [];
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    )
  );
};

const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const buildKeywordPriority = (queryTokens, normalizedChunk) => {
  if (!queryTokens.length || !normalizedChunk) {
    return {
      keywordHits: 0,
      exactTokenMatches: 0,
      lexicalCoverage: 0,
      priorityScore: 0,
      hasStrongKeywordMatch: false,
    };
  }

  let keywordHits = 0;
  let exactTokenMatches = 0;
  let longTokenMatches = 0;

  queryTokens.forEach((token) => {
    if (!normalizedChunk.includes(token)) return;

    keywordHits += 1;
    if (new RegExp(`\\b${token}\\b`, "i").test(normalizedChunk)) {
      exactTokenMatches += 1;
    }
    if (token.length >= 6) {
      longTokenMatches += 1;
    }
  });

  const lexicalCoverage = keywordHits / queryTokens.length;
  const hasStrongKeywordMatch = longTokenMatches > 0;

  // Bias toward exact lexical/entity matches so explicit terms like "ARPANET" are never buried.
  const priorityScore =
    lexicalCoverage * 1.4 +
    exactTokenMatches * 0.18 +
    (hasStrongKeywordMatch ? 0.45 : 0);

  return {
    keywordHits,
    exactTokenMatches,
    lexicalCoverage,
    priorityScore,
    hasStrongKeywordMatch,
  };
};

const coerceObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const retrieveSimilarDocuments = async (queryEmbedding, queryTextOrUserId, userIdOrRole, roleOrK, maybeK) => {
  let queryText;
  let userId;
  let role;
  let k;

  if (typeof roleOrK === "number" && maybeK === undefined) {
    // Legacy signature: (queryEmbedding, userId, role, k)
    queryText = "";
    userId = queryTextOrUserId;
    role = userIdOrRole;
    k = roleOrK;
  } else {
    queryText = queryTextOrUserId;
    userId = userIdOrRole;
    role = roleOrK;
    k = maybeK === undefined ? 5 : maybeK;
  }

  logger.info(`[RAG] Vector search retrieval for User: ${userId} (Role: ${role})`);

  if (mongoose.connection.readyState < 1) {
    logger.info("[RAG] No active MongoDB connection. Connecting before retrieval.");
    await connectDB();
  }

  const safeUserId = coerceObjectId(userId);
  let accessFilter = {};
  let accessibleDocIds = [];

  if (role !== "admin") {
    const ownershipFilter = [{ uploadedBy: null }, { isPublic: true }];
    if (safeUserId) {
      ownershipFilter.unshift({ uploadedBy: safeUserId });
    } else {
      logger.warn(`[RAG][DEBUG] Invalid userId for ACL filter: ${userId}`);
    }

    accessibleDocIds = await DocumentModel.find({ $or: ownershipFilter }).distinct("_id");

    logger.info(`[RAG][DEBUG] Accessible document ids: ${accessibleDocIds.length}`);
    if (!accessibleDocIds.length) {
      logger.warn("[RAG] No accessible documents found for user.");
      return [];
    }

    accessFilter = {
      documentId: { $in: accessibleDocIds },
    };
  }

  try {
    try {
      const fetchLimit = role === "admin" ? k : k * 4;
      const newPipeline = [
        {
          $vectorSearch: {
            index: "chunks_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: fetchLimit * 10,
            limit: fetchLimit,
            filter: accessFilter,
          },
        },
        {
          $lookup: {
            from: "documents",
            localField: "documentId",
            foreignField: "_id",
            as: "parentDocument",
          },
        },
        { $unwind: { path: "$parentDocument", preserveNullAndEmptyArrays: true } },
        { $limit: k },
        {
          $project: {
            _id: 0,
            text: 1,
            fileName: "$parentDocument.fileName",
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];

      const newResults = await ChunkModel.aggregate(newPipeline);
      if (newResults && newResults.length > 0) {
        logger.info(`[RAG][DEBUG] Atlas vector results: ${newResults.length}`);
        return newResults;
      }
    } catch (atlasError) {
      logger.warn("[RAG] Atlas vector search unavailable, using local fallback.");
      logger.debug(`Atlas Error: ${atlasError.message}`);
    }

    const fetchLimit = 5000;
    const normalizedQuery = normalizeText(queryText || "");
    const queryTokens = normalizeQueryWords(queryText || "");

    logger.info(`[RAG] Local similarity fallback. Query tokens: ${queryTokens.join(", ")}`);
    logger.info(`[RAG][DEBUG] Access filter: ${JSON.stringify(accessFilter)}`);

    let allChunks = await ChunkModel.find(accessFilter)
      .limit(fetchLimit)
      .select("text embedding documentId")
      .populate("documentId", "fileName")
      .lean();

    logger.info(`[RAG][DEBUG] Chunk candidates after ACL filter: ${allChunks.length}`);

    if (!allChunks.length) {
      logger.info("[RAG] No Chunk documents found. Checking legacy Document collection for embedded content.");

      const legacyFilter = {
        content: { $exists: true, $ne: "" },
        embedding: { $exists: true, $ne: null },
      };
      if (role !== "admin") {
        legacyFilter._id = { $in: accessibleDocIds };
      }

      const legacyDocs = await DocumentModel.find(legacyFilter)
        .limit(fetchLimit)
        .select("content embedding fileName")
        .lean();

      logger.info(`[RAG][DEBUG] Legacy document candidates: ${legacyDocs.length}`);
      if (!legacyDocs.length) {
        logger.warn("[RAG] No legacy Document embeddings found.");
        return [];
      }

      allChunks = legacyDocs.map((doc) => ({
        text: doc.content || "",
        embedding: doc.embedding || [],
        documentId: null,
        fileName: doc.fileName || "Unknown",
      }));
    }

    const scoredResults = allChunks
      .map((chunk) => {
        const chunkText = chunk.text || "";
        const normalizedChunk = normalizeText(chunkText);

        const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding || []);
        const keywordPriority = buildKeywordPriority(queryTokens, normalizedChunk);
        const exactPhraseBoost = normalizedQuery && normalizedChunk.includes(normalizedQuery) ? 0.35 : 0;
        const boostedScore = similarity + exactPhraseBoost + keywordPriority.priorityScore;

        return {
          text: chunkText,
          fileName: chunk.documentId?.fileName || chunk.fileName || "Unknown",
          score: boostedScore,
          similarity,
          keywordHits: keywordPriority.keywordHits,
          lexicalCoverage: keywordPriority.lexicalCoverage,
          strongKeywordMatch: keywordPriority.hasStrongKeywordMatch,
          exactPhraseMatch: exactPhraseBoost > 0,
        };
      })
      .filter((result) => result.score >= 0)
      .sort((a, b) => {
        if (b.strongKeywordMatch !== a.strongKeywordMatch) {
          return Number(b.strongKeywordMatch) - Number(a.strongKeywordMatch);
        }
        if (b.keywordHits !== a.keywordHits) {
          return b.keywordHits - a.keywordHits;
        }
        if (b.lexicalCoverage !== a.lexicalCoverage) {
          return b.lexicalCoverage - a.lexicalCoverage;
        }
        return b.score - a.score;
      })
      .slice(0, k);

    logger.info(`[RAG][DEBUG] Retrieval output count: ${scoredResults.length}`);
    scoredResults.slice(0, Math.min(5, scoredResults.length)).forEach((result, index) => {
      logger.info(
        `[RAG][DEBUG] Top ${index + 1}: score=${result.score.toFixed(3)}, sim=${result.similarity.toFixed(3)}, keywords=${result.keywordHits}, coverage=${result.lexicalCoverage.toFixed(2)}, strongKeyword=${result.strongKeywordMatch}, exactMatch=${result.exactPhraseMatch}, file=${result.fileName}, preview=${result.text.substring(0, 160).replace(/\n/g, " ")}...`
      );
    });

    return scoredResults;
  } catch (error) {
    logger.error(`[RAG] Critical error during retrieval: ${error.message}`);
    return [];
  }
};

module.exports = {
  retrieveSimilarDocuments,
};
