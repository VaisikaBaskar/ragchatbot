require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server tools without Origin header (curl, Postman, mobile clients)
      if (!origin) return callback(null, true);

      // Allow common development URLs and custom LAN-based frontend URLs.
      const isLocalDevOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|\d{1,3}(?:\.\d{1,3}){3}):3000$/.test(origin);

      if (allowedOrigins.has(origin) || isLocalDevOrigin) {
        return callback(null, true);
      }

      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Initialize MongoDB configuration
const connectDB = require("./src/config/db");

// Mount RAG isolated routes safely
const ragRoutes = require("./src/routes/rag");
app.use("/api/rag", ragRoutes);

// Mount Chat history routes safely
const chatRoutes = require("./src/routes/chat");
app.use("/api/chat", chatRoutes);

// Mount User management routes (Upgrades)
const userRoutes = require("./src/routes/user");
app.use("/api/user", userRoutes);

// Mount Administrative routes (System Management)
const adminRoutes = require("./src/routes/admin");
app.use("/api/admin", adminRoutes);

// Centralized error handler appended at the end
const errorHandler = require("./src/middlewares/error");
app.use(errorHandler);

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((connectionError) => {
      console.error("Failed to connect to MongoDB:", connectionError);
      process.exit(1);
    });
}

module.exports = app;
