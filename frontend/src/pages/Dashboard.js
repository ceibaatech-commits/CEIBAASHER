import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Award, MapPin, Calendar, Trophy, FileText, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import FollowListModal from '../components/FollowListModal';
import Header from '../components/Header';
import MathText from '../components/MathText';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [quizRooms, setQuizRooms] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      console.error('[Dashboard] User is missing');
      setLoading(false);
      return;
    }
    
    // If user doesn't have a username, we need to update the user object and database
    if (!user.username) {
      console.warn('[Dashboard] User has no username, generating one');
      const generatedUsername = user.email?.split('@')[0] || `user${user.id?.slice(0, 8)}`;
      
      // Try to update the username in the backend
      try {
        await axios.patch(
          `${BACKEND_URL}/api/users/${user.id}`,
          { username: generatedUsername },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        // Update user object with the new username
        user.username = generatedUsername;
      } catch (error) {
        console.error('[Dashboard] Failed to update username:', error);
      }
      
      // Create profile and continue
      setProfile({
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        username: generatedUsername,
        profile_picture: user.profile_picture || user.avatar,
        bio: user.bio || '',
        location: user.location || '',
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        score: user.score || 0
      });
      setLoading(false);
      
      // Now fetch the posts using the generated username
      fetchUserContent('posts');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/${user.username}`,
        {
          params: { current_user_id: user.id }
        }
      );

      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set profile to null to show error state
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async (tab) => {
    if (!profile) return;
    
    setLoadingContent(true);
    try {
      if (tab === 'posts' || tab === 'reposts') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${user.username}/posts`,
          {
            params: { current_user_id: user.id }
          }
        );
        if (response.data.success) {
          setPosts(response.data.posts || []);
        }
      } else if (tab === 'quizzes') {
        const response = await axios.get(
          `${BACKEND_URL}/api/profile/${user.username}/quiz-rooms`,
          {
            params: { current_user_id: user.id }
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
    if (profile) {
      fetchUserContent(activeTab);
    }
  }, [activeTab, profile]);

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

  const handleProfileClick = (username) => {
    if (username === user.username) {
      // Don't navigate if it's own profile
      return;
    }
    navigate(`/profile/${username}`);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load your profile.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();
  
  const logout = () => {
    // Implement logout logic if needed
    navigate('/login');
  };

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
            {/* Avatar, User Info & Edit Button */}
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

              {/* Edit Profile Button */}
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold shadow-lg text-sm"
              >
                Edit Profile
              </button>
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
                onClick={() => {
                  setFollowModalType('followers');
                  setShowFollowModal(true);
                }}
                className="flex flex-col items-center hover:opacity-70 transition-opacity"
              >
                <p className="text-2xl font-bold text-gray-900">{profile.followers_count || 0}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </button>
              <button
                onClick={() => {
                  setFollowModalType('following');
                  setShowFollowModal(true);
                }}
                className="flex flex-col items-center hover:opacity-70 transition-opacity"
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
                              <span className="font-medium">You reposted</span>
                            </div>
                          )}
                          
                          {/* Comment Indicator */}
                          {post.is_comment && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 px-4 pt-3 pb-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">You commented</span>
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
                                    className="font-semibold text-gray-900 text-[15px]"
                                    onClick={() => post.is_retweet && post.original_username 
                                      ? handleProfileClick(post.original_username)
                                      : null
                                    }
                                  >
                                    {post.is_retweet 
                                      ? (post.original_user_name || post.original_username || 'Anonymous')
                                      : 'You'
                                    }
                                  </span>
                                  
                                  {/* Role Badges */}
                                  {(profile.badges?.isTeacher || profile.isTeacher) && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white">
                                      Teacher
                                    </span>
                                  )}
                                  {(profile.badges?.isProfessor || profile.isProfessor) && !post.is_retweet && (
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
                            Share your first thought on Victory Lane
                          </p>
                        </>
                      ) : (
                        <>
                          <Repeat2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600 text-lg">No reposts yet</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Repost posts from Victory Lane to share them here
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
                        Create your first quiz room to share with others
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentProfile={profile}
        onProfileUpdated={(updatedProfile) => {
          // Update profile with all fields including exam_focus
          setProfile(prev => ({
            ...prev,
            ...updatedProfile,
            exam_focus: updatedProfile.exam_focus || []
          }));
          // Update localStorage to sync profile picture across all pages (including Board)
          updateUser({
            profile_picture: updatedProfile.profile_picture,
            avatar: updatedProfile.profile_picture,
            name: updatedProfile.name
          });
          setShowEditModal(false);
          // Refetch profile to ensure consistency
          fetchProfile();
        }}
      />

      {/* Follow List Modal */}
      {profile && (
        <FollowListModal
          isOpen={showFollowModal}
          onClose={() => setShowFollowModal(false)}
          userId={profile.id}
          type={followModalType}
        />
      )}
    </div>
  );
};

export default Dashboard;