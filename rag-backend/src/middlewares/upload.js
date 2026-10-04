const multer = require("multer");
const path = require("path");

// Use memory storage for quick inline processing
const storage = multer.memoryStorage();

// Accept only PDF, TXT, DOCX
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".txt", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) || file.mimetype === "application/pdf" || file.mimetype === "text/plain" || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Only PDF, TXT, and DOCX are allowed."), false);
  }
};

// 5MB limit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
