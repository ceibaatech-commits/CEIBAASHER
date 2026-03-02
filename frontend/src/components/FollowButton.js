import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, UserMinus, Clock, Loader2 } from 'lucide-react';

const BACKEND_URL = window.location.origin;

const FollowButton = ({ targetUserId, targetUsername, initialStatus = null, onFollowChange }) => {
  const [followStatus, setFollowStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef(null);
  const justFollowed = useRef(false);

  useEffect(() => {
    if (initialStatus === null) {
      fetchFollowStatus();
    }
  }, [targetUserId]);

  // Close confirm popup on outside click
  useEffect(() => {
    if (!showConfirm) return;
    const handleClickOutside = (e) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showConfirm]);

  const fetchFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/follow-status/${targetUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setFollowStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/profile/follow`,
        { target_user_id: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setFollowStatus(response.data.status);
        justFollowed.current = true;
        // Reset justFollowed after 1s to allow unfollow on next tap
        setTimeout(() => { justFollowed.current = false; }, 1000);
        if (onFollowChange) onFollowChange(response.data.status);
      }
    } catch (error) {
      console.error('Error following user:', error);
      const msg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.response?.data?.message || 'Failed to follow. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${BACKEND_URL}/api/profile/unfollow/${targetUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setFollowStatus(null);
        if (onFollowChange) onFollowChange(null);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      const msg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.response?.data?.message || 'Failed to unfollow. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (loading) return;
    if (followStatus === 'approved') {
      // If just followed, don't immediately show unfollow confirm
      if (justFollowed.current) return;
      setShowConfirm(prev => !prev);
    } else if (followStatus === 'pending') {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  // Determine button appearance
  let bg, border, text, icon, label;

  if (followStatus === 'approved') {
    bg = 'bg-indigo-50';
    border = 'border border-indigo-200';
    text = 'text-indigo-600';
    icon = <UserCheck className="w-4 h-4" />;
    label = 'Following';
  } else if (followStatus === 'pending') {
    bg = 'bg-amber-50';
    border = 'border border-amber-200';
    text = 'text-amber-700';
    icon = <Clock className="w-4 h-4" />;
    label = 'Requested';
  } else {
    bg = 'bg-indigo-600 hover:bg-indigo-700';
    border = 'border border-transparent';
    text = 'text-white';
    icon = <UserPlus className="w-4 h-4" />;
    label = 'Follow';
  }

  return (
    <div className="relative" ref={confirmRef}>
      <button
        onClick={handleButtonClick}
        disabled={loading}
        data-testid="follow-button"
        className={`
          inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200
          ${bg} ${border} ${text}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        <span>{loading ? '...' : label}</span>
      </button>

      {/* Unfollow confirmation popup */}
      {showConfirm && followStatus === 'approved' && (
        <div className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 min-w-[220px]">
          <p className="text-sm text-gray-700 mb-3">
            Unfollow <span className="font-semibold">@{targetUsername}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUnfollow}
              data-testid="confirm-unfollow-btn"
              className="flex-1 h-9 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold transition-colors"
            >
              Unfollow
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 h-9 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowButton;
