import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { API_URL } from "../utils/api";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, userData } = useAuth();

  // Get auth token
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Initialize notifications for new user
  const initializeNotifications = async (userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/notifications/initialize`,
        { userId },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (!userData?._id) return;

      const response = await axios.get(
        `${API_URL}/api/notifications/user/${userData._id}`,
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        if (!response.data.notifications) {
          // If no notifications found, initialize them
          await initializeNotifications(userData._id);
        } else {
          setNotifications(response.data.notifications);
          setUnreadCount(
            response.data.notifications.filter((n) => !n.isRead).length
          );
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.error("Unauthorized access to notifications");
      } else if (error.response?.status === 404) {
        // If notifications not found, initialize them
        await initializeNotifications(userData._id);
      } else {
        console.error("Error fetching notifications:", error);
      }
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (!userData?._id) return;

      const response = await axios.put(
        `${API_URL}/api/notifications/user/${userData._id}/read-all`,
        {},
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user && userData) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, userData]);

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
