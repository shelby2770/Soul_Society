import Notification from "../models/Notification.js";

// Initialize notifications for a user
export const initializeNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if notifications already exist
    let userNotifications = await Notification.findOne({ userId });

    if (!userNotifications) {
      // Create default notification document
      userNotifications = await Notification.create({
        userId,
        notifications: [
          {
            message: "Welcome to Soul Society! We're glad to have you here.",
            isRead: false,
            createdAt: new Date(),
          },
        ],
      });
    }

    res.json({
      success: true,
      notifications: userNotifications.notifications,
    });
  } catch (error) {
    console.error("Error initializing notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing notifications",
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    let userNotifications = await Notification.findOne({ userId });

    // If no notifications document exists, create one
    if (!userNotifications) {
      userNotifications = await Notification.create({
        userId,
        notifications: [
          {
            message: "Welcome to Soul Society! We're glad to have you here.",
            isRead: false,
            createdAt: new Date(),
          },
        ],
      });
    }

    res.json({
      success: true,
      notifications: userNotifications.notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id; // Assuming you have user info in req.user

    const result = await Notification.findOneAndUpdate(
      {
        userId,
        "notifications._id": notificationId,
      },
      {
        $set: { "notifications.$.isRead": true },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.findOneAndUpdate(
      { userId },
      {
        $set: { "notifications.$[].isRead": true },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notifications not found",
      });
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
    });
  }
};

// Add a new notification
export const addNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;

    const result = await Notification.findOneAndUpdate(
      { userId },
      {
        $push: {
          notifications: {
            message,
            isRead: false,
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      notifications: result.notifications,
    });
  } catch (error) {
    console.error("Error adding notification:", error);
    res.status(500).json({
      success: false,
      message: "Error adding notification",
    });
  }
};
 