const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired token." });
      }

      // Attach user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error during authentication" });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ success: false, message: "User not authenticated properly." });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions." });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error during authorization" });
    }
  };
};

module.exports = {
  authenticateToken,
  authorize,
};
