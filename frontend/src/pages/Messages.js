import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  AlertCircle,
  Users,
  UserPlus,
  ChevronDown,
  Sun,
  Moon,
  Plus,
  Smile,
  MoreVertical,
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import UserAvatar from '../components/UserAvatar';
import Header from '../components/Header';
import GroupModal from '../components/messages/GroupModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// =====================================================================
// Theme hook (chat-only) — system preference + manual override (localStorage)
// =====================================================================
const THEME_STORAGE_KEY = 'ceibaa.chat.theme'; // 'light' | 'dark' | 'system'

const useChatTheme = () => {
  const [pref, setPref] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    } catch (_e) {
      return 'system';
    }
  });
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const isDark = pref === 'dark' || (pref === 'system' && systemDark);

  const setPreference = (next) => {
    setPref(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (_e) { /* ignore */ }
  };

  return { isDark, pref, setPreference };
};

// =====================================================================
// Date helpers
// =====================================================================
const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
};

const formatDaySeparator = (d) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime()) return 'Today';
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  const diffDays = Math.round((today - day) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

// =====================================================================
// Sub-components
// =====================================================================
const DaySeparator = ({ label, isDark }) => (
  <div className="flex justify-center my-4" data-testid="day-separator">
    <span
      className={`text-[11px] font-medium font-geist px-3 py-1 rounded-full ${
        isDark ? 'bg-[#1E2230] text-[#94A3B8]' : 'bg-[#F1F2F6] text-[#64748B]'
      }`}
    >
      {label}
    </span>
  </div>
);

const SystemMessage = ({ text, isDark }) => (
  <div className="flex justify-center py-1.5">
    <span
      className={`text-[12px] font-geist px-3 py-1 ${
        isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
      }`}
    >
      {text}
    </span>
  </div>
);

const TypingIndicator = ({ isDark }) => (
  <div className="flex items-end gap-2 mt-1" data-testid="typing-indicator">
    <div className="w-7 shrink-0" />
    <div
      className={`flex gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md ${
        isDark ? 'bg-[#1E2230]' : 'bg-[#F1F2F6]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '0ms' }} />
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '150ms' }} />
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const Receipt = ({ msg, isDark }) => {
  if (msg.read) {
    return <CheckCheck data-testid={`receipt-read-${msg.id}`} aria-label="Read" className="w-3.5 h-3.5 text-[#7C3AED]" />;
  }
  if (msg.delivered) {
    return <CheckCheck data-testid={`receipt-delivered-${msg.id}`} aria-label="Delivered" className={`w-3.5 h-3.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />;
  }
  return <Check data-testid={`receipt-sent-${msg.id}`} aria-label="Sent" className={`w-3.5 h-3.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />;
};

// =====================================================================
// Main component
// =====================================================================
export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, pref, setPreference } = useChatTheme();

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
  const [groupModal, setGroupModal] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // for swipe-to-close visual feedback

  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const touchStartRef = useRef(null);

  // ---------- Body attribute to hide global Header + BottomNav while in chat ----------
  useLayoutEffect(() => {
    const inChat = !!conversationId;
    if (inChat) {
      document.body.dataset.chatActive = 'true';
      // Also hide horizontal scrollbars while chat is full-screen on mobile
    } else {
      delete document.body.dataset.chatActive;
    }
    return () => {
      delete document.body.dataset.chatActive;
    };
  }, [conversationId]);

  // ---------- visualViewport: keep input above iOS keyboard ----------
  useEffect(() => {
    if (!conversationId || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.style.height = `${vv.height}px`;
      }
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      if (chatContainerRef.current) chatContainerRef.current.style.height = '';
    };
  }, [conversationId]);

  // ---------- handle ?userId=... → auto-create / fetch thread ----------
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
          navigate(`/messages/${res.data.conversation.id}`, { replace: true });
          setConvsRefreshKey(k => k + 1);
        }
      } catch (err) {
        console.error('Failed to start conversation from userId param:', err);
        navigate('/messages', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [location.search, user, navigate]);

  // ---------- Socket ----------
  useEffect(() => {
    if (!user) return;
    const sock = io(BACKEND_URL, {
      path: '/api/messagews/socket.io/',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
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
    sock.on('conversations_refresh', () => setConvsRefreshKey(k => k + 1));
    sock.on('presence_update', ({ user_id: pUid, online }) => {
      setConversations(prev => prev.map(c =>
        c.other_user?.id === pUid
          ? { ...c, other_user: { ...c.other_user, online } }
          : c
      ));
    });
    sock.on('message_delivered', ({ message_ids }) => {
      if (!Array.isArray(message_ids) || message_ids.length === 0) return;
      const ids = new Set(message_ids);
      setMessages(prev => prev.map(m => (ids.has(m.id) ? { ...m, delivered: true } : m)));
    });
    sock.on('messages_read', ({ message_ids, reader_id }) => {
      if (!Array.isArray(message_ids) || message_ids.length === 0) return;
      if (reader_id === user?.id) return;
      const ids = new Set(message_ids);
      setMessages(prev => prev.map(m => (ids.has(m.id) ? { ...m, delivered: true, read: true } : m)));
    });
    return () => { sock.disconnect(); };
  }, [user]);

  // ---------- Load conversations ----------
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingConvs(true);
    setConvsError(null);
    axios.get(`${BACKEND_URL}/api/messages/conversations`)
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) setConversations(res.data.conversations || []);
        else setConvsError('Failed to load conversations.');
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
      .catch(err => console.error('Failed to fetch messages:', err));
    return () => {
      cancelled = true;
      socketRef.current?.emit('leave_conversation', { conversation_id: conversationId });
    };
  }, [conversationId, user]);

  // Auto-mark new incoming messages as read while the conversation is open
  useEffect(() => {
    if (!conversationId || !user) return;
    const hasUnreadIncoming = messages.some(m => m.sender_id !== user.id && !m.read);
    if (!hasUnreadIncoming) return;
    axios.put(`${BACKEND_URL}/api/messages/conversations/${conversationId}/read`).catch(() => {});
    setMessages(prev => prev.map(m => (m.sender_id !== user.id && !m.read ? { ...m, read: true, delivered: true } : m)));
  }, [messages, conversationId, user]);

  // Smart auto-scroll: only scroll if we're already near the bottom
  const isNearBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowJumpToBottom(false);
      setUnreadCount(0);
    } else {
      // New message arrived while scrolled up
      const last = messages[messages.length - 1];
      if (last && last.sender_id !== user?.id) {
        setShowJumpToBottom(true);
        setUnreadCount(c => c + 1);
      }
    }
  }, [messages, isNearBottom, user]);

  // Track scroll position to hide "jump to bottom" pill when user scrolls down
  const handleMessagesScroll = useCallback(() => {
    if (isNearBottom()) {
      setShowJumpToBottom(false);
      setUnreadCount(0);
    }
  }, [isNearBottom]);

  const jumpToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpToBottom(false);
    setUnreadCount(0);
  };

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
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
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

  // Auto-grow textarea (max 5 lines ~ 120px)
  const handleInputChange = (e) => {
    setNewMsg(e.target.value);
    handleTyping();
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const otherUser = activeConv
    ? conversations.find(c => c.id === activeConv.id)?.other_user
    : null;
  const isGroup = !!activeConv?.is_group;

  // Load member list for the active group
  useEffect(() => {
    if (!isGroup || !conversationId) { setGroupMembers([]); return; }
    let cancelled = false;
    axios.get(`${BACKEND_URL}/api/messages/groups/${conversationId}/members`)
      .then(res => { if (!cancelled && res.data?.success) setGroupMembers(res.data.members || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isGroup, conversationId, convsRefreshKey]);

  // ---------- Touch gestures: swipe-down on header to close chat ----------
  const closeChat = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const onHeaderTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };
  const onHeaderTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    const dy = t.clientY - touchStartRef.current.y;
    const dx = t.clientX - touchStartRef.current.x;
    // Only respond to mostly-vertical-down drags
    if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
      setDragOffset(Math.min(dy, 160));
    }
  };
  const onHeaderTouchEnd = () => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    if (dragOffset > 80) {
      setDragOffset(0);
      closeChat();
    } else {
      setDragOffset(0);
    }
  };

  // ---------- Edge-swipe from left to close ----------
  const edgeTouchRef = useRef(null);
  useEffect(() => {
    if (!conversationId) return;
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      if (t.clientX < 22) {
        edgeTouchRef.current = { x: t.clientX, y: t.clientY };
      }
    };
    const onMove = (e) => {
      if (!edgeTouchRef.current) return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - edgeTouchRef.current.x;
      const dy = t.clientY - edgeTouchRef.current.y;
      if (dx > 80 && Math.abs(dy) < 60) {
        edgeTouchRef.current = null;
        closeChat();
      }
    };
    const onEnd = () => { edgeTouchRef.current = null; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [conversationId, closeChat]);

  // ---------- Formatting ----------
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

  // ---------- Pre-compute streaks + day separators ----------
  const renderableMessages = useMemo(() => {
    const out = [];
    let prevDate = null;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const d = m.timestamp ? new Date(m.timestamp) : new Date();
      if (!prevDate || !isSameDay(prevDate, d)) {
        out.push({ type: 'day', id: `day-${d.toISOString().slice(0, 10)}-${i}`, label: formatDaySeparator(d) });
        prevDate = d;
      }
      if (m.system) {
        out.push({ type: 'system', msg: m });
        continue;
      }
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      const prevSameSender = prev && !prev.system && prev.sender_id === m.sender_id
        && prev.timestamp && isSameDay(new Date(prev.timestamp), d);
      const nextSameSender = next && !next.system && next.sender_id === m.sender_id
        && next.timestamp && isSameDay(new Date(next.timestamp), d);
      out.push({
        type: 'msg',
        msg: m,
        isFirstInStreak: !prevSameSender,
        isLastInStreak: !nextSameSender,
      });
    }
    return out;
  }, [messages]);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = c.is_group ? (c.name || '') : (c.other_user?.name || '');
    const uname = c.other_user?.username || '';
    return name.toLowerCase().includes(q) || uname.toLowerCase().includes(q);
  });

  // =====================================================================
  // GUARD: not logged in
  // =====================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6" data-testid="messages-login-required">
        <p className="text-slate-600">Please log in to access messages.</p>
      </div>
    );
  }

  // =====================================================================
  // CHAT-ACTIVE GLOBAL CSS (hides Header + BottomNav while in a conversation)
  // =====================================================================
  const globalChatCss = (
    <style>{`
      body[data-chat-active="true"] [data-mobile-bottom-nav],
      body[data-chat-active="true"] [data-create-post-fab] {
        display: none !important;
      }
      body[data-chat-active="true"] {
        overflow: hidden;
      }
      @keyframes chat-slide-in {
        from { transform: translateX(8%); opacity: 0; }
        to   { transform: translateX(0);  opacity: 1; }
      }
      @keyframes chat-slide-down {
        from { transform: translateY(0); opacity: 1; }
        to   { transform: translateY(20%); opacity: 0; }
      }
      .animate-chat-in { animation: chat-slide-in 220ms cubic-bezier(0.32,0.72,0,1); }
      @media (prefers-reduced-motion: reduce) {
        .animate-chat-in { animation: none; }
      }
      @keyframes msg-pop {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-msg-pop { animation: msg-pop 180ms cubic-bezier(0.32,0.72,0,1); }
    `}</style>
  );

  // =====================================================================
  // RENDER: Immersive chat view
  // =====================================================================
  if (conversationId) {
    // Theme tokens
    const T = isDark ? {
      bg: '#0B0D12',
      surface: '#151821',
      surfaceElev: '#1E2230',
      border: '#222632',
      text: '#F8FAFC',
      muted: '#94A3B8',
      bubbleIn: '#1E2230',
      bubbleInText: '#F8FAFC',
      input: '#151821',
      inputBorder: '#222632',
      inputText: '#F8FAFC',
      inputPlaceholder: '#64748B',
    } : {
      bg: '#FFFFFF',
      surface: '#F7F8FA',
      surfaceElev: '#FFFFFF',
      border: '#E5E7EB',
      text: '#0F172A',
      muted: '#64748B',
      bubbleIn: '#F1F2F6',
      bubbleInText: '#0F172A',
      input: '#F7F8FA',
      inputBorder: '#E5E7EB',
      inputText: '#0F172A',
      inputPlaceholder: '#94A3B8',
    };

    return (
      <>
        {globalChatCss}
        <div
          ref={chatContainerRef}
          data-testid="chat-immersive"
          className="fixed inset-0 flex flex-col z-[100] animate-chat-in"
          style={{
            height: '100dvh',
            backgroundColor: T.bg,
            color: T.text,
            fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
            transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
            transition: dragOffset ? 'none' : 'transform 220ms cubic-bezier(0.32,0.72,0,1)',
            opacity: dragOffset ? Math.max(0.4, 1 - dragOffset / 320) : 1,
          }}
        >
          {/* ===== Chat Header ===== */}
          <header
            data-testid="chat-header"
            onTouchStart={onHeaderTouchStart}
            onTouchMove={onHeaderTouchMove}
            onTouchEnd={onHeaderTouchEnd}
            className="flex items-center gap-2 px-3 sm:px-4 h-14 shrink-0 border-b"
            style={{
              borderColor: T.border,
              backgroundColor: T.bg,
              paddingTop: 'env(safe-area-inset-top)',
              minHeight: 'calc(56px + env(safe-area-inset-top))',
            }}
          >
            {/* Drag handle hint (mobile) */}
            <div
              aria-hidden
              className="md:hidden absolute left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
              style={{ top: 4, backgroundColor: isDark ? '#2A2F3D' : '#E5E7EB' }}
            />
            <button
              data-testid="chat-back-btn"
              aria-label="Back to messages"
              onClick={closeChat}
              className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              style={{ color: T.text }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surface}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Identity */}
            {isGroup ? (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? '#1E2230' : '#EEF0FF' }}
                >
                  <Users className="w-4.5 h-4.5" style={{ color: '#7C3AED' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    data-testid="chat-header-name"
                    className="text-[15px] font-semibold leading-tight truncate"
                    style={{ color: T.text }}
                  >
                    {activeConv?.name || 'Group'}
                  </p>
                  <p
                    data-testid="chat-header-members"
                    className="text-[12px] leading-tight truncate"
                    style={{ color: T.muted }}
                  >
                    {groupMembers.length > 0
                      ? `${groupMembers.length} members · ${groupMembers.map(m => m.name?.split(' ')[0]).slice(0, 3).join(', ')}${groupMembers.length > 3 ? '…' : ''}`
                      : 'Group chat'}
                  </p>
                </div>
              </div>
            ) : otherUser ? (
              <button
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                onClick={() => navigate(`/profile/${otherUser.username}`)}
              >
                <div className="relative shrink-0">
                  <UserAvatar profilePicture={otherUser.avatar} name={otherUser.name} size="sm" clickable={false} />
                  {otherUser.online && (
                    <span
                      data-testid="chat-header-presence-dot"
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#22C55E', boxShadow: `0 0 0 2px ${T.bg}` }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p data-testid="chat-header-name" className="text-[15px] font-semibold leading-tight truncate" style={{ color: T.text }}>
                    {otherUser.name}
                  </p>
                  <p
                    data-testid="chat-header-presence-text"
                    className="text-[12px] leading-tight truncate"
                    style={{ color: otherUser.online ? '#22C55E' : T.muted }}
                  >
                    {otherUser.online ? 'online' : `@${otherUser.username}`}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate" style={{ color: T.text }}>Conversation</p>
              </div>
            )}

            {/* Right cluster: add-member (group) · theme · collapse */}
            {isGroup && (
              <button
                data-testid="add-member-btn"
                aria-label="Add members"
                onClick={() => setGroupModal('add')}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                style={{ color: T.text }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surface}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <UserPlus className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Theme toggle */}
            <div className="relative">
              <button
                data-testid="chat-theme-toggle"
                aria-label="Toggle theme"
                onClick={() => setThemeMenuOpen(o => !o)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                style={{ color: T.text }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surface}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </button>
              {themeMenuOpen && (
                <div
                  className="absolute right-0 top-11 w-40 rounded-2xl shadow-xl overflow-hidden z-10 border"
                  style={{ backgroundColor: T.surfaceElev, borderColor: T.border }}
                  onMouseLeave={() => setThemeMenuOpen(false)}
                  data-testid="chat-theme-menu"
                >
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: MoreVertical },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const active = pref === opt.key;
                    return (
                      <button
                        key={opt.key}
                        data-testid={`theme-opt-${opt.key}`}
                        onClick={() => { setPreference(opt.key); setThemeMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
                        style={{
                          color: active ? '#7C3AED' : T.text,
                          backgroundColor: active ? (isDark ? '#1E1B33' : '#F4F0FF') : 'transparent',
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{opt.label}</span>
                        {active && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collapse arrow */}
            <button
              data-testid="chat-collapse-btn"
              aria-label="Close chat and return to messages"
              onClick={closeChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              style={{ color: T.text }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surface}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </header>

          {/* ===== Messages scroll area ===== */}
          <div
            ref={messagesScrollRef}
            onScroll={handleMessagesScroll}
            data-testid="messages-list"
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pt-3 pb-3 relative"
            style={{ backgroundColor: T.bg }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6" data-testid="empty-thread-state">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: isDark ? '#1E2230' : '#F4F0FF' }}
                >
                  <MessageSquare className="w-6 h-6" style={{ color: '#7C3AED' }} />
                </div>
                <p className="text-[14px] font-medium" style={{ color: T.text }}>Say hello 👋</p>
                <p className="text-[12px] mt-1" style={{ color: T.muted }}>This is the start of your conversation.</p>
              </div>
            )}

            {renderableMessages.map((item, idx) => {
              if (item.type === 'day') {
                return <DaySeparator key={item.id} label={item.label} isDark={isDark} />;
              }
              if (item.type === 'system') {
                return <SystemMessage key={item.msg.id} text={item.msg.text} isDark={isDark} />;
              }
              const { msg, isFirstInStreak, isLastInStreak } = item;
              const isMine = msg.sender_id === user?.id;
              const senderInfo = isGroup ? msg.sender : otherUser;
              // Group same-sender messages closer together
              const nextItem = renderableMessages[idx + 1];
              const tightBottom = nextItem && nextItem.type === 'msg' && !nextItem.isFirstInStreak;
              return (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  style={{ marginTop: isFirstInStreak ? 12 : 2, marginBottom: tightBottom ? 0 : 0 }}
                >
                  {!isMine && (
                    <div className="w-7 shrink-0">
                      {isLastInStreak && senderInfo && (
                        <UserAvatar
                          profilePicture={senderInfo.avatar}
                          name={senderInfo.name}
                          size="xs"
                          clickable={false}
                        />
                      )}
                    </div>
                  )}
                  <div className={`max-w-[78%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Sender name on first incoming bubble of a streak (groups only) */}
                    {isGroup && !isMine && isFirstInStreak && senderInfo?.name && (
                      <p
                        data-testid={`sender-name-${msg.id}`}
                        className="text-[12px] font-semibold mb-1 px-1"
                        style={{ color: '#7C3AED' }}
                      >
                        {senderInfo.name}
                      </p>
                    )}
                    <div
                      className="px-3.5 py-2 text-[14px] leading-[1.45] break-words animate-msg-pop"
                      style={{
                        // Asymmetric corners — the corner closest to the sender is flattened (6px)
                        borderRadius: isMine
                          ? `18px 18px ${isLastInStreak ? '6px' : '18px'} 18px`
                          : `18px 18px 18px ${isLastInStreak ? '6px' : '18px'}`,
                        background: isMine
                          ? (isDark
                              ? 'linear-gradient(135deg, #6D5BFF 0%, #8B5CF6 100%)'
                              : 'linear-gradient(135deg, #5B5BF0 0%, #7C3AED 100%)')
                          : T.bubbleIn,
                        color: isMine ? '#FFFFFF' : T.bubbleInText,
                        boxShadow: isMine
                          ? '0 1px 2px rgba(124, 58, 237, 0.18)'
                          : (isDark ? 'none' : '0 1px 1px rgba(15,23,42,0.04)'),
                      }}
                    >
                      {msg.text}
                    </div>
                    {/* Time + receipts: only on the LAST bubble of a streak */}
                    {isLastInStreak && (
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] tabular-nums" style={{ color: T.muted }}>
                          {formatMsgTime(msg.timestamp)}
                        </span>
                        {isMine && <Receipt msg={msg} isDark={isDark} />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {otherTyping && <TypingIndicator isDark={isDark} />}
            <div ref={messagesEndRef} />

            {/* Jump-to-bottom pill */}
            {showJumpToBottom && (
              <button
                data-testid="jump-to-bottom"
                onClick={jumpToBottom}
                className="sticky bottom-2 ml-auto mr-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium shadow-lg transition-all active:scale-95"
                style={{
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  float: 'right',
                  position: 'sticky',
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {unreadCount > 0 ? `${unreadCount} new` : 'Jump to latest'}
              </button>
            )}
          </div>

          {/* ===== Sticky Input bar (safe-area aware) ===== */}
          <div
            data-testid="message-input-bar"
            className="shrink-0 border-t"
            style={{
              borderColor: T.border,
              backgroundColor: T.bg,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: `calc(10px + env(safe-area-inset-bottom))`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-end gap-2">
              <button
                data-testid="chat-attach-btn"
                aria-label="Attach"
                onClick={() => {}}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95"
                style={{ backgroundColor: T.surface, color: T.muted }}
              >
                <Plus className="w-5 h-5" />
              </button>
              <div
                className="flex-1 flex items-end gap-2 rounded-2xl px-3 py-1.5"
                style={{ backgroundColor: T.input, border: `1px solid ${T.inputBorder}` }}
              >
                <textarea
                  ref={textareaRef}
                  data-testid="message-input"
                  rows={1}
                  placeholder="Message"
                  value={newMsg}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 resize-none bg-transparent outline-none text-[15px] py-1.5 leading-[1.4] max-h-[120px]"
                  style={{ color: T.inputText, fontFamily: 'inherit' }}
                />
                <button
                  data-testid="chat-emoji-btn"
                  aria-label="Emoji"
                  onClick={() => {}}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ color: T.muted }}
                >
                  <Smile className="w-4.5 h-4.5" />
                </button>
              </div>
              <button
                data-testid="send-message-btn"
                aria-label="Send message"
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95"
                style={{
                  background: newMsg.trim()
                    ? 'linear-gradient(135deg, #5B5BF0 0%, #7C3AED 100%)'
                    : T.surface,
                  color: newMsg.trim() ? '#FFFFFF' : T.muted,
                  boxShadow: newMsg.trim() ? '0 4px 12px rgba(124, 58, 237, 0.32)' : 'none',
                  opacity: !newMsg.trim() || sending ? 0.85 : 1,
                  cursor: !newMsg.trim() || sending ? 'not-allowed' : 'pointer',
                }}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Group create / add-member modal */}
        {groupModal && (
          <GroupModal
            mode={groupModal}
            conversationId={conversationId}
            existingMemberIds={new Set(groupMembers.map(m => m.id))}
            onClose={() => setGroupModal(null)}
            onCreated={(conv) => {
              setConvsRefreshKey(k => k + 1);
              navigate(`/messages/${conv.id}`);
            }}
            onAdded={() => setConvsRefreshKey(k => k + 1)}
          />
        )}
      </>
    );
  }

  // =====================================================================
  // RENDER: Messages list (no conversation selected) — light theme, app chrome visible
  // =====================================================================
  return (
    <div className="bg-white" data-testid="messages-page">
      {globalChatCss}
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      <main
        className="max-w-2xl mx-auto px-4 sm:px-6"
        style={{
          paddingTop: 16,
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
          minHeight: 'calc(100vh - 72px - 64px)',
          fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Title row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            data-testid="messages-back-btn"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-2 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight flex-1 font-bricolage">Messages</h1>
          <button
            data-testid="new-group-btn"
            onClick={() => setGroupModal('create')}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: '#F4F0FF',
              color: '#7C3AED',
              border: '1px solid #E9E0FF',
            }}
          >
            <Users className="w-4 h-4" />
            New group
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            data-testid="conversation-search"
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-2xl text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 transition-all"
            style={{
              backgroundColor: '#F7F8FA',
              border: '1px solid #E5E7EB',
            }}
          />
        </div>

        {/* Conversation list */}
        <div data-testid="conversation-list" className="space-y-1 mt-3">
          {(() => {
            if (loadingConvs) {
              return (
                <div className="flex items-center justify-center py-20" data-testid="conversations-loading">
                  <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                </div>
              );
            }
            if (convsError) {
              return (
                <div className="flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '40vh' }} data-testid="conversations-error">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                  <p className="text-red-600 text-sm font-semibold mb-2">{convsError}</p>
                  <button
                    data-testid="conversations-retry"
                    onClick={() => setConvsRefreshKey(k => k + 1)}
                    className="mt-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              );
            }
            if (filteredConversations.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '40vh' }} data-testid="conversations-empty">
                  <div className="w-16 h-16 rounded-full bg-[#F4F0FF] flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7 text-[#7C3AED]" />
                  </div>
                  <p className="text-slate-900 text-[15px] font-semibold mb-1">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-slate-500 text-[13px]">
                    {searchQuery ? 'Try a different name' : "Start one from someone's profile"}
                  </p>
                </div>
              );
            }
            return filteredConversations.map(conv => {
              const unread = conv.unread || 0;
              return (
                <button
                  key={conv.id}
                  data-testid={`conversation-item-${conv.id}`}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors hover:bg-slate-50 active:scale-[0.99] active:bg-slate-100"
                  style={{ minHeight: 72 }}
                >
                  <div className="relative shrink-0">
                    {conv.is_group ? (
                      <div
                        data-testid={`group-avatar-${conv.id}`}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#F4F0FF', border: '1px solid #E9E0FF' }}
                      >
                        <Users className="w-5 h-5" style={{ color: '#7C3AED' }} />
                      </div>
                    ) : (
                      <>
                        <UserAvatar
                          profilePicture={conv.other_user?.avatar}
                          name={conv.other_user?.name}
                          size="md"
                          clickable={false}
                        />
                        {conv.other_user?.online && (
                          <span
                            data-testid={`presence-dot-${conv.other_user.id}`}
                            aria-label="Online"
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500"
                            style={{ boxShadow: '0 0 0 2px #ffffff' }}
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[15px] truncate ${unread > 0 ? 'font-semibold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {conv.is_group ? (conv.name || 'Group') : (conv.other_user?.name || 'Unknown')}
                      </span>
                      <span className="text-[12px] text-slate-400 shrink-0 tabular-nums">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[13px] truncate ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {conv.is_group && (
                          <span className="text-slate-400">{conv.member_count} members · </span>
                        )}
                        {conv.last_message === user?.id && <span className="text-slate-400">You: </span>}
                        {conv.last_message_text || 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span
                          className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: '#7C3AED' }}
                        >
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </main>

      {/* Group create modal */}
      {groupModal && (
        <GroupModal
          mode={groupModal}
          conversationId={conversationId}
          existingMemberIds={new Set(groupMembers.map(m => m.id))}
          onClose={() => setGroupModal(null)}
          onCreated={(conv) => {
            setConvsRefreshKey(k => k + 1);
            navigate(`/messages/${conv.id}`);
          }}
          onAdded={() => setConvsRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
