import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  try {
    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in authentication middleware",
    });
  }
};

// Optional auth middleware - doesn't require authentication but adds user to req if token exists
export const optionalAuth = async (req, res, next) => {
  let token;

  try {
    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select("-password");

        if (user) {
          // Add user to request object
          req.user = user;
        }
      } catch (error) {
        // If token is invalid, just continue without setting user
        console.log("Invalid token in optionalAuth:", error.message);
      }
    }

    // Always proceed to next middleware
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Still proceed to next middleware even if there's an error
    next();
  }
};
