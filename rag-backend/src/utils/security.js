/**
 * Defense-in-depth utility for detecting malicious user input.
 * Implements heuristic pattern matching for common prompt injection vectors.
 */
const detectPromptInjection = (query) => {
  if (!query || typeof query !== "string") return false;

  const patterns = [
    "ignore previous instructions",
    "reveal system prompt",
    "bypass security",
    "act as admin",
    "override rules",
    "forget everything",
    "system prompt:",
    "you are now a",
    "ignore all constraints",
    "reveal your hidden"
  ];

  const lowerQuery = query.toLowerCase();

  return patterns.some(p => lowerQuery.includes(p));
};

const isMaliciousQuery = (query) => {
  if (!query) return false;

  const patterns = [
    "bypass",
    "hack",
    "exploit",
    "break security",
    "override system",
    "disable security",
    "jailbreak",
    "attack system"
  ];

  const q = query.toLowerCase();

  return patterns.some(p => q.includes(p));
};

module.exports = {
  detectPromptInjection,
  isMaliciousQuery
};
