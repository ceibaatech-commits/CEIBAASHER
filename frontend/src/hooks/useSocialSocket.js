import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useSocialSocket = (userId, onNewPost, onPostLiked, onPostUnliked, onNewComment, onNotification) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection - connect to /api/socialws endpoint
    socketRef.current = io(BACKEND_URL, {
      path: '/api/socialws/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Social Socket] Connected');
      setIsConnected(true);
      
      // Authenticate if user is logged in
      if (userId) {
        socket.emit('authenticate', { user_id: userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Social Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('authenticated', (data) => {
      console.log('[Social Socket] Authenticated:', data);
    });

    // Real-time event handlers
    socket.on('new_post', (post) => {
      console.log('[Social Socket] New post:', post.id);
      if (onNewPost) onNewPost(post);
    });

    socket.on('post_liked', (data) => {
      console.log('[Social Socket] Post liked:', data.post_id);
      if (onPostLiked) onPostLiked(data);
    });

    socket.on('post_unliked', (data) => {
      console.log('[Social Socket] Post unliked:', data.post_id);
      if (onPostUnliked) onPostUnliked(data);
    });

    socket.on('new_comment', (data) => {
      console.log('[Social Socket] New comment on:', data.post_id);
      if (onNewComment) onNewComment(data);
    });

    socket.on('post_shared', (data) => {
      console.log('[Social Socket] Post shared:', data.post_id);
    });

    socket.on('notification', (notification) => {
      console.log('[Social Socket] Notification:', notification);
      if (onNotification) onNotification(notification);
    });

    socket.on('post_deleted', (data) => {
      console.log('[Social Socket] Post deleted:', data.post_id);
    });

    socket.on('connect_error', (error) => {
      console.error('[Social Socket] Connection error:', error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Re-authenticate when userId changes
  useEffect(() => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('authenticate', { user_id: userId });
    }
  }, [userId]);

  const joinFeed = useCallback((tab) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_feed', { tab });
    }
  }, []);

  const leaveFeed = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_feed', {});
    }
  }, []);

  return {
    isConnected,
    joinFeed,
    leaveFeed,
    socket: socketRef.current
  };
};

export default useSocialSocket;
