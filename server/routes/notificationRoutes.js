import express from "express";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Public endpoint - Get all notifications for a user with optional auth
router.get("/public/user/:userId", optionalAuth, getUserNotifications);

// Standard protected endpoints
router.get("/user/:userId", protect, getUserNotifications);
router.put("/read/:id", protect, markAsRead);
router.put("/read-all/:userId", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
