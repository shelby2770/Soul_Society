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
    const userId = req.params.userId;

    // Add debug logging
    console.log("Getting notifications for user:", userId);
    console.log(
      "Request user object:",
      req.user ? `User found: ${req.user.email}` : "No user in request"
    );

    // Verify the user has permission to access these notifications
    // The user must be either authenticated as this user or using a public route
    const isPublicRoute = req.originalUrl.includes("/public/");
    const hasPermission =
      isPublicRoute || (req.user && req.user._id.toString() === userId);

    if (!hasPermission) {
      console.log(
        "Permission denied for notifications - User doesn't match requested ID"
      );
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access these notifications",
      });
    }

    // Fetch the notifications
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name email type")
      .sort({ createdAt: -1 }); // Newest first

    console.log(
      `Found ${notifications.length} notifications for user ${userId}`
    );

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message,
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

// Create a new notification
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};
