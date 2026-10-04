/**
 * Utility for anonymizing sensitive user data in AI generated outputs.
 * Provides protection against PII leakage through Regex-based masking.
 */
const maskPII = (text) => {
  if (!text || typeof text !== "string") return text;

  return text
    // Mask Indian Phones (10 digits starting with 6-9)
    .replace(/\b[6-9]\d{9}\b/g, "[PHONE]")
    // Mask Emails
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    // Mask Aadhaar Numbers (12 digits)
    .replace(/\b\d{12}\b/g, "[AADHAAR]")
    // Mask PAN Cards (5 alpha, 4 numeric, 1 alpha)
    .replace(/\b[A_Z]{5}\d{4}[A-Z]{1}\b/gi, "[PAN_INDEX]");
};

module.exports = {
  maskPII
};
