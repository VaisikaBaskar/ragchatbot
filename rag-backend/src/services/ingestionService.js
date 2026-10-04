const pdfModule = require("pdf-parse");
// Handle the modern pdf-parse library which exports as a Module object
const pdfParse = pdfModule.PDFParse || pdfModule.default || pdfModule;
const mammoth = require("mammoth");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const DocumentModel = require("../models/Document");
const ChunkModel = require("../models/Chunk");
const logger = require("../utils/logger");
const { generateEmbedding } = require("../utils/embedding");

const sanitizeText = (text) => {
  if (!text) return "";

  return text
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onload=/gi, "");
};

const isMaliciousContent = (text) => {
  const patterns = [
    "eval(",
    "<script>",
    "drop table",
    "select * from",
    "insert into",
    "rm -rf",
    "chmod 777"
  ];

  const lower = text.toLowerCase();
  return patterns.some(p => lower.includes(p));
};

const extractText = async (file) => {
  const { originalname, buffer, mimetype } = file;

  if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
    // 1. SAFETY CHECK (Step 3)
    if (typeof pdfParse !== "function") {
      logger.error("[PDF_INIT_ERROR] PDF parser not initialized correctly");
      throw new Error("PDF parser not initialized correctly");
    }

    // 2. PROTECTED PDF PARSING (Buffer-to-Uint8Array Safe Logic)
    try {
      let text = "";
      // Modern pdf-parse v2.x requires Uint8Array, not Buffer
      const u8Data = new Uint8Array(buffer);

      try {
        // Attempt modern class-based invocation
        const pdf = new pdfParse(u8Data);
        if (typeof pdf.load === "function") {
          await pdf.load();
          const data = await pdf.getText();
          // Extract the actual string content from the result object
          text = typeof data === "object" ? data.text : data;
        } else {
          throw new Error("NOT_A_CLASS");
        }
      } catch (classErr) {
        // Fallback to legacy function-based invocation
        const data = await pdfParse(buffer);
        text = data.text;
      }
      return text;
    } catch (err) {
      console.error("[PDF_PARSE_ERROR]", err.message);
      throw new Error("Failed to process PDF file: " + err.message);
    }
  } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || originalname.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (mimetype === "text/plain" || originalname.endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type for text extraction");
  }
};

const processFile = async (file, userId = null) => {
  logger.info(`[RAG] File processing started for: ${file.originalname}`);

  try {
    // 1. Extract Text
    const extractedText = await extractText(file);
    if (!extractedText || extractedText.trim() === "") throw new Error("Extracted text is empty");

    // 2. Sanitize and Malicious Check (Senior Security Request Step 4)
    const rawText = extractedText;
    const cleanText = sanitizeText(rawText);

    if (isMaliciousContent(cleanText)) {
      throw new Error("MALICIOUS_CONTENT");
    }

    // 3. Chunk text (Continuing with safe content)
    logger.info(`[RAG] Extracted text length: ${rawText.length}`);
    logger.info(`[RAG] Sample extracted text: ${rawText.slice(0, 800).replace(/\n/g, ' ')}...`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await textSplitter.splitText(cleanText);
    logger.info(`[RAG] File split into ${chunks.length} chunks`);
    chunks.slice(0, 3).forEach((chunk, index) => {
      logger.info(`[RAG] Chunk ${index + 1} length=${chunk.length}: ${chunk.slice(0, 180).replace(/\n/g, ' ')}...`);
    });

    // 4. Generate deterministic embeddings using shared utility (single embedding source for upload + query)
    const embeddedChunks = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk)));
    
    logger.info(`[RAG] Embeddings generated: ${embeddedChunks.length} chunks, each ${embeddedChunks[0]?.length ?? 0}-dim`);

    // 5. Persist vectors and wait for completion before returning success
    let storedChunkCount = 0;
    let storageMode = "chunk_collection";
    let parentDocumentId = null;

    try {
      // Create one parent document + many chunk records
      const newDoc = await DocumentModel.create({
        fileName: file.originalname,
        uploadedBy: userId,
      });
      parentDocumentId = newDoc._id;

      const chunksToInsert = chunks.map((chunk, index) => ({
        text: chunk,
        embedding: embeddedChunks[index],
        documentId: newDoc._id,
        uploadedBy: userId
      }));

      const insertedChunks = await ChunkModel.insertMany(chunksToInsert);
      storedChunkCount = insertedChunks.length;
      logger.info("[CRITICAL] [RAG] Embeddings stored securely in new Chunk collection");
    } catch (newFlowError) {
      logger.warn(`[RAG] New insertion flow failed (${newFlowError.message}). Falling back to legacy insertion.`);
      storageMode = "legacy_document_collection";
      
      // Fallback: Use the old monolithic Document insertion flow
      const docsToInsert = chunks.map((chunk, index) => ({
        content: chunk,
        embedding: embeddedChunks[index],
        metadata: {
          fileName: file.originalname,
          userId: userId,
        },
        fileName: file.originalname,
        uploadedBy: userId,
      }));

      const insertedDocs = await DocumentModel.insertMany(docsToInsert);
      storedChunkCount = insertedDocs.length;
      logger.info("[RAG] Embeddings stored using Legacy Document collection fallback");
    }

    const totalDocumentCount = await DocumentModel.countDocuments({});
    const totalChunkCount = await ChunkModel.countDocuments({});
    logger.info(`[RAG][DEBUG] Inserted vector count: ${storedChunkCount}`);
    logger.info(`[RAG][DEBUG] Current DB document count: ${totalDocumentCount}`);
    logger.info(`[RAG][DEBUG] Current DB chunk count: ${totalChunkCount}`);
    logger.info(`[RAG][DEBUG] Storage mode: ${storageMode}, parentDocumentId: ${parentDocumentId || "legacy-multiple-documents"}`);

    logger.info(`[RAG] File processed successfully: ${file.originalname}`);


    return {
      success: true,
      message: "File ingested and embedded successfully via deterministic utility.",
      chunksProcessed: chunks.length,
      insertedVectors: storedChunkCount,
      fileName: file.originalname,
      provider: "deterministic-hash-31",
    };
  } catch (error) {
    logger.error(`[RAG] Error processing file ${file.originalname}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  processFile,
};
