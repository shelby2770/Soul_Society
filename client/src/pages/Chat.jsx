import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";

const Chat = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const messagesContainerRef = useRef(null); // Ref for the messages container
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  };

  // Helper to set messages and trigger scroll event
  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    // Scroll to bottom after state update
    scrollToBottom();
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

          const doctorId = doctorResponse.data.user._id;
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
          !currentUserResponse.data.user._id
        ) {
          console.log("Could not fetch current user MongoDB ID for refresh");
          return;
        }

        const currentUserMongoId = currentUserResponse.data.user._id;
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
            !userResponse.data.user._id
          ) {
            console.log(
              "Could not find current user by email:",
              userResponse.data
            );
            return;
          }

          const currentUserMongoId = userResponse.data.user._id;
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

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser || !user) return;

    // Store the message content and clear input immediately for better UX
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Show loading indicator or disable send button if needed
    // setIsSending(true); // You could add this state if you want a loading indicator

    try {
      // Debug the user objects
      console.log("Current user:", user);
      console.log("Selected user:", selectedUser);
      console.log("UserData:", userData);

      // Create mock backend users if needed
      try {
        // Try to create user account on backend if it doesn't exist yet
        if (!userData?._id) {
          console.log("Attempting to create user on backend...");
          const createUserResponse = await axios.post(`${API_URL}/api/users`, {
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            type: userData?.type || "patient",
            firebaseId: user.uid,
          });
          console.log(
            "Backend user creation response:",
            createUserResponse.data
          );
        }
      } catch (err) {
        console.log("User might already exist on backend:", err);
      }

      // Get ids for messaging
      const senderId = user.uid; // Use Firebase uid for now
      const receiverId = selectedUser._id; // MongoDB ID for the doctor

      console.log("Using sender ID:", senderId);
      console.log("Using receiver ID:", receiverId);

      // Verify we have valid IDs
      if (!senderId || !receiverId) {
        console.error("Missing IDs:", {
          "user.uid": user?.uid,
          "selectedUser._id": selectedUser?._id,
        });
        throw new Error("Missing user IDs");
      }

      // Send message through the API
      const response = await axios.post(`${API_URL}/api/chat/messages`, {
        senderId: senderId,
        receiverId: receiverId,
        content: messageContent,
        // Add this field to help backend identify Firebase users
        isFirebaseUser: true,
        senderEmail: user.email, // Add email to help backend identify the user
      });

      console.log("Message sent successfully:", response.data);

      if (response.data.success) {
        // Update the conversations list with the latest conversation
        if (response.data.conversation) {
          const updatedConversation = response.data.conversation;

          setConversations((prevConversations) => {
            // Check if this conversation already exists in our state
            const existingIndex = prevConversations.findIndex(
              (conv) => conv._id === updatedConversation._id
            );

            if (existingIndex >= 0) {
              // Replace the existing conversation with the updated one
              const newConversations = [...prevConversations];
              newConversations[existingIndex] = updatedConversation;
              return newConversations;
            } else {
              // Add the new conversation to the list
              return [...prevConversations, updatedConversation];
            }
          });

          // Refresh conversation to get the updated messages including the one we just sent
          if (window.refreshCurrentConversation) {
            window.refreshCurrentConversation();
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Re-enable send button if needed
      // setIsSending(false);

      // Show detailed error message to user
      alert(
        `Failed to send message: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium">
                          {doctor.name.charAt(0)}
                        </span>
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
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {selectedUser.name}
                      </h3>
                      {selectedUser.specialization && (
                        <p className="text-sm text-blue-600">
                          {selectedUser.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area - Patient View */}
                <div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  ref={
                    userData?.type === "patient" ? messagesContainerRef : null
                  }
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
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-medium">
                          {patient.name.charAt(0)}
                        </span>
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
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-red-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 font-medium">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {selectedUser.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Messages Area - Doctor View */}
                <div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  ref={
                    userData?.type === "doctor" ? messagesContainerRef : null
                  }
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
