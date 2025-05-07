import Survey from "../models/Survey.js";

// Create a new survey
export const createSurvey = async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();

    res.status(201).json({
      success: true,
      message: "Survey created successfully",
      survey,
    });
  } catch (err) {
    console.error("Error creating survey:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create survey",
      error: err.message,
    });
  }
};

// Get the latest survey for a specific user
export const getLatestSurvey = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const survey = await Survey.findOne({ userId })
      .sort({ completedAt: -1 })
      .limit(1);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "No survey found for this user",
      });
    }

    res.status(200).json({
      success: true,
      survey,
    });
  } catch (err) {
    console.error("Error fetching latest survey:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest survey",
      error: err.message,
    });
  }
};
