const maskPII = (text) => {
  if (!text) return text;

  let masked = text;

  //----------------------------------
  // EMAIL MASKING
  //----------------------------------
  masked = masked.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[EMAIL_MASKED]"
  );

  //----------------------------------
  // PHONE NUMBER MASKING (India + generic)
  //----------------------------------
  masked = masked.replace(
    /\b(\+91[-\s]?|0)?[6-9]\d{9}\b/g,
    "[PHONE_MASKED]"
  );

  //----------------------------------
  // AADHAAR MASKING
  //----------------------------------
  masked = masked.replace(
    /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    "[AADHAAR_MASKED]"
  );

  //----------------------------------
  // CREDIT CARD MASKING
  //----------------------------------
  masked = masked.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    "[CARD_MASKED]"
  );

  //----------------------------------
  // IP ADDRESS MASKING (optional)
  //----------------------------------
  masked = masked.replace(
    /\b\d{1,3}(\.\d{1,3}){3}\b/g,
    "[IP_MASKED]"
  );

  return masked;
};

module.exports = { maskPII };
