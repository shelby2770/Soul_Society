import User from "../models/User.js";

// Get user by email
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Find user by email
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user data
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        ...(user.type === "doctor" && {
          specialization: user.specialization,
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user name
    user.name = name;
    await user.save();

    // Return updated user data
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type,
        isVerified: user.isVerified,
        ...(user.type === "doctor" && {
          specialization: user.specialization,
        }),
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};
