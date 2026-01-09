import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Calendar, Award, Lock, FileText, Trophy, ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';
import Header from '../components/Header';
import MathText from '../components/MathText';
import { toast } from 'sonner';

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
  
  // Interaction states
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [sharedPosts, setSharedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());

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

        {/* Profile Card - No Banner */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Info Section */}
          <div className="px-6 py-6">
            {/* Avatar, User Info & Follow Button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <img
                    src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                    alt={profile.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-100 shadow-lg object-cover"
                  />
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-500">@{profile.username}</p>
                </div>
              </div>

              {/* Follow/Edit Button */}
              <div className="flex-shrink-0">
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
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold shadow-lg text-sm"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold text-sm"
                  >
                    Login to Follow
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-gray-700">{profile.bio}</p>
            )}

            {/* Location & Joined Date */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
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
              <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.badges?.isTeacher || profile.isTeacher) && (
                  <span 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm"
                    title="Teacher Badge"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Teacher
                  </span>
                )}
                {(profile.badges?.isProfessor || profile.isProfessor) && (
                  <span 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm"
                    title="Professor Badge"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Professor
                  </span>
                )}
                {(profile.badges?.isOfficial || profile.isOfficial) && (
                  <span 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-600 text-white border-2 border-gray-700 shadow-sm"
                    title="Official Badge"
                  >
                    <Award className="w-4 h-4 mr-1.5 fill-white" />
                    Official
                  </span>
                )}
                {(profile.badges?.isInstitute || profile.isInstitute) && (
                  <span 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold text-white border-2 shadow-sm"
                    style={{backgroundColor: '#8B2E2E', borderColor: '#6B1E1E'}}
                    title="Institute Badge"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Institute
                  </span>
                )}
              </div>
            )}

            {/* Stats Row - Properly Aligned */}
            <div className="mt-6 flex items-center justify-start gap-8 border-t border-gray-200 pt-6">
              <div className="flex flex-col items-center">
                <p className="text-2xl font-bold text-gray-900">{profile.posts_count || 0}</p>
                <p className="text-gray-600 text-sm">Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className={`flex flex-col items-center hover:opacity-70 transition-opacity ${!canView && 'cursor-not-allowed opacity-50'}`}
                disabled={!canView}
              >
                <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className={`flex flex-col items-center hover:opacity-70 transition-opacity ${!canView && 'cursor-not-allowed opacity-50'}`}
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
                        <div key={post.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                          {/* Repost Indicator */}
                          {post.is_retweet === true && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 px-4 pt-3 pb-1">
                              <Repeat2 className="w-3.5 h-3.5" />
                              <span className="font-medium">{profile.name} reposted</span>
                            </div>
                          )}
                          
                          {/* Comment Indicator */}
                          {post.is_comment && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 px-4 pt-3 pb-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">{profile.name} commented</span>
                            </div>
                          )}

                          <div className="px-4 py-4">
                            {/* Modern Header Row - Avatar, User Info, Date, Tags all inline */}
                            <div className="flex items-start gap-3 mb-3">
                              {/* Avatar */}
                              <div 
                                className="cursor-pointer flex-shrink-0"
                                onClick={() => post.is_retweet && post.original_username 
                                  ? handleProfileClick(post.original_username)
                                  : null
                                }
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
                                  <img
                                    src={post.is_retweet 
                                      ? `https://ui-avatars.com/api/?name=${post.original_user_name || post.original_username}&background=random&size=40`
                                      : profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=40`
                                    }
                                    alt={post.is_retweet ? post.original_user_name : profile.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              {/* Main Content Area */}
                              <div className="flex-1 min-w-0">
                                {/* Top Row: Username, timestamp, post type - All inline */}
                                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
                                  {/* Username */}
                                  <span 
                                    className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer text-[15px] transition-colors"
                                    onClick={() => post.is_retweet && post.original_username 
                                      ? handleProfileClick(post.original_username)
                                      : null
                                    }
                                  >
                                    {post.is_retweet 
                                      ? (post.original_user_name || post.original_username || 'Anonymous')
                                      : profile.name
                                    }
                                  </span>
                                  
                                  {/* Verified Badge */}
                                  {(post.is_retweet ? false : profile.is_verified) && (
                                    <span className="w-4 h-4 text-blue-500">✓</span>
                                  )}
                                  
                                  {/* Role Badges */}
                                  {profile.badges?.isTeacher && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white">
                                      Teacher
                                    </span>
                                  )}
                                  {profile.badges?.isProfessor && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-600 text-white">
                                      Professor
                                    </span>
                                  )}
                                  
                                  {/* Separator dot */}
                                  <span className="text-gray-300 text-xs">·</span>
                                  
                                  {/* Timestamp */}
                                  <span className="text-gray-400 text-xs">
                                    {new Date(post.is_retweet ? (post.original_created_at || post.created_at) : post.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  
                                  {/* Post Type Tag */}
                                  {post.post_type && post.post_type !== 'general' && (
                                    <>
                                      <span className="text-gray-300 text-xs">·</span>
                                      <span className="text-purple-500 text-xs font-medium">
                                        {post.post_type === 'quiz_room' ? 'Quiz' : post.post_type}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Comment Content with Original Post Preview */}
                            {post.is_comment && (
                              <div className="pl-[52px] mb-3">
                                <div className="text-gray-900 mb-3">
                                  <MathText text={post.comment_content || post.content} />
                                </div>
                                
                                {/* Original Post Preview */}
                                {post.original_post && (
                                  <div className="pl-3 border-l-2 border-blue-200 bg-blue-50/50 p-3 rounded-r-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <img
                                        src={post.original_post.user_avatar || `https://ui-avatars.com/api/?name=${post.original_post.user_name}&background=random&size=24`}
                                        alt={post.original_post.user_name}
                                        className="w-5 h-5 rounded-full"
                                      />
                                      <span className="text-sm font-medium text-gray-700">
                                        {post.original_post.user_name}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        @{post.original_post.username}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2">
                                      <MathText text={post.original_post.content} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Post Content (for regular posts and reposts) */}
                            {!post.is_comment && (
                              <div className="text-gray-800 text-[15px] leading-relaxed pl-[52px]">
                                <MathText text={post.content} />
                              </div>
                            )}
                            
                            {/* Room Code */}
                            {post.room_code && (
                              <div className="mt-3 ml-[52px] p-2 bg-green-50 border border-green-200 rounded-lg inline-block">
                                <p className="text-xs text-green-700 font-medium">Room: {post.room_code}</p>
                              </div>
                            )}
                            
                            {/* Modern Interaction Bar - Click to view post on Victory Lane */}
                            <div className="flex items-center pl-[52px] pt-2 mt-1 -ml-2">
                              <button 
                                onClick={() => navigate(`/victory-lane?post=${post.id}`)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <div className="p-1 rounded-full bg-rose-50/50 group-hover:bg-rose-100 transition-colors">
                                  <Heart className="w-[16px] h-[16px] text-rose-400 group-hover:text-rose-500 transition-colors" />
                                </div>
                                <span className="text-sm tabular-nums">{post.likes_count || 0}</span>
                              </button>
                              <button 
                                onClick={() => navigate(`/victory-lane?post=${post.id}`)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <div className="p-1 rounded-full bg-blue-50/50 group-hover:bg-blue-100 transition-colors">
                                  <MessageCircle className="w-[16px] h-[16px] text-blue-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <span className="text-sm tabular-nums">{post.comments_count || 0}</span>
                              </button>
                              <button 
                                onClick={() => navigate(`/victory-lane?post=${post.id}`)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 hover:text-emerald-500 transition-colors"
                              >
                                <div className="p-1 rounded-full bg-emerald-50/50 group-hover:bg-emerald-100 transition-colors">
                                  <Repeat2 className="w-[16px] h-[16px] text-emerald-400 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <span className="text-sm tabular-nums">{post.shares_count || 0}</span>
                              </button>
                            </div>
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