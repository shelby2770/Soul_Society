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
      .populate("chatHistory.sender", "name email type")
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

    // Create a new message object
    const newMessage = {
      sender: sender._id,
      content,
      createdAt: new Date(),
      read: false,
    };

    // Find or create a conversation
    let conversation = await Conversation.findOne({
      patient: patient._id,
      doctor: doctor._id,
    });

    if (!conversation) {
      // Create new conversation with this message
      conversation = new Conversation({
        patient: patient._id,
        doctor: doctor._id,
        chatHistory: [newMessage],
        lastMessage: content,
        lastMessageTime: newMessage.createdAt,
      });
    } else {
      // Add the message to existing conversation
      conversation.chatHistory.push(newMessage);
      conversation.lastMessage = content;
      conversation.lastMessageTime = newMessage.createdAt;
    }

    await conversation.save();

    // Populate the returned conversation for better client-side experience
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("patient", "name email")
      .populate("doctor", "name email specialization")
      .populate("chatHistory.sender", "name email type");

    // Get the message we just added (the last one in the chat history)
    const addedMessage =
      populatedConversation.chatHistory[
        populatedConversation.chatHistory.length - 1
      ];

    console.log("Message saved successfully:", addedMessage);
    console.log(
      "Conversation updated with new message content:",
      populatedConversation.lastMessage
    );

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("socketio");
    if (io) {
      // Format the message for socket emission
      const socketMessage = {
        conversationId: populatedConversation._id.toString(),
        message: {
          _id: addedMessage._id,
          sender: {
            _id: sender._id,
            name: sender.name,
            type: sender.type,
          },
          content: addedMessage.content,
          createdAt: addedMessage.createdAt,
        },
        patient: {
          _id: patient._id,
          name: patient.name,
        },
        doctor: {
          _id: doctor._id,
          name: doctor.name,
        },
      };

      // Emit to the conversation room
      io.to(socketMessage.conversationId).emit(
        "receive_message",
        socketMessage
      );
      console.log(
        `Socket.IO: Emitted message to room ${socketMessage.conversationId}`
      );
    } else {
      console.log("Socket.IO instance not available");
    }

    res.status(201).json({
      success: true,
      message: addedMessage,
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message: " + error.message,
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

    // Determine the other user ID
    const otherUserId = userIdStr === patientIdStr ? doctorIdStr : patientIdStr;

    // Mark unread messages from the other user as read within this conversation
    let updateCount = 0;

    // Update messages in the chatHistory array
    for (let i = 0; i < conversation.chatHistory.length; i++) {
      const msg = conversation.chatHistory[i];
      if (msg.sender.toString() === otherUserId && !msg.read) {
        conversation.chatHistory[i].read = true;
        updateCount++;
      }
    }

    await conversation.save();

    console.log(`Updated ${updateCount} messages to read status`);

    res.json({
      success: true,
      message: "Messages marked as read",
      updates: updateCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking messages as read: " + error.message,
    });
  }
};

// Get conversation between two specific users
export const getConversationBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    console.log(
      `Fetching conversation between users ${userId1} and ${userId2}`
    );

    // Find both users to determine which is patient and which is doctor
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2),
    ]);

    if (!user1 || !user2) {
      console.log(`One or both users not found: ${userId1}, ${userId2}`);
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    console.log(
      `User1: ${user1.name} (${user1.type}), User2: ${user2.name} (${user2.type})`
    );

    // Determine which user is the patient and which is the doctor
    let patientId, doctorId;

    if (user1.type === "patient" && user2.type === "doctor") {
      patientId = user1._id;
      doctorId = user2._id;
    } else if (user1.type === "doctor" && user2.type === "patient") {
      patientId = user2._id;
      doctorId = user1._id;
    } else {
      console.log(`Invalid user types: ${user1.type}, ${user2.type}`);
      return res.status(400).json({
        success: false,
        message: "Conversation must be between a patient and a doctor",
      });
    }

    // Find the conversation between these users
    const conversation = await Conversation.findOne({
      patient: patientId,
      doctor: doctorId,
    })
      .populate("patient", "name email")
      .populate("doctor", "name email specialization")
      .populate("chatHistory.sender", "name email type");

    if (!conversation) {
      // If no conversation exists yet, return success but with empty conversation
      console.log(
        `No conversation found between patient ${patientId} and doctor ${doctorId}`
      );
      return res.json({
        success: true,
        conversation: null,
        message: "No conversation exists yet between these users",
      });
    }

    console.log(
      `Found conversation with ${conversation.chatHistory.length} messages`
    );

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Error fetching conversation between users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversation",
    });
  }
};
