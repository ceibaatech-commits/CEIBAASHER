import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';

const BACKEND_URL = window.location.origin;

const FollowButton = ({ targetUserId, targetUsername, initialStatus = null, onFollowChange }) => {
  const [followStatus, setFollowStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef(null);
  const justFollowed = useRef(false);

  useEffect(() => {
    if (initialStatus === null) fetchFollowStatus();
  }, [targetUserId]);

  useEffect(() => {
    if (!showConfirm) return;
    const close = (e) => { if (confirmRef.current && !confirmRef.current.contains(e.target)) setShowConfirm(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [showConfirm]);

  const fetchFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${BACKEND_URL}/api/profile/follow-status/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      if (res.data.success) setFollowStatus(res.data.status);
    } catch {}
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BACKEND_URL}/api/profile/follow`, { target_user_id: targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      if (res.data.success || res.data.status) {
        setFollowStatus(res.data.status);
        justFollowed.current = true;
        setTimeout(() => { justFollowed.current = false; }, 1000);
        onFollowChange?.(res.data.status);
      }
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Failed to follow.';
      alert(msg);
    } finally { setLoading(false); }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${BACKEND_URL}/api/profile/unfollow/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      if (res.data.success) { setFollowStatus(null); onFollowChange?.(null); }
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Failed to unfollow.';
      alert(msg);
    } finally { setLoading(false); }
  };

  const handleClick = () => {
    if (loading) return;
    if (followStatus === 'approved') {
      if (justFollowed.current) return;
      setShowConfirm(prev => !prev);
    } else if (followStatus === 'pending') {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  // Icon-based states
  const isFollowing = followStatus === 'approved';
  const isPending = followStatus === 'pending';
  const isDefault = !isFollowing && !isPending;

  return (
    <div className="relative" ref={confirmRef}>
      <button
        onClick={handleClick}
        disabled={loading}
        data-testid="follow-button"
        title={isFollowing ? 'Following' : isPending ? 'Requested' : 'Follow'}
        className={`
          inline-flex items-center justify-center rounded-full transition-all duration-200 active:scale-90
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isDefault
            ? 'w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
            : isFollowing
              ? 'gap-1.5 px-4 h-9 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 group'
              : 'gap-1.5 px-4 h-9 bg-amber-50 border border-amber-200 text-amber-600'
          }
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isDefault ? (
          <UserPlus className="w-5 h-5" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-4 h-4 group-hover:hidden" />
            <span className="text-xs font-semibold group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline text-xs font-semibold">Unfollow</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Requested</span>
          </>
        )}
      </button>

      {/* Unfollow confirmation */}
      {showConfirm && isFollowing && (
        <div className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 min-w-[200px]">
          <p className="text-sm text-gray-700 mb-3">
            Unfollow <span className="font-semibold">@{targetUsername}</span>?
          </p>
          <div className="flex gap-2">
            <button onClick={handleUnfollow} data-testid="confirm-unfollow-btn"
              className="flex-1 h-9 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold">Unfollow</button>
            <button onClick={() => setShowConfirm(false)}
              className="flex-1 h-9 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowButton;
