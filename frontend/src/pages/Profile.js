import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Heart, MessageCircle, Trophy, Calendar, MapPin, Link2, 
  CheckCircle2, Users, ArrowLeft, Play, Clock
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Fetch profile data
  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [userId]);

  // Check if current user follows this profile
  useEffect(() => {
    if (currentUser && userId && userId !== currentUser.id) {
      checkFollowStatus();
    }
  }, [currentUser, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${userId}`);
      console.log('Profile API response:', response.data);
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        setProfile(userData);
        setFollowersCount(userData.followers_count || 0);
        setFollowingCount(userData.following_count || 0);
      } else {
        console.error('Profile not found or API returned no user data');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${userId}/posts`);
      if (response.data.success) {
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPosts([]);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${userId}/followers`);
      if (response.data.success) {
        setFollowers(response.data.followers || []);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${userId}/following`);
      if (response.data.success) {
        setFollowing(response.data.following || []);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${currentUser.id}/following`);
      if (response.data.success) {
        const followingIds = response.data.following?.map(f => f.id || f.user_id) || [];
        setIsFollowing(followingIds.includes(userId));
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (isFollowing) {
        await axios.delete(`${BACKEND_URL}/api/social/user/follow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await axios.post(`${BACKEND_URL}/api/social/user/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'followers' && followers.length === 0) {
      fetchFollowers();
    } else if (tab === 'following' && following.length === 0) {
      fetchFollowing();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getGradientColor = (category) => {
    if (category?.includes('Physics')) return '#8B5CF6';
    if (category?.includes('Chemistry')) return '#10B981';
    if (category?.includes('Mathematics') || category?.includes('Math')) return '#3B82F6';
    if (category?.includes('Biology')) return '#EC4899';
    return '#6366F1';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <button
          onClick={() => navigate('/victory-lane')}
          className="text-blue-600 hover:underline"
        >
          Back to Victory Lane
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={!!currentUser} user={currentUser} onLogout={logout} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar & Follow Button */}
            <div className="-mt-20 mb-4 flex justify-between items-end">
              <div className="border-4 border-white shadow-lg rounded-full">
                <UserAvatar
                  profilePicture={profile.profile_picture}
                  name={profile.name}
                  size="xxl"
                />
              </div>
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    isFollowing
                      ? 'border-2 border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            
            {/* Name & Username */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                {profile.is_verified && (
                  <CheckCircle2 className="w-7 h-7 text-blue-500 fill-blue-500" />
                )}
              </div>
              <p className="text-gray-500 text-lg mb-3">@{profile.username}</p>
              
              {/* Badges Section */}
              {(profile.badges?.isTeacher || profile.badges?.isProfessor || profile.badges?.isOfficial || profile.badges?.isInstitute) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile.badges.isTeacher || profile.isTeacher) && (
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
                      <CheckCircle2 className="w-4 h-4 mr-1.5 fill-white" />
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
            
            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 mb-4">{profile.bio}</p>
            )}
            
            {/* Location & Website & Joined */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:underline"
                >
                  <Link2 className="w-4 h-4" />
                  {profile.website}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.joined_at || profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 border-t border-gray-200 pt-4">
              <div className="text-center cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-lg transition" onClick={() => handleTabChange('posts')}>
                <p className="text-2xl font-bold text-gray-900">{profile.posts_count || posts.length || 0}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-lg transition" onClick={() => handleTabChange('followers')}>
                <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-lg transition" onClick={() => handleTabChange('following')}>
                <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
                <p className="text-sm text-gray-500">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-2xl shadow-xl">
          <div className="flex border-b border-gray-200">
            {['posts', 'followers', 'following'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-4 text-center font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No posts yet</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition">
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          profilePicture={profile.profile_picture}
                          name={profile.name}
                          size="lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{profile.name}</span>
                            {profile.is_verified && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                            )}
                            <span className="text-gray-500 text-sm">· {formatTimestamp(post.created_at)}</span>
                          </div>
                          <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>

                          {/* Quiz Room Card */}
                          {post.post_type === 'quiz_room' && post.quiz_details && (
                            <div 
                              className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition"
                              style={{ borderColor: `${getGradientColor(post.quiz_details.category)}40` }}
                            >
                              <div 
                                className="h-24 flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${getGradientColor(post.quiz_details.category)} 0%, ${getGradientColor(post.quiz_details.category)}cc 100%)` }}
                              >
                                <Trophy className="w-10 h-10 text-white opacity-80" />
                              </div>
                              <div className="p-3 bg-white">
                                <h3 className="font-bold text-gray-900 mb-1">{post.quiz_details.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{post.quiz_details.category}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Play className="w-3 h-3" />
                                    {post.quiz_details.questions_count || 5} questions
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.quiz_details.time_limit || 15} min
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Post Stats */}
                          <div className="flex items-center gap-6 mt-3 text-gray-500 text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <div className="space-y-3">
                {followers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No followers yet</p>
                  </div>
                ) : (
                  followers.map(follower => (
                    <div 
                      key={follower.id || follower.user_id}
                      onClick={() => navigate(`/profile/${follower.id || follower.user_id}`)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition cursor-pointer"
                    >
                      <UserAvatar
                        profilePicture={follower.profile_picture}
                        name={follower.name}
                        size="xl"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{follower.name || 'User'}</p>
                          {follower.is_verified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">@{follower.username || 'user'}</p>
                        {follower.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{follower.bio}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p className="font-semibold text-gray-900">{follower.followers_count || 0}</p>
                        <p>followers</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div className="space-y-3">
                {following.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Not following anyone yet</p>
                  </div>
                ) : (
                  following.map(followedUser => (
                    <div 
                      key={followedUser.id || followedUser.user_id}
                      onClick={() => navigate(`/profile/${followedUser.id || followedUser.user_id}`)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition cursor-pointer"
                    >
                      <UserAvatar
                        profilePicture={followedUser.profile_picture}
                        name={followedUser.name}
                        size="xl"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{followedUser.name || 'User'}</p>
                          {followedUser.is_verified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">@{followedUser.username || 'user'}</p>
                        {followedUser.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{followedUser.bio}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p className="font-semibold text-gray-900">{followedUser.followers_count || 0}</p>
                        <p>followers</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
