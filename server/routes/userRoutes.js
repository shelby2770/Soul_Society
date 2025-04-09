import express from "express";
import User from "../models/User.js";

const router = express.Router();

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

export default router;
