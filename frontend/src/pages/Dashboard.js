import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Settings, Edit, Users, FileText, Heart, Trophy, Calendar, MapPin, Award, ArrowLeft, MessageCircle, Repeat2 } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import FollowListModal from '../components/FollowListModal';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import CoverPhotoUpload from '../components/CoverPhotoUpload';

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
  const [posts, setPosts] = useState([]);
  const [quizRooms, setQuizRooms] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

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
        `${BACKEND_URL}/api/profile/id/${user.id}`,
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

  const fetchUserContent = async (tab) => {
    if (!profile) return;
    
    setLoadingContent(true);
    try {
      if (tab === 'posts') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${profile.username}/posts`,
          {
            params: { current_user_id: user.id }
          }
        );
        if (response.data.success) {
          setPosts(response.data.posts || []);
        }
      } else if (tab === 'quizzes') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${profile.username}/quiz-rooms`,
          {
            params: { current_user_id: user.id }
          }
        );
        if (response.data.success) {
          setQuizRooms(response.data.quiz_rooms || []);
        }
      } else if (tab === 'liked') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${profile.username}/liked-posts`,
          {
            params: { current_user_id: user.id }
          }
        );
        if (response.data.success) {
          setLikedPosts(response.data.posts || []);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchUserContent(activeTab);
    }
  }, [activeTab, profile]);

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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-purple-600 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Cover Photo & Profile Picture */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Photo with Upload */}
          <div className="relative">
            <CoverPhotoUpload
              currentCover={profile.cover_photo}
              onUploadComplete={(newUrl) => {
                setProfile(prev => ({ ...prev, cover_photo: newUrl }));
              }}
            />
            
            {/* Settings Button */}
            <button
              onClick={() => navigate('/settings/privacy')}
              className="absolute top-4 right-4 p-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-lg z-10"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture with Quick Upload */}
            <div className="absolute -top-16 left-6">
              <ProfilePictureUpload
                currentPicture={profile.profile_picture}
                onUploadComplete={(newUrl) => {
                  setProfile(prev => ({ ...prev, profile_picture: newUrl }));
                }}
                size="large"
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
            {loadingContent ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'posts' && (
                  posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map(post => (
                        <div key={post.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {post.post_type && (
                                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {post.post_type === 'quiz_room' ? 'Quiz Room' : post.post_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-800">{post.content}</p>
                          {post.room_code && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-700 font-semibold">Room Code: {post.room_code}</p>
                            </div>
                          )}
                          <div className="mt-3 flex gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" /> {post.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" /> {post.comments_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Repeat2 className="w-4 h-4" /> {post.shares_count || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg">No posts yet</p>
                      <p className="text-gray-500 text-sm mt-2">Share your quiz results and achievements!</p>
                    </div>
                  )
                )}
                {activeTab === 'liked' && (
                  likedPosts.length > 0 ? (
                    <div className="space-y-4">
                      {likedPosts.map(post => (
                        <div key={post.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {post.user_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{post.user_name}</p>
                              <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="text-gray-800">{post.content}</p>
                          <div className="mt-3 flex gap-4 text-sm text-gray-600">
                            <span>❤️ {post.likes_count || 0}</span>
                            <span>💬 {post.comments_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg">No liked posts yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start exploring and like posts from others!</p>
                    </div>
                  )
                )}
                {activeTab === 'quizzes' && (
                  quizRooms.length > 0 ? (
                    <div className="space-y-4">
                      {quizRooms.map(room => (
                        <div key={room.room_code} className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">{room.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                            </div>
                            <div className="ml-4">
                              <div className="px-4 py-2 bg-green-500 text-white rounded-lg text-center">
                                <div className="text-xs font-semibold">ROOM CODE</div>
                                <div className="text-xl font-bold">{room.room_code}</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 font-semibold">
                              📝 {room.question_count} Questions
                            </span>
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 font-semibold">
                              🏷️ {room.category}
                            </span>
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 font-semibold">
                              {room.privacy === 'public' ? '🌐 Public' : room.privacy === 'followers_only' ? '👥 Followers' : '🔒 Private'}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/quiz-room/${room.room_code}`)}
                            className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                          >
                            View Quiz
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg">No quiz rooms yet</p>
                      <p className="text-gray-500 text-sm mt-2">Create or join quiz rooms to get started!</p>
                    </div>
                  )
                )}
              </>
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
