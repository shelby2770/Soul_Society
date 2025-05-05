import express from "express";
import {
  getConversations,
  sendMessage,
  markMessagesAsRead,
  getConversationBetweenUsers,
} from "../controllers/chatController.js";
import {
  createChatRequest,
  getPendingRequests,
  handleChatRequest,
  getChatRequestStatus,
} from "../controllers/chatRequestController.js";

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

// Chat Request routes
// Create a new chat request
router.post("/requests", createChatRequest);

// Get pending requests for a doctor
router.get("/requests/pending/:doctorId", getPendingRequests);

// Get status of chat request between patient and doctor
router.get("/requests/status/:patientId/:doctorId", getChatRequestStatus);

// Approve or decline a chat request
router.post("/requests/:requestId/:action", handleChatRequest);

export default router;
