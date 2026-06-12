/**
 * Messaging Socket singleton — shared by the header InboxDropdown so the
 * unread-message badge updates in real time (replaces the 30s polling loop).
 * The Messages page keeps its own dedicated connection for chat traffic.
 * Auth happens server-side via the httpOnly session_token cookie.
 */
import { io } from 'socket.io-client';

let socket = null;

export const getMessagingSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      path: '/api/messagews/socket.io/',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};
