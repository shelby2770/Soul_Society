import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL || "http://soul-society.onrender.com";

  useEffect(() => {
    if (user && userData?.id) {
      fetchNotifications();
    }
  }, [user, userData]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the auth token from localStorage
      const token = localStorage.getItem("token");
      console.log(
        "[Notifications] Fetching notifications for user:",
        userData?.id
      );

      // Try authenticated endpoint first if token exists
      if (token) {
        try {
          console.log("[Notifications] Trying authenticated endpoint");
          const response = await axios.get(
            `${API_URL}/api/notifications/user/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            console.log(
              "[Notifications] Authenticated endpoint success:",
              response.data.notifications.length,
              "notifications"
            );
            console.log(
              "[Notifications] Types received:",
              response.data.notifications.map((n) => n.type)
            );

            // Log any chat request notifications specifically
            const chatRequestNotifications = response.data.notifications.filter(
              (n) =>
                n.type === "chat_request_approved" ||
                n.type === "chat_request_declined"
            );
            console.log(
              "[Notifications] Chat request notifications:",
              chatRequestNotifications.length
            );

            setNotifications(response.data.notifications);
            setUnreadCount(
              response.data.notifications.filter((n) => !n.isRead).length
            );
            setLoading(false);
            return;
          }
        } catch (authError) {
          console.log(
            "[Notifications] Authenticated endpoint failed:",
            authError.message
          );
          // Continue to try public endpoint
        }
      }

      // Fall back to public endpoint if token doesn't exist or authenticated request failed
      console.log("[Notifications] Using public endpoint");
      const publicResponse = await axios.get(
        `${API_URL}/api/notifications/public/user/${userData.id}`
      );

      if (publicResponse.data.success) {
        console.log(
          "[Notifications] Public endpoint success:",
          publicResponse.data.notifications.length,
          "notifications"
        );
        console.log(
          "[Notifications] Types received:",
          publicResponse.data.notifications.map((n) => n.type)
        );

        // Log any chat request notifications specifically
        const chatRequestNotifications =
          publicResponse.data.notifications.filter(
            (n) =>
              n.type === "chat_request_approved" ||
              n.type === "chat_request_declined"
          );
        console.log(
          "[Notifications] Chat request notifications:",
          chatRequestNotifications.length
        );

        setNotifications(publicResponse.data.notifications);
        setUnreadCount(
          publicResponse.data.notifications.filter((n) => !n.isRead).length
        );
      }
    } catch (err) {
      console.error("[Notifications] Error fetching notifications:", err);
      if (err.response?.status === 401) {
        setError("Please log in again to view notifications");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view these notifications");
      } else {
        setError("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("token");
      let response;

      try {
        // Try authenticated endpoint first
        if (token) {
          console.log("Using authenticated endpoint to mark all as read");
          response = await axios.put(
            `${API_URL}/api/notifications/read-all/${userData.id}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          // Fall back to public endpoint
          console.log(
            "No token available, using public endpoint to mark all as read"
          );
          response = await axios.put(
            `${API_URL}/api/notifications/public/read-all/${userData.id}`
          );
        }

        if (response.data.success) {
          console.log("All notifications marked as read successfully");
        }
      } catch (apiError) {
        // If authenticated endpoint fails, try public endpoint
        console.log("Error with primary endpoint, trying public fallback");
        response = await axios.put(
          `${API_URL}/api/notifications/public/read-all/${userData.id}`
        );
      }

      // Update local state regardless of API success
      console.log("Updating local notification state");
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);

      // Try to update UI locally even if API call fails
      try {
        console.log("Updating local notification state despite API error");
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      } catch (localError) {
        console.error("Error updating local notification state:", localError);
      }

      // Show error message but don't prevent the user from continuing to use the app
      setError(
        "Error updating notifications on server, but marked as read locally"
      );
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("token");
      let response;

      try {
        // Try authenticated endpoint first
        if (token) {
          console.log(
            "Using authenticated endpoint to mark notification as read"
          );
          response = await axios.put(
            `${API_URL}/api/notifications/read/${notificationId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          // Fall back to public endpoint
          console.log(
            "No token available, using public endpoint to mark notification as read"
          );
          response = await axios.put(
            `${API_URL}/api/notifications/public/read/${notificationId}`
          );
        }
      } catch (apiError) {
        // If authenticated endpoint fails, try public endpoint
        console.log("Error with primary endpoint, trying public fallback");
        response = await axios.put(
          `${API_URL}/api/notifications/public/read/${notificationId}`
        );
      }

      // Update local state regardless of API success
      console.log("Updating local notification state");
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);

      // Try to update UI locally even if API call fails
      try {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (localError) {
        console.error("Error updating local notification state:", localError);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (
      notification.type === "appointment_accepted" ||
      notification.type === "appointment_rescheduled"
    ) {
      // Navigate to appointments page
      console.log(
        `Navigate to appointment: ${notification.relatedId} (${notification.type})`
      );
      navigate("/appointments");
    } else if (notification.type === "new_message") {
      // Navigate to chat
      console.log("Navigate to chat");
      navigate("/chat");
    } else if (
      notification.type === "chat_request_approved" ||
      notification.type === "chat_request_declined"
    ) {
      // If approved, navigate to chat
      if (notification.type === "chat_request_approved") {
        navigate("/chat");
      }
    } else if (notification.type === "chat_request_new") {
      // For doctors, navigate to chat page to see pending requests
      navigate("/chat");
    }
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Helper to get notification styling based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case "appointment_accepted":
        return "border-l-4 border-green-500";
      case "appointment_rescheduled":
        return "border-l-4 border-amber-500";
      case "chat_request_approved":
        return "border-l-4 border-blue-500";
      case "chat_request_declined":
        return "border-l-4 border-red-500";
      case "chat_request_new":
        return "border-l-4 border-purple-500";
      default:
        return "";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={toggleNotifications}
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none relative"
        aria-label="Notifications"
      >
        <FiBell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 overflow-hidden max-h-96 overflow-y-auto border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-500">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            )}

            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !notification.isRead ? "bg-blue-50" : ""
                } ${getNotificationStyle(notification.type)}`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                {notification.type === "appointment_rescheduled" && (
                  <div className="mt-2 bg-amber-50 p-2 rounded-md text-xs text-amber-700">
                    Your appointment has been rescheduled. Please check the new
                    time.
                  </div>
                )}
                {notification.type === "chat_request_approved" && (
                  <div className="mt-2 bg-blue-50 p-2 rounded-md text-xs text-blue-700">
                    You can now chat with this doctor.
                  </div>
                )}
                {notification.type === "chat_request_declined" && (
                  <div className="mt-2 bg-red-50 p-2 rounded-md text-xs text-red-700">
                    Your chat request was declined.
                  </div>
                )}
                {notification.type === "chat_request_new" && (
                  <div className="mt-2 bg-purple-50 p-2 rounded-md text-xs text-purple-700">
                    New chat request from a patient. Click to review.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
