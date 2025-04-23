import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { FiBell } from "react-icons/fi";

const Notifications = () => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

      // Try authenticated endpoint first if token exists
      if (token) {
        try {
          console.log("Trying authenticated endpoint for notifications");
          const response = await axios.get(
            `${API_URL}/api/notifications/user/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setNotifications(response.data.notifications);
            setUnreadCount(
              response.data.notifications.filter((n) => !n.isRead).length
            );
            setLoading(false);
            return;
          }
        } catch (authError) {
          console.log(
            "Authenticated endpoint failed, falling back to public endpoint"
          );
          // Continue to try public endpoint
        }
      }

      // Fall back to public endpoint if token doesn't exist or authenticated request failed
      console.log("Using public endpoint for notifications");
      const publicResponse = await axios.get(
        `${API_URL}/api/notifications/public/user/${userData.id}`
      );

      if (publicResponse.data.success) {
        setNotifications(publicResponse.data.notifications);
        setUnreadCount(
          publicResponse.data.notifications.filter((n) => !n.isRead).length
        );
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
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

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local state to mark notification as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read-all/${userData.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local state to mark all notifications as read
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === "appointment_accepted") {
      // Todo: Navigate to appointments page
      console.log("Navigate to appointment:", notification.relatedId);
    } else if (notification.type === "new_message") {
      // Todo: Navigate to chat
      console.log("Navigate to chat");
    }
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
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
                }`}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
