import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/chatController.js";

const router = express.Router();

// Get all conversations for a user
router.get("/conversations/:userId", getConversations);

// Get all messages in a conversation
router.get("/messages/:conversationId", getMessages);

// Send a new message
router.post("/messages", sendMessage);

// Mark messages as read
router.put("/read/:userId/:conversationId", markMessagesAsRead);

export default router;
