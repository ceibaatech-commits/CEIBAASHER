import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Calendar, Award, Lock, FileText, Trophy } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PublicProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [posts, setPosts] = useState([]);
  const [quizRooms, setQuizRooms] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/profile/${username}`,
        {
          params: { current_user_id: user?.id }
        }
      );

      if (response.data.success) {
        setProfile(response.data.profile);
        setCanView(response.data.can_view !== false);
        setFollowStatus(response.data.follow_status);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        // Profile not found
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (newStatus) => {
    setFollowStatus(newStatus);
    // Refresh profile to update counts
    fetchProfile();
  };

  const handleFollowersClick = () => {
    if (canView) {
      setFollowModalType('followers');
      setShowFollowModal(true);
    }
  };

  const handleFollowingClick = () => {
    if (canView) {
      setFollowModalType('following');
      setShowFollowModal(true);
    }
  };

  const fetchUserContent = async (tab) => {
    if (!profile || !canView) return;
    
    setLoadingContent(true);
    try {
      if (tab === 'posts') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/profile/${username}/posts`,
          {
            params: { current_user_id: user?.id }
          }
        );
        if (response.data.success) {
          setPosts(response.data.posts || []);
        }
      } else if (tab === 'quizzes') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/profile/${username}/quiz-rooms`,
          {
            params: { current_user_id: user?.id }
          }
        );
        if (response.data.success) {
          setQuizRooms(response.data.quiz_rooms || []);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (profile && canView) {
      fetchUserContent(activeTab);
    }
  }, [activeTab, profile, canView]);

  // Redirect to dashboard if viewing own profile
  useEffect(() => {
    if (profile && user && profile.username === user.username) {
      navigate('/dashboard');
    }
  }, [profile, user]);

  if (loading) {
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">The profile @{username} doesn't exist.</p>
          <button
            onClick={() => navigate('/social-feed')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // Private account with no access
  if (profile.is_private && !canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Profile Picture */}
            <img
              src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
              alt={profile.name}
              className="w-32 h-32 rounded-full mx-auto border-4 border-gray-200 shadow-lg object-cover mb-4"
            />
            
            {/* User Info */}
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-500 text-lg mt-1">@{profile.username}</p>

            {/* Private Account Message */}
            <div className="mt-6 p-6 bg-gray-50 rounded-xl">
              <Lock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-xl font-semibold text-gray-700 mb-2">This Account is Private</p>
              <p className="text-gray-600">Follow this account to see their posts and quiz rooms</p>
            </div>

            {/* Stats (limited) */}
            <div className="mt-6 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profile.following_count || 0}</p>
                <p className="text-gray-600 text-sm">Following</p>
              </div>
            </div>

            {/* Follow Button */}
            {user && (
              <div className="mt-6 flex justify-center">
                <FollowButton
                  targetUserId={profile.user_id}
                  targetUsername={profile.username}
                  initialStatus={followStatus}
                  onFollowChange={handleFollowChange}
                />
              </div>
            )}

            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Login to Follow
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full public profile
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

            {/* Follow Button */}
            <div className="pt-20 flex justify-end">
              {user ? (
                <FollowButton
                  targetUserId={profile.user_id}
                  targetUsername={profile.username}
                  initialStatus={followStatus}
                  onFollowChange={handleFollowChange}
                />
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Login to Follow
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 text-lg">@{profile.username}</p>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-3 text-gray-700 text-lg">{profile.bio}</p>
              )}

              {/* Location & Joined Date */}
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
                className={`text-center hover:bg-gray-50 px-4 rounded-lg transition-colors ${!canView && 'cursor-not-allowed opacity-50'}`}
                disabled={!canView}
              >
                <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className={`text-center hover:bg-gray-50 px-4 rounded-lg transition-colors ${!canView && 'cursor-not-allowed opacity-50'}`}
                disabled={!canView}
              >
                <p className="text-2xl font-bold text-gray-900">{profile.following_count || 0}</p>
                <p className="text-gray-600 text-sm">Following</p>
              </button>
            </div>
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
                      {posts.map(post => (
                        <div key={post.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
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
                            <span>❤️ {post.likes_count || 0}</span>
                            <span>💬 {post.comments_count || 0}</span>
                            <span>🔄 {post.shares_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg">No posts yet</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {profile.name} hasn't shared anything yet
                      </p>
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
                      <p className="text-gray-500 text-sm mt-2">
                        {profile.name} hasn't created any quiz rooms yet
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        userId={profile.user_id}
        type={followModalType}
      />
    </div>
  );
};

export default PublicProfile;
