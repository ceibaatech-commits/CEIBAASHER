/**
 * Enhanced Social Socket Hook - X Algorithm Inspired Event System
 * 
 * Similar to X's unified-user-actions event stream, this hook provides
 * real-time updates for engagement actions (likes, comments, shares).
 * 
 * Event Types:
 * - post_liked / post_unliked: Like engagement events
 * - new_comment: Comment added
 * - post_shared: Repost event
 * - new_post: New content in feed
 * - engagement_update: Batch engagement update
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  handleLikeEvent, 
  handleCommentEvent, 
  handleShareEvent,
  updateEngagement 
} from '../stores/engagementStore';

const BACKEND_URL = window.location.origin;

// Singleton socket instance for the entire app
let globalSocket = null;
let connectionCount = 0;

const getSocket = () => {
  if (!globalSocket) {
    globalSocket = io(BACKEND_URL, {
      path: '/api/socialws/socket.io/',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return globalSocket;
};

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
    connectionCount++;

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

    // Real-time event handlers - update both engagement store and local callbacks
    const handleNewPostEvent = (post) => {
      console.log('[Social Socket] New post:', post.id);
      if (handlersRef.current.onNewPost) {
        handlersRef.current.onNewPost(post);
      }
    };

    const handlePostLikedEvent = (data) => {
      console.log('[Social Socket] Post liked:', data.post_id, 'count:', data.likes_count);
      
      // Update engagement store for reactive UI updates
      handleLikeEvent(data);
      
      // Also call the legacy handler for backward compatibility
      if (handlersRef.current.onPostLiked) {
        handlersRef.current.onPostLiked(data);
      }
    };

    const handlePostUnlikedEvent = (data) => {
      console.log('[Social Socket] Post unliked:', data.post_id, 'count:', data.likes_count);
      
      // Update engagement store
      handleLikeEvent(data);
      
      if (handlersRef.current.onPostUnliked) {
        handlersRef.current.onPostUnliked(data);
      }
    };

    const handleNewCommentEvent = (data) => {
      console.log('[Social Socket] New comment on:', data.post_id);
      
      // Update engagement store
      handleCommentEvent(data);
      
      if (handlersRef.current.onNewComment) {
        handlersRef.current.onNewComment(data);
      }
    };

    const handlePostSharedEvent = (data) => {
      console.log('[Social Socket] Post shared:', data.post_id);
      
      // Update engagement store
      handleShareEvent(data);
    };

    const handleEngagementUpdate = (data) => {
      // Batch engagement update - data format: { post_id, likes_count, views, share_count, comment_count }
      console.log('[Social Socket] Engagement update:', data.post_id);
      updateEngagement(data.post_id, data);
    };

    const handleNotificationEvent = (notification) => {
      console.log('[Social Socket] Notification:', notification);
      if (handlersRef.current.onNotification) {
        handlersRef.current.onNotification(notification);
      }
    };

    const handlePostDeleted = (data) => {
      console.log('[Social Socket] Post deleted:', data.post_id);
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
    socket.on('post_shared', handlePostSharedEvent);
    socket.on('engagement_update', handleEngagementUpdate);
    socket.on('notification', handleNotificationEvent);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('connect_error', handleConnectError);

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
      if (userId) {
        socket.emit('authenticate', { user_id: userId });
      }
    }

    return () => {
      connectionCount--;
      
      // Remove event handlers
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('new_post', handleNewPostEvent);
      socket.off('post_liked', handlePostLikedEvent);
      socket.off('post_unliked', handlePostUnlikedEvent);
      socket.off('new_comment', handleNewCommentEvent);
      socket.off('post_shared', handlePostSharedEvent);
      socket.off('engagement_update', handleEngagementUpdate);
      socket.off('notification', handleNotificationEvent);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('connect_error', handleConnectError);
      
      // Only disconnect if no more connections
      if (connectionCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
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

  // Subscribe to specific post's engagement updates
  const subscribeToPost = useCallback((postId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('subscribe_post', { post_id: postId });
    }
  }, []);

  // Unsubscribe from post updates
  const unsubscribeFromPost = useCallback((postId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('unsubscribe_post', { post_id: postId });
    }
  }, []);

  return {
    isConnected,
    joinFeed,
    leaveFeed,
    subscribeToPost,
    unsubscribeFromPost,
    socket: getSocket(),
  };
};

export default useSocialSocket;
