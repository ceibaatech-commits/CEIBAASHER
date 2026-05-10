import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, MessageSquare, Search, Check, CheckCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import UserAvatar from '../components/UserAvatar';
import Header from '../components/Header';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convsError, setConvsError] = useState(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [convsRefreshKey, setConvsRefreshKey] = useState(0);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // ---------- Bug 1: handle ?userId=... → auto-create / fetch thread ----------
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get('userId');
    if (!targetUserId) return;
    if (targetUserId === user.id) {
      navigate('/messages', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post(`${BACKEND_URL}/api/messages/conversations`, {
          target_user_id: targetUserId,
        });
        if (!cancelled && res.data?.success && res.data.conversation?.id) {
          // Replace history so the back button doesn't loop
          navigate(`/messages/${res.data.conversation.id}`, { replace: true });
          // Force the conversation list to refresh so the new thread shows on the left
          setConvsRefreshKey(k => k + 1);
        }
      } catch (err) {
        console.error('Failed to start conversation from userId param:', err);
        navigate('/messages', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [location.search, user, navigate]);

  // ---------- Socket — cookie auto-auth on connect (server-side) ----------
  useEffect(() => {
    if (!user) return;
    const sock = io(`${BACKEND_URL}/api/messagews`, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      withCredentials: true,
    });
    socketRef.current = sock;

    sock.on('new_message', (msg) => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? { ...c, last_message_text: msg.text, last_message_at: msg.timestamp, last_message: msg.sender_id }
          : c
      ));
    });
    sock.on('user_typing', () => setOtherTyping(true));
    sock.on('user_stop_typing', () => setOtherTyping(false));

    return () => { sock.disconnect(); };
  }, [user]);

  // ---------- Bug 2: load conversations with proper error handling ----------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingConvs(true);
    setConvsError(null);
    axios.get(`${BACKEND_URL}/api/messages/conversations`)
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) {
          setConversations(res.data.conversations || []);
        } else {
          setConvsError('Failed to load conversations.');
        }
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to fetch conversations:', err);
        setConvsError(
          err?.response?.status === 401
            ? 'Please log in again to view your messages.'
            : 'Could not load conversations. Please check your connection and try again.'
        );
      })
      .finally(() => { if (!cancelled) setLoadingConvs(false); });
    return () => { cancelled = true; };
  }, [user, convsRefreshKey]);

  // ---------- Load active conversation messages ----------
  useEffect(() => {
    if (!conversationId || !user) {
      setActiveConv(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    axios.get(`${BACKEND_URL}/api/messages/conversations/${conversationId}/messages`)
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) {
          setMessages(res.data.messages || []);
          setActiveConv(res.data.conversation);
          socketRef.current?.emit('join_conversation', { conversation_id: conversationId });
        }
      })
      .catch(err => {
        console.error('Failed to fetch messages:', err);
      });
    return () => {
      cancelled = true;
      socketRef.current?.emit('leave_conversation', { conversation_id: conversationId });
    };
  }, [conversationId, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const sendMessage = useCallback(async () => {
    if (!newMsg.trim() || !conversationId || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/messages/conversations/${conversationId}/messages`,
        { text: newMsg.trim() }
      );
      if (res.data?.success) {
        setMessages(prev => (prev.some(m => m.id === res.data.message.id) ? prev : [...prev, res.data.message]));
        setNewMsg('');
        setConversations(prev => prev.map(c =>
          c.id === conversationId
            ? { ...c, last_message_text: res.data.message.text, last_message_at: res.data.message.timestamp, last_message: user?.id }
            : c
        ));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [newMsg, conversationId, sending, user]);

  const handleTyping = () => {
    socketRef.current?.emit('typing', { conversation_id: conversationId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversation_id: conversationId });
    }, 1500);
  };

  const otherUser = activeConv
    ? conversations.find(c => c.id === activeConv.id)?.other_user
    : null;

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMsgTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.other_user?.name || '';
    const uname = c.other_user?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || uname.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" data-testid="messages-login-required">
        <p className="text-gray-400">Please log in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950" data-testid="messages-page">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside
          data-testid="conversations-sidebar"
          className={`${conversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] border-r border-gray-800/60 bg-gray-950 shrink-0`}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-800/60">
            <div className="flex items-center gap-3 mb-3">
              <button
                data-testid="messages-back-btn"
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Messages</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/60 pointer-events-none z-10" />
              <input
                data-testid="conversation-search"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto" data-testid="conversation-list">
            {(() => {
              if (loadingConvs) {
                return (
                  <div className="flex items-center justify-center py-16" data-testid="conversations-loading">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                );
              }
              if (convsError) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="conversations-error">
                    <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                    <p className="text-red-300 text-sm font-semibold mb-2">{convsError}</p>
                    <button
                      data-testid="conversations-retry"
                      onClick={() => setConvsRefreshKey(k => k + 1)}
                      className="mt-2 px-4 py-1.5 rounded-full bg-gray-800 text-gray-200 text-xs font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                );
              }
              if (filteredConversations.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center" data-testid="conversations-empty">
                    <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
                    <p className="text-gray-600 text-xs mt-1">Start a conversation from someone&apos;s profile</p>
                  </div>
                );
              }
              return filteredConversations.map(conv => {
                const isActive = conversationId === conv.id;
                const unread = conv.unread || 0;
                return (
                  <button
                    key={conv.id}
                    data-testid={`conversation-item-${conv.id}`}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-gray-800/30 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-l-2 border-l-cyan-400'
                        : 'hover:bg-gray-900/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar
                        profilePicture={conv.other_user?.avatar}
                        name={conv.other_user?.name}
                        size="md"
                        clickable={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-white' : 'text-gray-300'}`}>
                          {conv.other_user?.name || 'Unknown'}
                        </span>
                        <span className="text-[11px] text-gray-500 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate ${unread > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                          {conv.last_message === user?.id && <span className="text-gray-600">You: </span>}
                          {conv.last_message_text || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="ml-2 shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-[10px] font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </aside>

        {/* Chat area */}
        <main className={`${conversationId ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
          {!conversationId ? (
            /* Bug 4: Empty state */
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" data-testid="messages-empty-state">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">Select a conversation to start chatting</h2>
              <p className="text-gray-500 text-sm max-w-xs">Pick a thread from the left, or start a new one from a user&apos;s profile.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm" data-testid="chat-header">
                <button
                  data-testid="chat-back-btn"
                  onClick={() => navigate('/messages')}
                  className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {otherUser ? (
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${otherUser.username}`)}
                  >
                    <UserAvatar profilePicture={otherUser.avatar} name={otherUser.name} size="sm" clickable={false} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate" data-testid="chat-header-name">{otherUser.name}</p>
                      <p className="text-[11px] text-gray-500">@{otherUser.username}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">Conversation</p>
                  </div>
                )}
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" data-testid="messages-list">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center" data-testid="empty-thread-state">
                    <p className="text-gray-600 text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id;
                  const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                  return (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.id}`}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <div className="w-7 shrink-0">
                          {showAvatar && otherUser && (
                            <UserAvatar profilePicture={otherUser.avatar} name={otherUser.name} size="xs" clickable={false} />
                          )}
                        </div>
                      )}
                      <div className={`group max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMine
                              ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-br-md'
                              : 'bg-gray-800 text-gray-100 rounded-bl-md'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{formatMsgTime(msg.timestamp)}</span>
                          {isMine && (
                            msg.read
                              ? <CheckCheck className="w-3 h-3 text-cyan-400" />
                              : <Check className="w-3 h-3 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && (
                  <div className="flex items-center gap-2 pl-9">
                    <div className="flex gap-1 px-3.5 py-2.5 rounded-2xl bg-gray-800 rounded-bl-md">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-gray-800/60 bg-gray-950/80 backdrop-blur-sm" data-testid="message-input-bar">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    data-testid="message-input"
                    type="text"
                    placeholder="Type a message..."
                    value={newMsg}
                    onChange={e => { setNewMsg(e.target.value); handleTyping(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    data-testid="send-message-btn"
                    onClick={sendMessage}
                    disabled={!newMsg.trim() || sending}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      newMsg.trim()
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
