import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get all users
router.get("/all", async (req, res) => {
  try {
    const users = await User.find().select("name email type");

    res.json({
      success: true,
      users: users.map((user) => ({
        name: user.name,
        email: user.email,
        type: user.type,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
});

// Get all doctors
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ type: "doctor" }).select(
      "name email specialization"
    );

    res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
    });
  }
});

// Get user by email
router.get("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("Fetching user with email:", email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User found:", user);
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
});

// Update user by email
router.put("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;
    console.log("Updating user:", email, "with data:", updates);

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      console.log("User not found for update:", email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User updated successfully:", user);
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user data",
    });
  }
});

// Get patients assigned to a doctor
router.get("/doctor/:email/patients", async (req, res) => {
  try {
    const { email } = req.params;
    const doctor = await User.findOne({ email, type: "doctor" });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // For now, return all users with type "patient"
    // TODO: Update this when implementing actual patient assignments
    const patients = await User.find({ type: "patient" }).select("name email");

    res.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
    });
  }
});

// Create a user from Firebase data
router.post("/", async (req, res) => {
  try {
    const { name, email, type, firebaseId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but doesn't have firebaseId, update it
      if (!existingUser.firebaseId && firebaseId) {
        existingUser.firebaseId = firebaseId;
        await existingUser.save();
      }

      return res.json({
        success: true,
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          type: existingUser.type,
        },
        message: "User already exists",
      });
    }

    // Generate a random password for the user since Firebase handles auth
    const randomPassword = Math.random().toString(36).slice(-10);

    // Create new user
    const newUser = new User({
      name: name || email.split("@")[0],
      email,
      type: type || "patient",
      password: randomPassword,
      firebaseId,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

export default router;
