import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, UserMinus, Clock, Loader2 } from 'lucide-react';

const BACKEND_URL = window.location.origin;

const FollowButton = ({ targetUserId, targetUsername, initialStatus = null, onFollowChange }) => {
  const [followStatus, setFollowStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (initialStatus === null) {
      fetchFollowStatus();
    }
  }, [targetUserId]);

  const fetchFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${BACKEND_URL}/api/profile/follow-status/${targetUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
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
      
      // Additional safeguard - prevent self-following
      const authToken = localStorage.getItem('auth_token') || token;
      if (authToken) {
        try {
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          const currentUserId = payload.sub;
          if (currentUserId === targetUserId) {
            alert("You cannot follow yourself");
            setLoading(false);
            return;
          }
        } catch (e) {
          // If token parsing fails, continue with the request
        }
      }
      
      const response = await axios.post(
        `${BACKEND_URL}/api/profile/follow`,
        { target_user_id: targetUserId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setFollowStatus(response.data.status);
        if (onFollowChange) {
          onFollowChange(response.data.status);
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : error.response?.data?.message || error.message || 'Failed to follow user. Please try again.';
      alert(errorMessage);
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setFollowStatus(null);
        if (onFollowChange) {
          onFollowChange(null);
        }
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : error.response?.data?.message || error.message || 'Failed to unfollow user. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (followStatus === 'approved') {
      setShowConfirm(true);
    } else if (followStatus === 'pending') {
      // Cancel request
      handleUnfollow();
    } else {
      // Follow
      handleFollow();
    }
  };

  // Button styling based on state
  const getButtonConfig = () => {
    if (showConfirm && followStatus === 'approved') {
      return {
        bg: 'bg-red-50 hover:bg-red-100',
        border: 'border border-red-300',
        text: 'text-red-600',
        icon: <UserMinus className="w-4 h-4" />,
        label: 'Unfollow'
      };
    }
    if (followStatus === 'approved') {
      return {
        bg: 'bg-indigo-50 hover:bg-red-50',
        border: 'border border-indigo-200 hover:border-red-300',
        text: 'text-indigo-600 hover:text-red-600',
        icon: <UserCheck className="w-4 h-4" />,
        label: 'Following'
      };
    }
    if (followStatus === 'pending') {
      return {
        bg: 'bg-amber-50 hover:bg-red-50',
        border: 'border border-amber-200 hover:border-red-300',
        text: 'text-amber-700 hover:text-red-600',
        icon: <Clock className="w-4 h-4" />,
        label: 'Requested'
      };
    }
    return {
      bg: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'border border-transparent',
      text: 'text-white',
      icon: <UserPlus className="w-4 h-4" />,
      label: 'Follow'
    };
  };

  const config = getButtonConfig();

  return (
    <div className="relative">
      <button
        onClick={handleButtonClick}
        disabled={loading}
        onMouseEnter={() => followStatus === 'approved' && setShowConfirm(true)}
        onMouseLeave={() => setShowConfirm(false)}
        data-testid="follow-button"
        className={`
          inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200
          ${config.bg} ${config.border} ${config.text}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : config.icon}
        <span>{loading ? '...' : config.label}</span>
      </button>

      {/* Unfollow confirmation dialog */}
      {showConfirm && followStatus === 'approved' && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 min-w-[220px]">
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
