import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (filter = 'all') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = {};
      if (filter !== 'all') {
        params.notification_type = filter;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      await axios.put(
        `${BACKEND_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      // Check if notification was unread before deleting
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);

      await axios.delete(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Decrease unread count if the deleted notification was unread
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [notifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count when user changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUnreadCount();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUnreadCount]);

  const value = {
    unreadCount,
    notifications,
    loading,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
