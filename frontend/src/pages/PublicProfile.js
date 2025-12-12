import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Calendar, Award, Lock, FileText, Trophy, ArrowLeft, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';
import Header from '../components/Header';
import MathText from '../components/MathText';

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
        `${BACKEND_URL}/api/profile/${username}`,
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
      if (tab === 'posts' || tab === 'reposts') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${username}/posts`,
          {
            params: { current_user_id: user?.id }
          }
        );
        if (response.data.success) {
          setPosts(response.data.posts || []);
        }
      } else if (tab === 'quizzes') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${username}/quiz-rooms`,
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

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === 'posts') {
      // Show only original posts (not reposts and not quiz rooms)
      // Quiz rooms should appear in Quiz Rooms tab, not Posts tab
      return posts.filter(post => !post.is_retweet && post.post_type !== 'quiz_room');
    } else if (activeTab === 'reposts') {
      // Show only reposts
      return posts.filter(post => post.is_retweet === true);
    }
    return [];
  };

  const handleProfileClick = (clickedUsername) => {
    if (clickedUsername === username) {
      // Already on this profile
      return;
    }
    navigate(`/profile/${clickedUsername}`);
  };

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
          <p className="text-gray-600 mb-6">The profile @{username} doesn&apos;t exist.</p>
          <button
            onClick={() => navigate('/victory-lane')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const logout = () => {
    navigate('/login');
  };

  // Private account with no access
  if (profile.is_private && !canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Header isLoggedIn={!!user} user={user} onLogout={logout} />
        <div className="max-w-2xl mx-auto py-12 px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 text-gray-700 hover:text-purple-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

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

            {/* Follow Button - only show for other users' profiles */}
            {user && user.id !== profile.id && (
              <div className="mt-6 flex justify-center">
                <FollowButton
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                  initialStatus={followStatus}
                  onFollowChange={handleFollowChange}
                />
              </div>
            )}

            {/* Edit Profile Button - only show for own profile */}
            {user && user.id === profile.id && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-lg"
                >
                  Go to Dashboard
                </button>
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

  const filteredPosts = getFilteredPosts();

  // Full public profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/victory-lane')}
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-purple-600 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

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
            {/* Follow/Edit Button - positioned at top right */}
            <div className="pt-4 flex justify-end">
              {user && user.id !== profile.id ? (
                <FollowButton
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                  initialStatus={followStatus}
                  onFollowChange={handleFollowChange}
                />
              ) : user && user.id === profile.id ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Login to Follow
                </button>
              )}
            </div>

            {/* Avatar and User Info - Horizontal Layout */}
            <div className="flex items-start gap-4 mt-4">
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                <img
                  src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover"
                />
                {profile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 mt-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-500">@{profile.username}</p>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-3 text-gray-700">{profile.bio}</p>
                )}

                {/* Location & Joined Date */}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
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
                {(profile.badges?.isTeacher || profile.badges?.isProfessor || profile.badges?.isOfficial || profile.badges?.isInstitute ||
                  profile.isTeacher || profile.isProfessor || profile.isOfficial || profile.isInstitute) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile.badges?.isTeacher || profile.isTeacher) && (
                      <span 
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        title="Teacher Badge - Educator verified by administration"
                      >
                        <Trophy className="w-4 h-4 mr-1.5" />
                        Teacher
                      </span>
                    )}
                    {(profile.badges?.isProfessor || profile.isProfessor) && (
                      <span 
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        title="Professor Badge - Academic professor verified by administration"
                      >
                        <Trophy className="w-4 h-4 mr-1.5" />
                        Professor
                      </span>
                    )}
                    {(profile.badges?.isOfficial || profile.isOfficial) && (
                      <span 
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-600 text-white border-2 border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        title="Official Badge - Verified organization or official entity"
                      >
                        <Award className="w-4 h-4 mr-1.5 fill-white" />
                        Official
                      </span>
                    )}
                    {(profile.badges?.isInstitute || profile.isInstitute) && (
                      <span 
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold text-white border-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        style={{backgroundColor: '#8B2E2E', borderColor: '#6B1E1E'}}
                        title="Institute Badge - Verified educational institution"
                      >
                        <Trophy className="w-4 h-4 mr-1.5" />
                        Institute
                      </span>
                    )}
                  </div>
                )}
              </div>
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
            <button
              onClick={() => setActiveTab('reposts')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'reposts'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Repeat2 className="w-5 h-5" />
                Reposts
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
                {(activeTab === 'posts' || activeTab === 'reposts') && (
                  filteredPosts.length > 0 ? (
                    <div className="space-y-4">
                      {filteredPosts
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map(post => (
                        <div key={post.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          {/* Repost Indicator */}
                          {post.is_retweet === true && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                              <Repeat2 className="w-4 h-4" />
                              <span>{profile.name} reposted</span>
                            </div>
                          )}
                          
                          {/* Original Author Info (for reposts) */}
                          {post.is_retweet && post.original_username && (
                            <div className="mb-3 flex items-start gap-3">
                              <img
                                src={`https://ui-avatars.com/api/?name=${post.original_user_name || post.original_username}&background=random&size=40`}
                                alt={post.original_user_name}
                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80"
                                onClick={() => handleProfileClick(post.original_username)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-semibold text-gray-900 hover:underline cursor-pointer"
                                    onClick={() => handleProfileClick(post.original_username)}
                                  >
                                    {post.original_user_name || post.original_username}
                                  </span>
                                  <span 
                                    className="text-gray-500 text-sm hover:underline cursor-pointer"
                                    onClick={() => handleProfileClick(post.original_username)}
                                  >
                                    @{post.original_username}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(post.original_created_at || post.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Post Content */}
                          {!post.is_retweet && (
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
                          )}
                          
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
                      {activeTab === 'posts' ? (
                        <>
                          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600 text-lg">No posts yet</p>
                          <p className="text-gray-500 text-sm mt-2">
                            {profile.name} hasn&apos;t shared anything yet
                          </p>
                        </>
                      ) : (
                        <>
                          <Repeat2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600 text-lg">No reposts yet</p>
                          <p className="text-gray-500 text-sm mt-2">
                            {profile.name} hasn&apos;t reposted anything yet
                          </p>
                        </>
                      )}
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
                        {profile.name} hasn&apos;t created any quiz rooms yet
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
        userId={profile.id}
        type={followModalType}
      />
    </div>
  );
};

export default PublicProfile;