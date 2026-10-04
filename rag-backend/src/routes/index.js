const express = require("express");
const router = express.Router();
const sampleController = require("../controllers/sampleController");
const authRoutes = require("./auth");

// Basic test route
router.get("/test", sampleController.testEndpoint);

// Auth routes
router.use("/auth", authRoutes);

module.exports = router;
