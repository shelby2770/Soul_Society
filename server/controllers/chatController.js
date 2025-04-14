import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// Get all conversations for a user (patient or doctor)
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to find the user by ID first
    let user = await User.findById(userId);

    // If not found, check if it's a Firebase ID
    if (!user) {
      user = await User.findOne({ firebaseId: userId });
      console.log(
        "Looking up user by Firebase ID:",
        userId,
        "Found:",
        user ? "Yes" : "No"
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find all conversations where the user is either the patient or doctor
    const conversations = await Conversation.find({
      $or: [{ patient: user._id }, { doctor: user._id }],
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
    const { senderId, receiverId, content, isFirebaseUser, senderEmail } =
      req.body;

    let sender, receiver;

    // If it's a Firebase user, find by email instead of ID
    if (isFirebaseUser && senderEmail) {
      console.log("Finding user by email:", senderEmail);
      [sender, receiver] = await Promise.all([
        User.findOne({ email: senderEmail }),
        User.findById(receiverId),
      ]);
    } else {
      // Regular MongoDB ID lookup
      [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId),
      ]);
    }

    // If sender not found but we have Firebase info, create a user
    if (!sender && isFirebaseUser && senderEmail) {
      console.log("Creating user from Firebase data");
      try {
        // Create a new user based on Firebase ID
        sender = new User({
          name: senderEmail.split("@")[0], // Use email prefix as name
          email: senderEmail,
          type: "patient", // Default to patient
          firebaseId: senderId,
          // Since this field is required for doctors, set a placeholder
          // It will be ignored since the user is a patient
          specialization: "other",
          cvFileName: "none",
          password: Math.random().toString(36).slice(-10), // Random password
        });
        await sender.save();
        console.log("Created new user:", sender);
      } catch (createError) {
        console.error("Error creating user:", createError);
      }
    }

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
      sender: sender._id, // Use MongoDB ID
      receiver: receiver._id,
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

    // Populate the returned conversation for better client-side experience
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("patient", "name email")
      .populate("doctor", "name email specialization")
      .populate("lastMessage");

    console.log("Message saved successfully:", message);
    console.log("Conversation updated:", populatedConversation);

    res.status(201).json({
      success: true,
      message,
      conversation: populatedConversation,
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
    console.log(
      `Marking messages as read for user ${userId} in conversation ${conversationId}`
    );

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log(`Conversation ${conversationId} not found`);
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Find the user by MongoDB ID or Firebase ID
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ firebaseId: userId });
      console.log(
        `Looking for user by Firebase ID ${userId}, found: ${
          user ? "Yes" : "No"
        }`
      );
    }

    // If still no user found, return a more specific error
    if (!user) {
      console.log(`User not found with ID or Firebase ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`User found: ${user.name} (${user._id})`);
    console.log(
      `Conversation patient: ${conversation.patient}, doctor: ${conversation.doctor}`
    );

    // Convert ObjectIds to strings for proper comparison
    const userIdStr = user._id.toString();
    const patientIdStr = conversation.patient.toString();
    const doctorIdStr = conversation.doctor.toString();

    // Verify user is part of the conversation
    if (userIdStr !== patientIdStr && userIdStr !== doctorIdStr) {
      console.log(
        `User ${userIdStr} is not part of conversation with patient ${patientIdStr} and doctor ${doctorIdStr}`
      );
      return res.status(403).json({
        success: false,
        message: "User not part of this conversation",
      });
    }

    // Determine the other user in the conversation
    const otherUserId =
      userIdStr === patientIdStr ? conversation.doctor : conversation.patient;
    console.log(`Other user ID: ${otherUserId}`);

    // Mark all unread messages from the other user as read
    const updateResult = await Message.updateMany(
      {
        sender: otherUserId,
        receiver: user._id,
        read: false,
      },
      {
        read: true,
      }
    );

    console.log(
      `Updated ${updateResult.modifiedCount} messages to read status`
    );

    res.json({
      success: true,
      message: "Messages marked as read",
      updates: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking messages as read: " + error.message,
    });
  }
};
