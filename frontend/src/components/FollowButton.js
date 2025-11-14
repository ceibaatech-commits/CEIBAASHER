import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
  const getButtonStyle = () => {
    if (followStatus === 'approved') {
      return {
        bg: 'bg-blue-50 hover:bg-red-50',
        border: 'border-2 border-blue-500 hover:border-red-500',
        text: 'text-blue-600 hover:text-red-600',
        hoverText: showConfirm ? 'Unfollow' : 'Following ✓'
      };
    } else if (followStatus === 'pending') {
      return {
        bg: 'bg-yellow-50 hover:bg-red-50',
        border: 'border-2 border-yellow-500 hover:border-red-500',
        text: 'text-yellow-700 hover:text-red-600',
        hoverText: 'Cancel Request'
      };
    } else {
      return {
        bg: 'bg-white hover:bg-gray-50',
        border: 'border-2 border-gray-300',
        text: 'text-gray-800',
        hoverText: 'Follow'
      };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <div className="relative">
      <button
        onClick={handleButtonClick}
        disabled={loading}
        onMouseEnter={() => followStatus === 'approved' && setShowConfirm(true)}
        onMouseLeave={() => setShowConfirm(false)}
        className={`
          px-6 py-2 rounded-lg font-semibold transition-all duration-200
          ${buttonStyle.bg} ${buttonStyle.border} ${buttonStyle.text}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          min-w-[120px]
        `}
      >
        {loading ? 'Loading...' : buttonStyle.hoverText}
      </button>

      {/* Unfollow confirmation dialog */}
      {showConfirm && followStatus === 'approved' && (
        <div className="absolute top-full mt-2 left-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-[250px]">
          <p className="text-sm text-gray-700 mb-3">
            Unfollow @{targetUsername}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUnfollow}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
            >
              Unfollow
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
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
