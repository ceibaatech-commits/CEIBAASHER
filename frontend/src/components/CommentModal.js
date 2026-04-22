import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Send, X } from 'lucide-react';
import { timeAgo } from './FeedCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CommentModal({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => { fetchComments(); }, [postId]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get(`${BACKEND_URL}/api/recruitment/posts/${postId}/comments`, { headers });
      setComments(data.comments || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { toast.error('Please login to comment'); return; }
      const body = { text: text.trim() };
      if (replyTo) body.parent_id = replyTo.id;
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/posts/${postId}/comment`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), data], replies_count: (c.replies_count || 0) + 1 } : c));
      } else {
        setComments(prev => [{ ...data, replies: [] }, ...prev]);
      }
      setText(''); setReplyTo(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to post'); }
    finally { setPosting(false); }
  };

  const handleLikeComment = async (commentId) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login'); return; }
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/recruitment/comments/${commentId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const updateLike = (list) => list.map(c => {
        if (c.id === commentId) return { ...c, likes_count: data.likes_count, is_liked: data.liked };
        if (c.replies?.length) return { ...c, replies: updateLike(c.replies) };
        return c;
      });
      setComments(prev => updateLike(prev));
    } catch {}
  };

  const CommentItem = ({ c, isReply }) => (
    <div className={`flex gap-2.5 ${isReply ? 'ml-10' : ''}`} data-testid={`comment-${c.id}`}>
      <div className="w-7 h-7 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
        {c.user_avatar ? <img src={c.user_avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 text-[10px] font-bold">{(c.user_name || '?')[0]}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-800 text-xs font-semibold">{c.user_name}</span>
            <span className="text-slate-400 text-[10px]">{timeAgo(c.created_at)}</span>
          </div>
          <p className="text-slate-600 text-sm mt-0.5">{c.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-1">
          <button onClick={() => handleLikeComment(c.id)} className={`flex items-center gap-1 text-[11px] transition-colors ${c.is_liked ? 'text-rose-500 font-semibold' : 'text-slate-400 hover:text-rose-500'}`} data-testid={`like-comment-${c.id}`}>
            <Heart className={`w-3 h-3 ${c.is_liked ? 'fill-current' : ''}`} /> {c.likes_count || 0}
          </button>
          {!isReply && (
            <button onClick={() => setReplyTo({ id: c.id, user_name: c.user_name })} className="text-[11px] text-slate-400 hover:text-blue-500 font-medium" data-testid={`reply-btn-${c.id}`}>Reply</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()} data-testid="comment-modal">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Comments</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? <div className="text-center text-slate-400 py-8">Loading...</div> : comments.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No comments yet. Be the first!</div>
          ) : comments.map(c => (
            <div key={c.id} className="space-y-2">
              <CommentItem c={c} isReply={false} />
              {(c.replies || []).map(r => <CommentItem key={r.id} c={r} isReply={true} />)}
            </div>
          ))}
        </div>
        {replyTo && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
            <span className="text-xs text-blue-600">Replying to <strong>{replyTo.user_name}</strong></span>
            <button onClick={() => setReplyTo(null)} className="text-xs text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        <div className="p-4 border-t border-slate-200 flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()} placeholder={replyTo ? `Reply to ${replyTo.user_name}...` : 'Write a comment...'} data-testid="comment-input"
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handlePost} disabled={posting || !text.trim()} data-testid="comment-submit"
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
