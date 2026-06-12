import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { getSocialSocket } from '../hooks/useSocialSocket';

const BACKEND_URL = window.location.origin;

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/notifications/unread-count`
      );

      if (response.data.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (filter = 'all', reset = true) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(0);
    } else {
      setLoadingMore(true);
    }
    try {
      const page = reset ? 0 : currentPage;
      const params = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE
      };
      if (filter !== 'all') {
        params.notification_type = filter;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/notifications`,
        { params }
      );

      if (response.data.success) {
        const newNotifs = response.data.notifications || [];
        if (reset) {
          setNotifications(newNotifs);
          setCurrentPage(1);
        } else {
          setNotifications(prev => [...prev, ...newNotifs]);
          setCurrentPage(prev => prev + 1);
        }
        setHasMore(newNotifs.length >= PAGE_SIZE);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentPage]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}/read`,
        {}
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
      await axios.put(
        `${BACKEND_URL}/api/notifications/mark-all-read`,
        {}
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
      // Check if notification was unread before deleting
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);

      await axios.delete(
        `${BACKEND_URL}/api/notifications/${notificationId}`
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

  // Real-time unread count via Socket.IO — the server pushes
  // `unread_notifications_count` on connect and whenever a notification is
  // created, read or deleted. Replaces the old 30-second polling loop.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount(); // one-time fetch for the initial render

    const socket = getSocialSocket();
    const onCount = (data) => setUnreadCount(data?.unread_count || 0);
    const onConnect = () => {
      // Legacy room-join fallback for sessions the cookie handshake misses
      socket.emit('authenticate', { user_id: user.id });
      socket.emit('request_unread_notifications_count');
    };
    socket.on('unread_notifications_count', onCount);
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off('unread_notifications_count', onCount);
      socket.off('connect', onConnect);
    };
  }, [user, fetchUnreadCount]);

  const value = {
    unreadCount,
    notifications,
    loading,
    loadingMore,
    hasMore,
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
