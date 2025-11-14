import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Settings, Edit, Users, FileText, Heart, Trophy, Calendar, MapPin, Award } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import FollowListModal from '../components/FollowListModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/profile/id/${user.id}`,
        {
          params: { current_user_id: user.id }
        }
      );

      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowersClick = () => {
    setFollowModalType('followers');
    setShowFollowModal(true);
  };

  const handleFollowingClick = () => {
    setFollowModalType('following');
    setShowFollowModal(true);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Failed to load profile</p>
          <button
            onClick={fetchProfile}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Cover Photo & Profile Picture */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600">
            {profile.cover_photo && (
              <img
                src={profile.cover_photo}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Settings Button */}
            <button
              onClick={() => navigate('/settings/privacy')}
              className="absolute top-4 right-4 p-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-6">
              <img
                src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
              />
            </div>

            {/* Edit Profile Button */}
            <div className="pt-20 flex justify-end">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            {/* User Info */}
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 text-lg">@{profile.username}</p>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-3 text-gray-700 text-lg">{profile.bio}</p>
              )}

              {/* Location & Exam Focus */}
              <div className="mt-3 flex flex-wrap gap-4 text-gray-600">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.joined_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Exam Focus Tags */}
              {profile.exam_focus && profile.exam_focus.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.exam_focus.map(exam => (
                    <span
                      key={exam}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                    >
                      🎯 {exam}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.badges.map(badge => (
                    <span
                      key={badge}
                      className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold"
                    >
                      <Award className="w-4 h-4" />
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="mt-6 flex gap-8 border-t border-gray-200 pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profile.posts_count || 0}</p>
                <p className="text-gray-600 text-sm">Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className="text-center hover:bg-gray-50 px-4 rounded-lg transition-colors"
              >
                <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className="text-center hover:bg-gray-50 px-4 rounded-lg transition-colors"
              >
                <p className="text-2xl font-bold text-gray-900">{profile.following_count || 0}</p>
                <p className="text-gray-600 text-sm">Following</p>
              </button>
              {profile.streak_days > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">🔥 {profile.streak_days}</p>
                  <p className="text-gray-600 text-sm">Day Streak</p>
                </div>
              )}
            </div>

            {/* Privacy Indicator */}
            {profile.is_private && (
              <div className="mt-4 flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-sm">🔒 Private Account</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'posts'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Posts
              </div>
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'liked'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Liked
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                Quiz Rooms
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            {activeTab === 'posts' && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No posts yet</p>
                <p className="text-gray-500 text-sm mt-2">Share your quiz results and achievements!</p>
              </div>
            )}
            {activeTab === 'liked' && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No liked posts yet</p>
                <p className="text-gray-500 text-sm mt-2">Start exploring and like posts from others!</p>
              </div>
            )}
            {activeTab === 'quizzes' && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No quiz rooms yet</p>
                <p className="text-gray-500 text-sm mt-2">Create or join quiz rooms to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentProfile={profile}
        onProfileUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
          fetchProfile();
        }}
      />

      <FollowListModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        userId={profile.user_id}
        type={followModalType}
      />
    </div>
  );
};

export default Dashboard;
