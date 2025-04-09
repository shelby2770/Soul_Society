import User from "../models/User.js";
import jwt from "jsonwebtoken";

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
