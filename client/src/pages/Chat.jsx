import { useState, useEffect } from "react";
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
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

        // Fetch conversations for the current user
        const conversationsResponse = await axios
          .get(`${API_URL}/api/chat/conversations/${user._id}`)
          .catch((error) => {
            console.log("No conversations found:", error);
            return { data: { success: true, conversations: [] } };
          });

        if (conversationsResponse.data.success) {
          setConversations(conversationsResponse.data.conversations || []);
        }

        if (userData?.type === "patient") {
          // Fetch doctors for patients
          const response = await axios.get(`${API_URL}/api/users/doctors`);
          console.log("Doctors API response:", response.data);

          if (response.data && response.data.success) {
            console.log("Setting doctors:", response.data.doctors);
            setDoctors(response.data.doctors);
          }
        } else if (userData?.type === "doctor") {
          // Extract patients from conversations
          const patientsList = (
            conversationsResponse.data.conversations || []
          ).map((conv) => ({
            _id: conv.patient._id,
            name: conv.patient.name,
            lastMessage: conv.lastMessage?.content || "",
            lastMessageTime: conv.lastMessageTime,
          }));
          setPatients(patientsList);
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
  }, [user, userData, navigate]);

  // Load messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !user) return;

    const fetchMessages = async () => {
      try {
        // Find the conversation between current user and selected user
        const conversation = conversations.find(
          (conv) =>
            (userData?.type === "patient" &&
              conv.doctor._id === selectedUser._id) ||
            (userData?.type === "doctor" &&
              conv.patient._id === selectedUser._id)
        );

        if (conversation) {
          // Fetch messages for this conversation
          const response = await axios.get(
            `${API_URL}/api/chat/messages/${conversation._id}`
          );

          if (response.data.success) {
            const formattedMessages = response.data.messages.map((msg) => ({
              id: msg._id,
              sender: msg.sender === user._id ? "You" : selectedUser.name,
              content: msg.content,
              timestamp: msg.createdAt,
            }));
            setMessages(formattedMessages);

            // Mark messages as read
            await axios.put(
              `${API_URL}/api/chat/read/${user._id}/${conversation._id}`
            );
          }
        } else {
          // No conversation exists yet
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedUser, user, conversations, userData?.type]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages([]); // Clear messages when selecting a new user
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      // Send message through the API
      const response = await axios.post(`${API_URL}/api/chat/messages`, {
        senderId: user._id,
        receiverId: selectedUser._id,
        content: newMessage.trim(),
      });

      if (response.data.success) {
        // Add the new message to the messages array
        const message = {
          id: response.data.message._id,
          sender: "You",
          content: response.data.message.content,
          timestamp: response.data.message.createdAt,
        };

        setMessages((prev) => [...prev, message]);
        setNewMessage("");

        // Update conversations list
        const conversationsResponse = await axios.get(
          `${API_URL}/api/chat/conversations/${user._id}`
        );

        if (conversationsResponse.data.success) {
          setConversations(conversationsResponse.data.conversations);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // You might want to show an error notification here
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

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400"
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

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white placeholder-gray-400"
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
