import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  initializeNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  addNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Initialize notifications for a user
router.post("/initialize", protect, initializeNotifications);

// Get user notifications
router.get("/user/:userId", protect, getUserNotifications);

// Mark notification as read
router.put("/:notificationId/read", protect, markAsRead);

// Mark all notifications as read
router.put("/user/:userId/read-all", protect, markAllAsRead);

// Add a new notification
router.post("/add", protect, addNotification);

export default router;
