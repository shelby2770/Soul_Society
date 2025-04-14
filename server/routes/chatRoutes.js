import express from "express";
import {
  getConversations,
  sendMessage,
  markMessagesAsRead,
  getConversationBetweenUsers,
} from "../controllers/chatController.js";

const router = express.Router();

// IMPORTANT: More specific routes must come before generic routes
// Get conversation between two specific users
router.get(
  "/conversations/between/:userId1/:userId2",
  getConversationBetweenUsers
);

// Get all conversations for a user
router.get("/conversations/:userId", getConversations);

// Send a new message
router.post("/messages", sendMessage);

// Mark messages as read
router.put("/read/:userId/:conversationId", markMessagesAsRead);

export default router;
