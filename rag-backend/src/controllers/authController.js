const User = require("../models/User");
const jwt = require("jsonwebtoken");

const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        uploadCount: user.uploadCount,
        uploadLimit: user.uploadLimit,
        isPro: user.isPro,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate request
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    // Create new user (password hashing is handled by pre-save hook in User model)
    const activeRole = role === "admin" ? "admin" : "user";
    
    const newUser = await User.create({
      name,
      email,
      password,
      role: activeRole,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }, // No password returned
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
