import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Lock, Unlock, Users, Check, X, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PrivacySettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchSettings();
      fetchFollowRequests();
    }
  }, [user, authLoading]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/profile/id/${user.id}`,
        {
          params: { current_user_id: user.id }
        }
      );

      if (response.data.success) {
        setIsPrivate(response.data.profile.is_private || false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/follow-requests`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setFollowRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    }
  };

  const togglePrivacy = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BACKEND_URL}/api/profile/privacy`,
        null,
        {
          params: { is_private: !isPrivate },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setIsPrivate(!isPrivate);
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      alert('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/profile/follow-request/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Remove from list
        setFollowRequests(prev => prev.filter(req => req.request_id !== requestId));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${BACKEND_URL}/api/profile/follow-request/${requestId}/decline`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Remove from list
        setFollowRequests(prev => prev.filter(req => req.request_id !== requestId));
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request');
    }
  };

  const approveAll = async () => {
    for (const request of followRequests) {
      await handleApprove(request.request_id);
    }
  };

  const declineAll = async () => {
    if (window.confirm(`Decline all ${followRequests.length} follow requests?`)) {
      for (const request of followRequests) {
        await handleDecline(request.request_id);
      }
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Security</h1>
          <p className="text-gray-600 mt-2">Manage who can see your content and follow you</p>
        </div>

        {/* Account Privacy */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            {isPrivate ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            Account Privacy
          </h2>

          <div className="space-y-4">
            {/* Public Option */}
            <div
              onClick={() => !saving && isPrivate && togglePrivacy()}
              className={`
                p-4 border-2 rounded-xl cursor-pointer transition-all
                ${!isPrivate
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1
                  ${!isPrivate ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}
                `}>
                  {!isPrivate && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Public Account</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Anyone can see your profile, posts, and quiz rooms. Anyone can follow you without requesting.
                  </p>
                </div>
              </div>
            </div>

            {/* Private Option */}
            <div
              onClick={() => !saving && !isPrivate && togglePrivacy()}
              className={`
                p-4 border-2 rounded-xl cursor-pointer transition-all
                ${isPrivate
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1
                  ${isPrivate ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}
                `}>
                  {isPrivate && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Private Account</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Only followers you approve can see your posts and quiz rooms. Follow requests must be approved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {saving && (
            <div className="mt-4 text-center text-gray-600">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2">Updating privacy settings...</span>
            </div>
          )}
        </div>

        {/* Follow Requests (only shown for private accounts) */}
        {isPrivate && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Follow Requests
                {followRequests.length > 0 && (
                  <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                    {followRequests.length}
                  </span>
                )}
              </h2>
              {followRequests.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={approveAll}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={declineAll}
                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                  >
                    Decline All
                  </button>
                </div>
              )}
            </div>

            {followRequests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No pending follow requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <img
                      src={request.profile_picture || `https://ui-avatars.com/api/?name=${request.name}&background=random`}
                      alt={request.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{request.name}</p>
                      <p className="text-sm text-gray-500">@{request.username}</p>
                      {request.bio && (
                        <p className="text-sm text-gray-600 truncate mt-1">{request.bio}</p>
                      )}
                      {request.mutual_followers > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {request.mutual_followers} mutual follower{request.mutual_followers !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.request_id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(request.request_id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Status (Future Feature) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Show Activity Status</p>
                <p className="text-sm text-gray-600">Let others see when you're online</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-purple-600 rounded-full transition-colors cursor-pointer"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Blocked Users (Future Feature) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Blocked Accounts</h2>
              <p className="text-sm text-gray-600 mt-1">Manage users you've blocked</p>
            </div>
            <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
              <span>Manage</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
