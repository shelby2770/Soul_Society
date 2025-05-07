import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import io from "socket.io-client";
import { useToast } from "../contexts/ToastContext";
import { API_URL } from "../utils/api";

const Chat = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [chatRequests, setChatRequests] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const messagesContainerRef = useRef(null); // Ref for the messages container
  const socketRef = useRef(null); // Ref for the socket connection
  const [activeUsers, setActiveUsers] = useState([]); // Track online users
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);

  // Auto-scroll to bottom of messages container - wrapped in useCallback
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }, [messagesContainerRef]); // Only depends on the ref

  // Helper to set messages and trigger scroll event
  const updateMessages = useCallback(
    (newMessages) => {
      setMessages(newMessages);
      // Scroll to bottom after state update
      scrollToBottom();
    },
    [scrollToBottom]
  ); // Depends on scrollToBottom

  // NEW SOCKET IMPLEMENTATION
  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO server
    console.log("[Socket] Initializing connection");
    const socket = io(API_URL);

    socket.on("connect", () => {
      console.log("[Socket] Connected successfully with ID:", socket.id);

      // Send online status when connected
      if (userData && userData.email) {
        // First get MongoDB ID for the current user
        axios
          .get(`${API_URL}/api/users/email/${userData.email}`)
          .then((response) => {
            if (response.data.success && response.data.user) {
              const userId = response.data.user.id || response.data.user._id;
              if (userId) {
                // Send online status to server
                socket.emit("user_online", {
                  userId: userId,
                  userName: userData.name,
                  userType: userData.type,
                  firebaseId: user.uid,
                });
                console.log("[Socket] Emitted online status for user:", userId);
              }
            }
          })
          .catch((error) => {
            console.error("[Socket] Error getting user MongoDB ID:", error);
          });
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
    });

    socket.on("active_users", (users) => {
      console.log("[Socket] Active users updated:", users);
      setActiveUsers(users);
    });

    // Store socket in ref for later use
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      console.log("[Socket] Disconnecting");
      socket.disconnect();
    };
  }, [user, userData, API_URL]);

  // Handle joining conversation rooms when a user is selected
  useEffect(() => {
    if (!socketRef.current || !selectedUser || !userData?.email) return;

    const joinRoom = async () => {
      try {
        // First get the current user's MongoDB ID
        console.log("[Socket] Getting current user ID for room joining");
        const userResponse = await axios.get(
          `${API_URL}/api/users/email/${userData.email}`
        );

        if (!userResponse.data.success || !userResponse.data.user) {
          console.error("[Socket] Could not get user ID for room joining");
          return;
        }

        const currentUserId = userResponse.data.user.id;
        const selectedUserId = selectedUser._id;

        // Try to find existing conversation between these users
        console.log("[Socket] Finding conversation between users");
        const convResponse = await axios.get(
          `${API_URL}/api/chat/conversations/between/${currentUserId}/${selectedUserId}`
        );

        if (convResponse.data.success && convResponse.data.conversation) {
          const conversationId = convResponse.data.conversation._id;
          console.log("[Socket] Joining conversation room:", conversationId);

          // Leave any previous rooms first
          socketRef.current.emit("leave_conversation", conversationId);

          // Then join the new room
          socketRef.current.emit("join_conversation", conversationId);
        } else {
          console.log(
            "[Socket] No existing conversation found, will be created on first message"
          );
        }
      } catch (error) {
        console.error("[Socket] Error joining conversation room:", error);
      }
    };

    joinRoom();
  }, [selectedUser, userData?.email, API_URL]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socketRef.current || !selectedUser) return;

    console.log("[Socket] Setting up message listener");

    // Keep track of processed message IDs to avoid duplicates
    const processedMessageIds = new Set();

    const handleReceiveMessage = (data) => {
      console.log("[Socket] Received message:", data);

      // If we have message data, create a new message object and add to chat
      if (data && (data.content || (data.message && data.message.content))) {
        const content = data.content || data.message?.content;
        const senderId = data.sender || data.message?.sender;
        const messageId =
          data._id || data.message?._id || `socket-${Date.now()}`;

        // Create a unique fingerprint for this message to detect duplicates
        const messageFingerprint = `${messageId}-${content}-${senderId}`;

        // Skip if we've already processed this message
        if (processedMessageIds.has(messageFingerprint)) {
          console.log(
            "[Socket] Skipping already processed message:",
            messageFingerprint
          );
          return;
        }

        // Add to processed set so we don't add it again
        processedMessageIds.add(messageFingerprint);

        // Also check if we already have this message in our state
        const isDuplicate = messages.some(
          (msg) =>
            msg.id === messageId ||
            (msg.content === content &&
              Math.abs(new Date(msg.timestamp) - new Date()) < 10000) // Within 10 seconds
        );

        if (isDuplicate) {
          console.log("[Socket] Skipping duplicate message:", content);
          return;
        }

        // Create a unique ID for this message
        const uniqueId = `msg-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)}`;

        const newMessage = {
          id: messageId || uniqueId, // Use server ID or generate a unique one
          content: content,
          timestamp:
            data.createdAt ||
            data.message?.createdAt ||
            new Date().toISOString(),
          sender: senderId === userData?.id ? "You" : selectedUser.name,
        };

        console.log("[Socket] Adding to messages:", newMessage);

        // Use a callback to ensure we're working with the latest state
        setMessages((prevMessages) => {
          // Double-check for duplicates again
          const alreadyExists = prevMessages.some(
            (msg) =>
              msg.id === newMessage.id ||
              (msg.content === newMessage.content &&
                Math.abs(
                  new Date(msg.timestamp) - new Date(newMessage.timestamp)
                ) < 5000)
          );

          if (alreadyExists) {
            return prevMessages;
          }

          // Add the new message
          const updatedMessages = [...prevMessages, newMessage];

          // Scroll to bottom after a short delay
          setTimeout(scrollToBottom, 100);

          return updatedMessages;
        });
      }
    };

    // Register for the receive_message event
    socketRef.current.on("receive_message", handleReceiveMessage);

    // Clean up when component unmounts or selected user changes
    return () => {
      socketRef.current.off("receive_message", handleReceiveMessage);
      console.log("[Socket] Removed message listener");
    };
  }, [selectedUser, userData?.id, messages, scrollToBottom]); // Include scrollToBottom as a dependency

  // Helper function to check if a user is active
  const isUserActive = (userId) => {
    return Array.isArray(activeUsers) && activeUsers.includes(userId);
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch data based on user type
    const fetchData = async () => {
      try {
        setLoading(true);

        // Always use Firebase UID for API calls
        const currentUserId = user.uid;
        console.log("Fetching conversations for user:", currentUserId);

        // Fetch conversations for the current user
        // const conversationsResponse = await axios
        //   .get(`${API_URL}/api/chat/conversations/${currentUserId}`)
        //   .catch((error) => {
        //     console.log("No conversations found:", error);
        //     return { data: { success: true, conversations: [] } };
        //   });

        // console.log("Conversations API response:", conversationsResponse.data);

        // if (conversationsResponse.data.success) {
        //   const conversationsData =
        //     conversationsResponse.data.conversations || [];
        //   console.log("Received conversations:", conversationsData.length);

        //   // Log the chat history counts for debugging
        //   conversationsData.forEach((conv) => {
        //     console.log(
        //       `Conversation between ${conv.patient.name} and ${
        //         conv.doctor.name
        //       } has ${conv.chatHistory ? conv.chatHistory.length : 0} messages`
        //     );
        //   });

        //   setConversations(conversationsData);
        // }

        if (userData?.type === "patient") {
          // Fetch doctors for patients
          const response = await axios.get(`${API_URL}/api/users/doctors`);
          console.log("Doctors API response:", response.data);

          if (response.data && response.data.success) {
            console.log("Setting doctors:", response.data.doctors);
            setDoctors(response.data.doctors);
          }
        } else if (userData?.type === "doctor") {
          // For doctors, we need to fetch patients who have texted this doctor
          // First, get the doctor's MongoDB ID by email
          console.log("Fetching doctor's MongoDB ID by email:", userData.email);
          const doctorResponse = await axios.get(
            `${API_URL}/api/users/email/${userData.email}`
          );

          if (!doctorResponse.data.success || !doctorResponse.data.user) {
            console.error("Could not fetch doctor data");
            setPatients([]);
            setLoading(false);
            return;
          }

          const doctorId = doctorResponse.data.user.id;
          console.log("Doctor MongoDB ID:", doctorId);

          // Now fetch conversations where this doctor is a participant
          const conversationsResponse = await axios
            .get(`${API_URL}/api/chat/conversations/${doctorId}`)
            .catch((error) => {
              console.log("No conversations found:", error);
              return { data: { success: true, conversations: [] } };
            });

          console.log("Doctor's conversations:", conversationsResponse.data);

          if (conversationsResponse.data.success) {
            const conversations =
              conversationsResponse.data.conversations || [];
            setConversations(conversations);

            // Extract unique patient IDs from these conversations
            const patientsList = conversations.map((conv) => ({
              _id: conv.patient._id,
              name: conv.patient.name,
              email: conv.patient.email,
              lastMessage: conv.lastMessage || "",
              lastMessageTime: conv.lastMessageTime,
            }));

            console.log("Patients who texted this doctor:", patientsList);
            setPatients(patientsList);
          } else {
            console.error("Failed to fetch conversations");
            setPatients([]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays as fallback
        setConversations([]);
        if (userData?.type === "patient") {
          setDoctors([]);
        } else if (userData?.type === "doctor") {
          setPatients([]);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userData, navigate, API_URL]);

  // Load messages when a user is selected or conversations change
  useEffect(() => {
    if (!selectedUser || !user) return;

    // Define the refresh function
    const refreshConversation = async () => {
      try {
        // First, get the current user's MongoDB ID
        const currentUserResponse = await axios.get(
          `${API_URL}/api/users/email/${userData.email}`
        );

        if (
          !currentUserResponse.data.success ||
          !currentUserResponse.data.user ||
          !currentUserResponse.data.user.id
        ) {
          console.log("Could not fetch current user MongoDB ID for refresh");
          return;
        }

        const currentUserMongoId = currentUserResponse.data.user.id;
        const selectedUserId = selectedUser._id;

        // Refresh the specific conversation between these two users instead of all conversations
        const conversationResponse = await axios.get(
          `${API_URL}/api/chat/conversations/between/${currentUserMongoId}/${selectedUserId}`
        );

        if (
          conversationResponse.data.success &&
          conversationResponse.data.conversation
        ) {
          const updatedConversation = conversationResponse.data.conversation;

          // Update the conversations state if needed
          setConversations((prev) => {
            const exists = prev.some(
              (conv) => conv._id === updatedConversation._id
            );
            if (!exists) {
              return [...prev, updatedConversation];
            }
            return prev.map((conv) =>
              conv._id === updatedConversation._id ? updatedConversation : conv
            );
          });

          // Format and update messages if there's chat history
          if (
            updatedConversation.chatHistory &&
            updatedConversation.chatHistory.length > 0
          ) {
            const formattedMessages = updatedConversation.chatHistory
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((msg) => {
                // Get sender ID as string
                const senderId =
                  typeof msg.sender === "object"
                    ? msg.sender._id.toString()
                    : String(msg.sender);

                // Get patient and doctor IDs as strings
                const patientId =
                  typeof updatedConversation.patient._id === "object"
                    ? updatedConversation.patient._id.toString()
                    : String(updatedConversation.patient._id);

                const doctorId =
                  typeof updatedConversation.doctor._id === "object"
                    ? updatedConversation.doctor._id.toString()
                    : String(updatedConversation.doctor._id);

                // Determine if current user is sender
                let isCurrentUserSender;
                if (userData?.type === "patient") {
                  isCurrentUserSender = senderId === patientId;
                } else if (userData?.type === "doctor") {
                  isCurrentUserSender = senderId === doctorId;
                }

                return {
                  id: msg._id || msg.createdAt.toString(),
                  sender: isCurrentUserSender ? "You" : selectedUser.name,
                  content: msg.content,
                  timestamp: msg.createdAt,
                };
              });

            updateMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error("Error refreshing conversation:", error);
      }
    };

    // Initial load of conversation
    refreshConversation();

    // Attach the refresh function to window object so it can be called from other functions
    window.refreshCurrentConversation = refreshConversation;

    // Clean up when component unmounts
    return () => {
      window.refreshCurrentConversation = null;
    };
  }, [selectedUser, user, userData?.email, API_URL]);

  // Debug useEffect to log important state changes
  useEffect(() => {
    if (selectedUser) {
      console.log("Selected user changed:", selectedUser.name);
    }
  }, [selectedUser]);

  useEffect(() => {
    console.log("Conversations updated, count:", conversations.length);
  }, [conversations]);

  const handleSelectUser = (selectedUserObj) => {
    console.log(
      "User selected:",
      selectedUserObj.name,
      "with ID:",
      selectedUserObj._id
    );
    setSelectedUser(selectedUserObj);

    // Debug helper to show the full API URL
    const getFullUrl = (path) => {
      const url = `${API_URL}${path}`;
      console.log("Full API URL:", url);
      return url;
    };

    // Fetch conversation data from backend
    const fetchConversation = async () => {
      try {
        // Show loading state
        setMessages([]);
        console.log("hello");

        // Debug user objects structure
        console.log("Selected user:", JSON.stringify(selectedUserObj));
        console.log("Auth user data:", JSON.stringify(userData));

        // Validate selected user has MongoDB _id
        if (!selectedUserObj._id) {
          console.log("Missing selected user MongoDB ID");
          return;
        }

        // Get current user MongoDB ID using email from userData
        if (!userData || !userData.email) {
          console.log("Missing user email in userData");
          return;
        }

        try {
          // First fetch the current user's MongoDB ID using their email
          console.log(
            "Fetching current user MongoDB ID by email:",
            userData.email
          );
          const userResponse = await axios.get(
            `${API_URL}/api/users/email/${userData.email}`
          );

          if (
            !userResponse.data.success ||
            !userResponse.data.user ||
            !userResponse.data.user.id
          ) {
            console.log(
              "Could not find current user by email:",
              userResponse.data
            );
            return;
          }

          const currentUserMongoId = userResponse.data.user.id;
          const selectedUserId = selectedUserObj._id;

          console.log("Found current user MongoDB ID:", currentUserMongoId);
          console.log("Selected user MongoDB ID:", selectedUserId);

          // Now fetch conversation using both MongoDB IDs - fix URL to include /chat
          const apiPath = `/api/chat/conversations/between/${currentUserMongoId}/${selectedUserId}`;
          const response = await axios.get(getFullUrl(apiPath));

          console.log("Conversation fetch response:", response.data);

          if (response.data.success && response.data.conversation) {
            const conversation = response.data.conversation;

            // Update local conversations state with this conversation if needed
            setConversations((prevConversations) => {
              const exists = prevConversations.some(
                (conv) => conv._id === conversation._id
              );
              if (!exists) {
                return [...prevConversations, conversation];
              }
              return prevConversations.map((conv) =>
                conv._id === conversation._id ? conversation : conv
              );
            });

            // Format and display messages if available
            if (
              conversation.chatHistory &&
              conversation.chatHistory.length > 0
            ) {
              console.log(
                `Found conversation with ${conversation.chatHistory.length} messages`
              );

              // Format the messages for display
              const formattedMessages = conversation.chatHistory
                // Sort messages by timestamp (oldest first)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map((msg) => {
                  // Check if msg.sender is a string or an object with _id
                  const senderId =
                    typeof msg.sender === "object"
                      ? msg.sender._id.toString()
                      : String(msg.sender);

                  // Get IDs for comparison, ensuring they're strings
                  const patientId =
                    typeof conversation.patient._id === "object"
                      ? conversation.patient._id.toString()
                      : String(conversation.patient._id);

                  const doctorId =
                    typeof conversation.doctor._id === "object"
                      ? conversation.doctor._id.toString()
                      : String(conversation.doctor._id);

                  // Determine if the current user is the sender
                  let isCurrentUserSender;
                  if (userData?.type === "patient") {
                    isCurrentUserSender = senderId === patientId;
                  } else if (userData?.type === "doctor") {
                    isCurrentUserSender = senderId === doctorId;
                  }

                  return {
                    id: msg._id || msg.createdAt.toString(),
                    sender: isCurrentUserSender ? "You" : selectedUserObj.name,
                    content: msg.content,
                    timestamp: msg.createdAt,
                  };
                });

              updateMessages(formattedMessages);
            } else {
              console.log("No messages in conversation");
              updateMessages([]);
            }
          } else {
            console.log("No existing conversation found for this user");
            updateMessages([]);
          }
        } catch (error) {
          console.error("Error fetching user by email:", error);
          updateMessages([]);
        }
      } catch (error) {
        console.error("Error in conversation fetch process:", error);
        updateMessages([]);
      }
    };

    fetchConversation();
  };

  // Update handleSendMessage to handle sending messages properly
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser || !user) return;

    // Store the message content and clear input immediately for better UX
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      // Generate a truly unique ID for this message
      const uniqueId = `local-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Add message to UI immediately for better UX
      const tempMessage = {
        id: uniqueId,
        content: messageContent,
        sender: "You",
        timestamp: new Date().toISOString(),
        pending: true, // Mark as pending so we can update it later
      };

      // Add to messages state
      setMessages((prev) => [...prev, tempMessage]);

      // Scroll to bottom
      setTimeout(scrollToBottom, 50);

      // Send message via REST API only - let the server handle Socket.IO
      console.log("[API] Sending message");

      // No need to get MongoDB ID since we're not using it
      // Just send the message directly
      const response = await axios.post(`${API_URL}/api/chat/messages`, {
        senderId: user.uid,
        receiverId: selectedUser._id,
        content: messageContent,
        isFirebaseUser: true,
        senderEmail: user.email,
        // Include our local ID to help with deduplication
        clientMessageId: uniqueId,
      });

      console.log("[API] Message sent response:", response.data);

      if (response.data.success) {
        // Update the temp message with the real ID from the server response
        if (response.data.message && response.data.message._id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === uniqueId
                ? {
                    ...msg,
                    id: response.data.message._id,
                    pending: false,
                  }
                : msg
            )
          );
        }

        // Let the server handle Socket.IO emission
        // We're not going to emit from the client to avoid duplicates
        // The server should emit to all clients including the sender

        // Update conversations list
        if (response.data.conversation) {
          const updatedConversation = response.data.conversation;
          setConversations((prevConversations) => {
            const existingIndex = prevConversations.findIndex(
              (conv) => conv._id === updatedConversation._id
            );

            if (existingIndex >= 0) {
              const newConversations = [...prevConversations];
              newConversations[existingIndex] = updatedConversation;
              return newConversations;
            } else {
              return [...prevConversations, updatedConversation];
            }
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove the pending message on error
      setMessages((prev) => prev.filter((msg) => !msg.pending));

      alert(
        `Failed to send message: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Load pending chat requests for doctors
  useEffect(() => {
    if (!user || !userData || userData.type !== "doctor") return;

    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/chat/requests/pending/${userData.id || user.uid}`
        );
        if (response.data.success) {
          setPendingRequests(response.data.requests || []);
        }
      } catch (error) {
        console.error("[Chat] Error fetching pending chat requests:", error);
      }
    };

    fetchPendingRequests();
  }, [user, userData, API_URL]);

  // Function to check if chat is allowed with a doctor
  const isChatAllowed = (doctorId) => {
    // If we have an existing conversation, chat is allowed
    const hasConversation = conversations.some(
      (conv) => conv.doctor._id === doctorId || conv.doctor.id === doctorId
    );

    if (hasConversation) return true;

    // Check if we have an approved request
    return chatRequests[doctorId] === "approved";
  };

  // Function to send a chat request to a doctor
  const sendChatRequest = async (doctorId, doctorName) => {
    try {
      // Update UI immediately for better UX
      setChatRequests((prev) => ({
        ...prev,
        [doctorId]: "pending",
      }));

      // Send request to server
      const response = await axios.post(`${API_URL}/api/chat/requests`, {
        patientId: userData.id || user.uid,
        patientName: userData.name,
        patientEmail: userData.email,
        doctorId: doctorId,
        message: `${userData.name} would like to chat with you.`,
      });

      if (response.data.success) {
        success(`Chat request sent to Dr. ${doctorName}`);
      } else {
        // Reset state on failure
        setChatRequests((prev) => ({
          ...prev,
          [doctorId]: undefined,
        }));
        showError("Failed to send chat request");
      }
    } catch (error) {
      console.error("[Chat] Error sending chat request:", error);
      // Reset state on error
      setChatRequests((prev) => ({
        ...prev,
        [doctorId]: undefined,
      }));
      showError(
        "Error sending chat request: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Function for doctors to handle chat requests
  const handleChatRequest = async (requestId, patientId, action) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/chat/requests/${requestId}/${action}`,
        {
          doctorId: userData.id || user.uid,
        }
      );

      if (response.data.success) {
        success(
          `Chat request ${action === "approve" ? "approved" : "declined"}`
        );

        // Update pending requests list
        setPendingRequests((prev) =>
          prev.filter((req) => req._id !== requestId)
        );

        // If approved, refresh the patients list
        if (action === "approve" && userData.type === "doctor") {
          // Fetch data again to refresh the patients list
          const fetchPatients = async () => {
            try {
              // For doctors, get patients they have conversations with
              console.log(
                "Fetching doctor's MongoDB ID by email:",
                userData.email
              );
              const doctorResponse = await axios.get(
                `${API_URL}/api/users/email/${userData.email}`
              );

              if (doctorResponse.data.success && doctorResponse.data.user) {
                const doctorId = doctorResponse.data.user.id;
                console.log("Doctor MongoDB ID:", doctorId);

                // Now fetch conversations for this doctor
                const conversationsResponse = await axios
                  .get(`${API_URL}/api/chat/conversations/${doctorId}`)
                  .catch((error) => {
                    console.log("No conversations found:", error);
                    return { data: { success: true, conversations: [] } };
                  });

                if (conversationsResponse.data.success) {
                  const conversations =
                    conversationsResponse.data.conversations || [];
                  setConversations(conversations);

                  // Extract patient info from conversations
                  const patientsList = conversations.map((conv) => ({
                    _id: conv.patient._id,
                    name: conv.patient.name,
                    email: conv.patient.email,
                    lastMessage: conv.lastMessage || "",
                    lastMessageTime: conv.lastMessageTime,
                  }));

                  setPatients(patientsList);
                }
              }
            } catch (error) {
              console.error("Error fetching patients:", error);
            }
          };

          fetchPatients();
        }
      } else {
        showError(`Failed to ${action} chat request`);
      }
    } catch (error) {
      console.error(`[Chat] Error ${action}ing chat request:`, error);
      showError(
        `Error ${action}ing request: ` +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Check chat request status for a specific doctor
  useEffect(() => {
    if (!userData || userData.type !== "patient" || !selectedUser) return;

    const fetchChatRequestStatus = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/chat/requests/status/${userData.id || user.uid}/${
            selectedUser._id
          }`
        );

        if (response.data.success) {
          const status = response.data.status || "none";
          setChatRequests((prev) => ({
            ...prev,
            [selectedUser._id]: status,
          }));
        }
      } catch (error) {
        console.error("[Chat] Error fetching chat request status:", error);
      }
    };

    fetchChatRequestStatus();
  }, [selectedUser, userData, API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render different UI based on user type
  if (userData?.type === "patient") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Chat with Your Doctor
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctors List */}
          <div className="bg-white rounded-lg shadow-md p-4 h-[600px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Available Doctors
            </h2>

            {doctors.length === 0 ? (
              <p className="text-gray-500 text-center">No doctors available</p>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser && selectedUser._id === doctor._id
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                    onClick={() => handleSelectUser(doctor)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">
                            {doctor.name.charAt(0)}
                          </span>
                        </div>
                        {isUserActive(doctor._id) && (
                          <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {doctor.name}
                        </h3>
                        {doctor.specialization && (
                          <p className="text-sm text-blue-600">
                            {doctor.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[600px] flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header - Patient View */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">
                            {selectedUser.name.charAt(0)}
                          </span>
                        </div>
                        {isUserActive(selectedUser._id) && (
                          <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-800">
                            {selectedUser.name}
                          </h3>
                          {isUserActive(selectedUser._id) && (
                            <span className="ml-2 text-xs text-green-600 font-medium">
                              • Online
                            </span>
                          )}
                        </div>
                        {selectedUser.specialization && (
                          <p className="text-sm text-blue-600">
                            {selectedUser.specialization}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chat request status/button */}
                    {!isChatAllowed(selectedUser._id) && (
                      <div>
                        {chatRequests[selectedUser._id] === "pending" ? (
                          <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                            Request Pending
                          </span>
                        ) : chatRequests[selectedUser._id] === "declined" ? (
                          <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
                            Request Declined
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              sendChatRequest(
                                selectedUser._id,
                                selectedUser.name
                              )
                            }
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Request to Chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area - Patient View */}
                <div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  ref={messagesContainerRef}
                >
                  {!isChatAllowed(selectedUser._id) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-800 mb-2">
                        Chat permission required
                      </h3>
                      <p className="text-gray-500 max-w-md mb-4">
                        You need permission from Dr. {selectedUser.name} to
                        start a conversation.
                        {chatRequests[selectedUser._id] === "pending" &&
                          " Your request is pending approval."}
                      </p>
                      {!chatRequests[selectedUser._id] && (
                        <button
                          onClick={() =>
                            sendChatRequest(selectedUser._id, selectedUser.name)
                          }
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Request to Chat
                        </button>
                      )}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "You"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender === "You"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <p className="font-medium text-sm mb-1">
                              {message.sender}
                            </p>
                            <p>{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                {isChatAllowed(selectedUser._id) && (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-gray-200"
                  >
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.trim()) {
                              handleSendMessage(e);
                            }
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400 text-black"
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Select a Doctor to Chat
                </h3>
                <p className="text-gray-500 max-w-md">
                  Choose a doctor from the list to start a conversation. You can
                  discuss your health concerns, ask questions, or get advice.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (userData?.type === "doctor") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Patient Conversations
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patients List - Only those who have texted the doctor */}
          <div className="bg-white rounded-lg shadow-md p-4 h-[600px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Patients Who Contacted You
            </h2>

            {/* Pending chat requests section */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-2">
                  Chat Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-yellow-50 border border-yellow-200 p-3 rounded-md"
                    >
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        {request.patientName}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {request.message}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleChatRequest(
                              request._id,
                              request.patientId,
                              "approve"
                            )
                          }
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleChatRequest(
                              request._id,
                              request.patientId,
                              "decline"
                            )
                          }
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">
                  No patients have contacted you yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div
                    key={patient._id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser && selectedUser._id === patient._id
                        ? "bg-red-100 border border-red-300"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                    onClick={() => handleSelectUser(patient)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 font-medium">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        {isUserActive(patient._id) && (
                          <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {patient.lastMessage}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(patient.lastMessageTime).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[600px] flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header - Doctor View */}
                <div className="p-4 border-b border-gray-200 bg-red-50">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-medium">
                          {selectedUser.name.charAt(0)}
                        </span>
                      </div>
                      {isUserActive(selectedUser._id) && (
                        <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-800">
                          {selectedUser.name}
                        </h3>
                        {isUserActive(selectedUser._id) && (
                          <span className="ml-2 text-xs text-green-600 font-medium">
                            • Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area - Doctor View */}
                <div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  ref={messagesContainerRef}
                >
                  {messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "You"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender === "You"
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <p className="font-medium text-sm mb-1">
                              {message.sender}
                            </p>
                            <p>{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200"
                >
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            handleSendMessage(e);
                          }
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white placeholder-gray-400 text-black"
                    />
                    <button
                      type="submit"
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Select a Patient to Chat
                </h3>
                <p className="text-gray-500 max-w-md">
                  Choose a patient from the list to view your conversation
                  history. You can only chat with patients who have initiated
                  contact with you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // If user type is not patient or doctor
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the chat feature.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
};

export default Chat;
