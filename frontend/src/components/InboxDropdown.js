import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import axios from 'axios';
import UserAvatar from './UserAvatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const InboxDropdown = ({ user }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch unread count periodically
  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      axios.get(`${BACKEND_URL}/api/messages/unread-count`)
        .then(res => { if (res.data.success) setUnreadTotal(res.data.unread_count || 0); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line
  }, [user]);

  // Fetch conversations when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axios.get(`${BACKEND_URL}/api/messages/conversations`)
      .then(res => { if (res.data.success) setConversations(res.data.conversations); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line
  }, [open]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        data-testid="inbox-dropdown-btn"
        onClick={() => setOpen(!open)}
         className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-[10px] font-bold text-white px-1">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="inbox-dropdown"
          className="fixed right-16 top-14 w-80 bg-gray-950 rounded-xl border border-gray-800 shadow-2xl shadow-black/60 overflow-hidden animate-fade-in"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
            <h3 className="text-sm font-bold text-white tracking-tight">Messages</h3>
            <button
              data-testid="inbox-view-all"
              onClick={() => { setOpen(false); navigate('/messages'); }}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-gray-500 text-xs">No conversations yet</p>
              </div>
            ) : (
              conversations.slice(0, 6).map(conv => {
                const unread = conv.unread || 0;
                return (
                  <button
                    key={conv.id}
                    data-testid={`inbox-conv-${conv.id}`}
                    onClick={() => { setOpen(false); navigate(`/messages/${conv.id}`); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-900/60 transition-colors border-b border-gray-800/20"
                  >
                    <div className="shrink-0">
                      <UserAvatar profilePicture={conv.other_user?.avatar} name={conv.other_user?.name} size="sm" clickable={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-white' : 'text-gray-400'}`}>
                          {conv.other_user?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-600 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <p className={`text-xs truncate ${unread > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                        {conv.last_message === user?.id && <span className="text-gray-500">You: </span>}
                        {conv.last_message_text || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxDropdown;
