/**
 * Social Socket Hook - Real-time updates for Victory Lane
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = window.location.origin;

// Singleton socket instance for the entire app.
// Kept alive for the app's lifetime: NotificationContext relies on it for
// real-time unread-count pushes (replaces the 30s polling loop).
let globalSocket = null;

export const getSocialSocket = () => {
  if (!globalSocket) {
    globalSocket = io(BACKEND_URL, {
      path: '/api/socialws/socket.io/',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return globalSocket;
};

const getSocket = getSocialSocket;

export const useSocialSocket = (userId, onNewPost, onPostLiked, onPostUnliked, onNewComment, onNotification) => {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef({});
  
  // Store handlers in ref to avoid stale closures
  handlersRef.current = {
    onNewPost,
    onPostLiked,
    onPostUnliked,
    onNewComment,
    onNotification,
  };

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      console.log('[Social Socket] Connected');
      setIsConnected(true);
      
      // Authenticate if user is logged in
      if (userId) {
        socket.emit('authenticate', { user_id: userId });
      }
    };

    const handleDisconnect = () => {
      console.log('[Social Socket] Disconnected');
      setIsConnected(false);
    };

    const handleAuthenticated = (data) => {
      console.log('[Social Socket] Authenticated:', data);
    };

    // Real-time event handlers
    const handleNewPostEvent = (post) => {
      console.log('[Social Socket] New post:', post.id);
      if (handlersRef.current.onNewPost) {
        handlersRef.current.onNewPost(post);
      }
    };

    const handlePostLikedEvent = (data) => {
      console.log('[Social Socket] Post liked:', data.post_id, 'count:', data.likes_count);
      if (handlersRef.current.onPostLiked) {
        handlersRef.current.onPostLiked(data);
      }
    };

    const handlePostUnlikedEvent = (data) => {
      console.log('[Social Socket] Post unliked:', data.post_id, 'count:', data.likes_count);
      if (handlersRef.current.onPostUnliked) {
        handlersRef.current.onPostUnliked(data);
      }
    };

    const handleNewCommentEvent = (data) => {
      console.log('[Social Socket] New comment on:', data.post_id);
      if (handlersRef.current.onNewComment) {
        handlersRef.current.onNewComment(data);
      }
    };

    const handleNotificationEvent = (notification) => {
      console.log('[Social Socket] Notification:', notification);
      if (handlersRef.current.onNotification) {
        handlersRef.current.onNotification(notification);
      }
    };

    const handleConnectError = (error) => {
      console.error('[Social Socket] Connection error:', error.message);
    };

    // Register event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('new_post', handleNewPostEvent);
    socket.on('post_liked', handlePostLikedEvent);
    socket.on('post_unliked', handlePostUnlikedEvent);
    socket.on('new_comment', handleNewCommentEvent);
    socket.on('notification', handleNotificationEvent);
    socket.on('connect_error', handleConnectError);

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
      if (userId) {
        socket.emit('authenticate', { user_id: userId });
      }
    }

    return () => {
      // Remove event handlers
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('new_post', handleNewPostEvent);
      socket.off('post_liked', handlePostLikedEvent);
      socket.off('post_unliked', handlePostUnlikedEvent);
      socket.off('new_comment', handleNewCommentEvent);
      socket.off('notification', handleNotificationEvent);
      socket.off('connect_error', handleConnectError);
    };
  }, [userId]);

  // Re-authenticate when userId changes
  useEffect(() => {
    const socket = getSocket();
    if (socket.connected && userId) {
      socket.emit('authenticate', { user_id: userId });
    }
  }, [userId]);

  const joinFeed = useCallback((tab) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('join_feed', { tab });
    }
  }, []);

  const leaveFeed = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('leave_feed', {});
    }
  }, []);

  return {
    isConnected,
    joinFeed,
    leaveFeed,
    socket: getSocket(),
  };
};

export default useSocialSocket;
