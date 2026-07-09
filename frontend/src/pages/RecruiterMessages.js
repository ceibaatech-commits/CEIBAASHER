import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, MessageSquare, ChevronLeft, Loader } from 'lucide-react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function RecruiterMessages() {
  const navigate = useNavigate();
  const [recruiter, setRecruiter] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auth check
  useEffect(() => {
    if (!localStorage.getItem('recruiter_data')) {
      navigate('/recruiter');
      return;
    }
    fetchRecruiter();
  }, []);

  const fetchRecruiter = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/recruiter/me`);
      setRecruiter(data);
      fetchConversations(data.id);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('recruiter_data');
        navigate('/recruiter');
      } else {
        toast.error('Failed to load recruiter data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (recruiterId) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/messages/conversations`);
      // Filter conversations where recruiter is a participant
      const recruiterConvs = (data.conversations || []).filter(c =>
        c.participants && c.participants.includes(recruiterId)
      );
      setConversations(recruiterConvs.sort((a, b) =>
        new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
      ));
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/messages/conversations/${conversationId}/messages`
      );
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const tempMessage = {
      id: Date.now(),
      text: messageText,
      sender_id: recruiter.id,
      timestamp: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    setSending(true);

    try {
      await axios.post(
        `${BACKEND_URL}/api/messages/conversations/${selectedConversation.id}/messages`,
        { text: messageText }
      );
      setSending(false);
    } catch (err) {
      toast.error('Failed to send message');
      setSending(false);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageText(messageText);
    }
  };

  const getOtherUser = (conv) => {
    if (!conv.participants || !recruiter) return null;
    const otherId = conv.participants.find(p => p !== recruiter.id);
    return otherId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Conversations list */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <p className="text-xs text-slate-500 mt-1">{conversations.length} conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 border-b border-blue-200' : ''
                }`}
              >
                <p className="font-semibold text-slate-900 text-sm truncate">
                  User ID: {getOtherUser(conv)?.slice(0, 8)}...
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {conv.last_message_text || 'No messages'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message view */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-1 hover:bg-slate-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">
                  User ID: {getOtherUser(selectedConversation)?.slice(0, 8)}...
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p className="text-sm">No messages in this conversation</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === recruiter.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === recruiter.id
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === recruiter.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
