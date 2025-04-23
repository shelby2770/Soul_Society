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

// Public endpoints with optional auth
router.get("/public/user/:userId", optionalAuth, getUserNotifications);
router.put("/public/read/:id", optionalAuth, markAsRead);
router.put("/public/read-all/:userId", optionalAuth, markAllAsRead);

// Standard protected endpoints
router.get("/user/:userId", protect, getUserNotifications);
router.put("/read/:id", protect, markAsRead);
router.put("/read-all/:userId", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
