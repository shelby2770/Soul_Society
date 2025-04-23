import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { createNotification } from "./notificationController.js";

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      type: user.type,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Create welcome notification for new users
const createWelcomeNotification = async (user) => {
  try {
    // Create a system welcome notification
    await createNotification({
      recipient: user._id,
      sender: user._id, // Self-notification as we don't have a system user
      type: "new_message",
      title: "Welcome to Soul Society",
      message:
        "Welcome to Soul Society! We're excited to have you join our community. If you have any questions, please don't hesitate to reach out to our support team.",
      isRead: false,
    });
    console.log("Welcome notification created for user:", user.email);
  } catch (error) {
    console.error("Error creating welcome notification:", error);
    // Don't throw error to prevent signup process from failing
  }
};

// Signup controller
export const signup = async (req, res) => {
  try {
    const { type, name, email, password, specialization, cvFileName } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user object based on type
    const userData = {
      type,
      name,
      email,
      password,
    };

    // Add doctor-specific fields if type is doctor
    if (type === "doctor") {
      if (!specialization) {
        return res.status(400).json({
          success: false,
          message: "Specialization is required for doctors",
        });
      }
      userData.specialization = specialization;
      userData.cvFileName = cvFileName;
      // Doctors need to be verified before they can use the platform
      userData.isVerified = false;
    } else {
      // Patients are automatically verified
      userData.isVerified = true;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Create welcome notification
    await createWelcomeNotification(user);

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        token,
        user: {
          id: user._id,
          type: user.type,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          ...(user.type === "doctor" && {
            specialization: user.specialization,
          }),
        },
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating account",
      error: error.message,
    });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is verified (for doctors)
    if (user.type === "doctor" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending verification",
      });
    }

    // Check if user has welcome notification, create one if not
    try {
      const notifications = await import("../models/Notification.js").then(
        (module) => module.default
      );
      const hasNotifications = await notifications.findOne({
        recipient: user._id,
      });

      if (!hasNotifications) {
        console.log(
          "No notifications found for user, creating welcome notification"
        );
        await createWelcomeNotification(user);
      }
    } catch (notificationError) {
      console.error("Error checking notifications:", notificationError);
      // Continue with login flow regardless of notification error
    }

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        user: {
          id: user._id,
          type: user.type,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          ...(user.type === "doctor" && {
            specialization: user.specialization,
          }),
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};
