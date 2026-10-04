export const maskPII = (text) => {
  if (!text) return text;

  let masked = text;

  // EMAILS
  masked = masked.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[EMAIL_MASKED]"
  );

  // PHONES
  masked = masked.replace(
    /\b(\+91[-\s]?|0)?[6-9]\d{9}\b/g,
    "[PHONE_MASKED]"
  );

  // AADHAAR
  masked = masked.replace(
    /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    "[AADHAAR_MASKED]"
  );

  // CARDS
  masked = masked.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    "[CARD_MASKED]"
  );

  // IP ADDRESSES
  masked = masked.replace(
    /\b\d{1,3}(\.\d{1,3}){3}\b/g,
    "[IP_MASKED]"
  );

  return masked;
};
