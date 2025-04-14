import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// Get all conversations for a user (patient or doctor)
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find all conversations where the user is either the patient or doctor
    const conversations = await Conversation.find({
      $or: [{ patient: userId }, { doctor: userId }],
    })
      .populate("patient", "name email")
      .populate("doctor", "name email specialization")
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
    });
  }
};

// Get all messages in a conversation between a patient and a doctor
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Find all messages in the conversation
    const messages = await Message.find({
      $or: [
        { sender: conversation.patient, receiver: conversation.doctor },
        { sender: conversation.doctor, receiver: conversation.patient },
      ],
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    // Verify sender and receiver exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver not found",
      });
    }

    // Verify one is a patient and one is a doctor
    if (
      (sender.type !== "patient" && sender.type !== "doctor") ||
      (receiver.type !== "patient" && receiver.type !== "doctor") ||
      sender.type === receiver.type
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender or receiver type",
      });
    }

    // Determine which is patient and which is doctor
    const patient = sender.type === "patient" ? sender : receiver;
    const doctor = sender.type === "doctor" ? sender : receiver;

    // Create the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();

    // Find or create a conversation
    let conversation = await Conversation.findOne({
      patient: patient._id,
      doctor: doctor._id,
    });

    if (!conversation) {
      conversation = new Conversation({
        patient: patient._id,
        doctor: doctor._id,
        lastMessage: message._id,
        lastMessageTime: message.createdAt,
      });
    } else {
      conversation.lastMessage = message._id;
      conversation.lastMessageTime = message.createdAt;
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      message,
      conversation,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, conversationId } = req.params;

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Verify user is part of the conversation
    if (
      conversation.patient.toString() !== userId &&
      conversation.doctor.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "User not part of this conversation",
      });
    }

    // Determine the other user in the conversation
    const otherUserId =
      conversation.patient.toString() === userId
        ? conversation.doctor
        : conversation.patient;

    // Mark all unread messages from the other user as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: userId,
        read: false,
      },
      {
        read: true,
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking messages as read",
    });
  }
};
