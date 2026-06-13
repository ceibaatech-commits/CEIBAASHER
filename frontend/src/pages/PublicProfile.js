import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Calendar, Award, Lock, FileText, Trophy, ArrowLeft, Heart, MessageCircle, Repeat2, Trash2, MoreHorizontal, Gift, UserPlus, ClipboardList } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';
import ShareReferralModal from '../components/ShareReferralModal';
import Header from '../components/Header';
import MathText from '../components/MathText';
import VideoPost from '../components/VictoryLane/VideoPost';
import TestHistoryTab from '../components/profile/TestHistoryTab';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const PublicProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
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
  const [showShareModal, setShowShareModal] = useState(false);

  // Monotonic request-id so older fetchProfile() responses can't clobber
  // state set by a newer in-flight request (fixes race when AuthContext
  // hydrates after the initial render).
  const profileReqIdRef = useRef(0);

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line
  }, [username, user?.id]);

  const fetchProfile = async () => {
    const reqId = ++profileReqIdRef.current;
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/${username}`,
        {
          params: { current_user_id: user?.id }
        }
      );

      // Discard stale responses (a newer request has been fired)
      if (reqId !== profileReqIdRef.current) return;

      if (response.data.success) {
        setProfile(response.data.profile);
        setCanView(response.data.can_view !== false);
        setFollowStatus(response.data.follow_status);
        setIsBlocked(response.data.is_blocked === true);
      }
    } catch (error) {
      if (reqId !== profileReqIdRef.current) return;
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        // Profile not found
        setProfile(null);
      }
    } finally {
      if (reqId === profileReqIdRef.current) setLoading(false);
    }
  };

  const handleFollowChange = (newStatus) => {
    setFollowStatus(newStatus);
    // Update follower count locally instead of re-fetching entire profile
    // This avoids unmounting FollowButton and potential cache issues
    if (profile) {
      let delta = 0;
      if (newStatus === 'approved') delta = 1;
      else if (newStatus === null) delta = -1;
      setProfile(prev => ({
        ...prev,
        followers_count: Math.max(0, (prev.followers_count || 0) + delta)
      }));
    }
  };

  const handleBlock = () => {
    // After blocking, navigate away from the blocked user's profile
    navigate('/victory-lane', { replace: true });
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
    if (tab === 'tests') return; // TestHistoryTab fetches its own data
    
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
          const postsData = response.data.posts || [];
          setPosts(postsData);
          
          // Initialize interaction states
          const liked = new Set();
          const shared = new Set();
          const bookmarked = new Set();
          postsData.forEach(post => {
            if (post.liked_by_user || post.liked_by?.includes(user?.id)) liked.add(post.id);
            if (post.shared_by_user) shared.add(post.id);
            if (post.bookmarked_by_user || post.bookmarked_by?.includes(user?.id)) bookmarked.add(post.id);
          });
          setLikedPosts(liked);
          setSharedPosts(shared);
          setBookmarkedPosts(bookmarked);
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

  // Like/Unlike a post
  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    
    const isLiked = likedPosts.has(postId);
    
    // Optimistic update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1) };
      }
      return post;
    }));

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {});
    } catch (error) {
      // Revert on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, likes_count: (post.likes_count || 0) + (isLiked ? 1 : -1) };
        }
        return post;
      }));
      toast.error('Failed to update like');
    }
  };

  // Share/Unshare a post
  const handleShare = async (postId) => {
    if (!user) {
      toast.error('Please login to share posts');
      return;
    }
    
    const isShared = sharedPosts.has(postId);
    
    // Optimistic update
    setSharedPosts(prev => {
      const newSet = new Set(prev);
      if (isShared) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, shares_count: Math.max((post.shares_count || 0) + (isShared ? -1 : 1), 0) };
      }
      return post;
    }));

    try {
      if (isShared) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/unshare`);
        toast.success('Repost removed');
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/share`, {});
        toast.success('Post shared!');
      }
    } catch (error) {
      // Revert on error
      setSharedPosts(prev => {
        const newSet = new Set(prev);
        if (isShared) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, shares_count: Math.max((post.shares_count || 0) + (isShared ? 1 : -1), 0) };
        }
        return post;
      }));
      toast.error('Failed to update share');
    }
  };

  // Bookmark a post
  const handleBookmark = async (postId) => {
    if (!user) {
      toast.error('Please login to bookmark posts');
      return;
    }
    
    const isBookmarked = bookmarkedPosts.has(postId);
    
    // Optimistic update
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/bookmark`, {});
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (error) {
      // Revert on error
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      toast.error('Failed to update bookmark');
    }
  };

  // Delete a post (only for own posts)
  const handleDeletePost = async (postId) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}`);
      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  useEffect(() => {
    if (profile && canView) {
      fetchUserContent(activeTab);
    }
  // eslint-disable-next-line
  }, [activeTab, profile, canView]);

  // Note: Removed redirect to dashboard for own profile
  // Users can now view their own public profile with Share & Earn button
  // Dashboard is still accessible via the Edit Profile button

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

  // Blocked profile — either viewer blocked target, or target blocked viewer
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Header isLoggedIn={!!user} user={user} onLogout={logout} />
        <div className="max-w-md mx-auto py-16 px-4" data-testid="profile-unavailable">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Lock className="w-14 h-14 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">This account is not available</h1>
            <p className="text-gray-600 mb-6">
              You can&apos;t view this profile.
            </p>
            <button
              onClick={() => navigate('/victory-lane')}
              data-testid="profile-unavailable-back"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-md"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  onBlock={handleBlock}
                />
              </div>
            )}

            {/* Edit Profile Button - only show for own profile */}
            {user && user.id === profile.id && (
              <div className="mt-6 flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-lg"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-semibold transition-all shadow-lg flex items-center gap-2"
                  data-testid="share-earn-button-card"
                >
                  <Gift className="w-4 h-4" />
                  Share & Earn
                </button>
              </div>
            )}

            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-semibold text-sm transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
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
          <div className="px-4 py-4 md:px-6 md:py-6">
            {/* Mobile: Stack layout, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              {/* Avatar and User Info Row */}
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <img
                    src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                    alt={profile.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-purple-100 shadow-md object-cover"
                  />
                  {profile.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 md:w-6 md:h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
                  <p className="text-gray-500 text-sm">@{profile.username}</p>
                </div>
              </div>

              {/* Follow/Edit Button - Full width on mobile */}
              <div className="w-full sm:w-auto sm:flex-shrink-0 flex flex-col gap-2">
                {user && user.id !== profile.id ? (
                  <div className="w-full sm:w-auto">
                    <FollowButton
                      targetUserId={profile.id}
                      targetUsername={profile.username}
                      initialStatus={followStatus}
                      onFollowChange={handleFollowChange}
                      onBlock={handleBlock}
                      className="w-full sm:w-auto"
                    />
                  </div>
                ) : user && user.id === profile.id ? (
                  <>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold shadow-md text-sm"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-semibold shadow-md text-sm flex items-center justify-center gap-1.5"
                      data-testid="share-earn-button"
                    >
                      <Gift className="w-4 h-4" />
                      Share & Earn
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-semibold text-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    Login to Follow
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
            )}

            {/* Location & Joined Date - Inline on mobile */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.joined_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Exam Focus Tags - Smaller on mobile */}
            {profile.exam_focus && profile.exam_focus.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.exam_focus.map(exam => (
                  <span
                    key={exam}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                  >
                    🎯 {exam}
                  </span>
                ))}
              </div>
            )}

            {/* Badges - Compact on mobile */}
            {(profile.badges?.isTeacher || profile.badges?.isProfessor || profile.badges?.isOfficial || profile.badges?.isInstitute ||
              profile.isTeacher || profile.isProfessor || profile.isOfficial || profile.isInstitute) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(profile.badges?.isTeacher || profile.isTeacher) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    <Trophy className="w-3 h-3 mr-1" />
                    Teacher
                  </span>
                )}
                {(profile.badges?.isProfessor || profile.isProfessor) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                    <Trophy className="w-3 h-3 mr-1" />
                    Professor
                  </span>
                )}
                {(profile.badges?.isOfficial || profile.isOfficial) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                    <Award className="w-3 h-3 mr-1 fill-white" />
                    Official
                  </span>
                )}
                {(profile.badges?.isInstitute || profile.isInstitute) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white" style={{backgroundColor: '#8B2E2E'}}>
                    <Trophy className="w-3 h-3 mr-1" />
                    Institute
                  </span>
                )}
              </div>
            )}

            {/* Stats Row - Horizontal, compact layout */}
            <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-gray-900">{profile.posts_count || 0}</span>
                <span className="text-gray-500 text-xs">Posts</span>
              </div>
              <button
                onClick={handleFollowersClick}
                className={`flex items-center gap-1.5 hover:opacity-70 transition-opacity ${!canView && 'cursor-not-allowed opacity-50'}`}
                disabled={!canView}
              >
                <span className="text-base font-bold text-gray-900">{profile.followers_count || 0}</span>
                <span className="text-gray-500 text-xs">Followers</span>
              </button>
              <button
                onClick={handleFollowingClick}
                className={`flex items-center gap-1.5 hover:opacity-70 transition-opacity ${!canView && 'cursor-not-allowed opacity-50'}`}
                disabled={!canView}
              >
                <span className="text-base font-bold text-gray-900">{profile.following_count || 0}</span>
                <span className="text-gray-500 text-xs">Following</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-4 bg-white md:rounded-2xl md:shadow-xl overflow-hidden -mx-4 md:mx-0">
          {/* Tab Headers - Compact on mobile */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2.5 md:py-3 px-2 md:px-6 font-medium text-sm md:text-base transition-colors ${
                activeTab === 'posts'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Posts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-2.5 md:py-3 px-2 md:px-6 font-medium text-sm md:text-base transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>Quiz Rooms</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reposts')}
              className={`flex-1 py-2.5 md:py-3 px-2 md:px-6 font-medium text-sm md:text-base transition-colors ${
                activeTab === 'reposts'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Repeat2 className="w-5 h-5" />
                Reposts
              </div>
            </button>
            {user && profile && user.id === profile.id && (
              <button
                onClick={() => setActiveTab('tests')}
                data-testid="tab-tests"
                className={`flex-1 py-2.5 md:py-3 px-2 md:px-6 font-medium text-sm md:text-base transition-colors ${
                  activeTab === 'tests'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Tests</span>
                </div>
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="px-0 md:p-6 py-2 md:py-6 min-h-[400px]">
            {loadingContent ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : (
              <>
                {(activeTab === 'posts' || activeTab === 'reposts') && (
                  filteredPosts.length > 0 ? (
                    <div className="divide-y divide-gray-100 md:divide-y-0 md:space-y-4">
                      {filteredPosts
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map(post => (
                        <div key={post.id} className="bg-white md:rounded-xl md:border md:border-gray-200 md:hover:border-gray-300 transition-colors overflow-hidden">
                          {/* Repost Indicator */}
                          {post.is_retweet === true && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 px-4 pt-3 pb-0.5">
                              <Repeat2 className="w-3.5 h-3.5" />
                              <span className="font-medium">{profile.name} reposted</span>
                            </div>
                          )}
                          
                          {/* Comment Indicator */}
                          {post.is_comment && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 px-4 pt-3 pb-0.5">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">{profile.name} commented</span>
                            </div>
                          )}

                          <div className="px-4 py-3 md:py-4">
                            {/* Modern Header Row - Avatar, User Info, Date, Tags all inline */}
                            <div className="flex items-start gap-2.5 mb-2">
                              {/* Avatar */}
                              <div 
                                className="cursor-pointer flex-shrink-0"
                                onClick={() => post.is_retweet && post.original_username 
                                  ? handleProfileClick(post.original_username)
                                  : null
                                }
                              >
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
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
                                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                                  {/* Username */}
                                  <span 
                                    className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer text-sm md:text-[15px] transition-colors"
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
                                    <span className="w-3.5 h-3.5 text-blue-500">✓</span>
                                  )}
                                  
                                  {/* Role Badges */}
                                  {(profile.badges?.isTeacher || profile.isTeacher || post.isTeacher) && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500 text-white">
                                      Teacher
                                    </span>
                                  )}
                                  {(profile.badges?.isProfessor || profile.isProfessor || post.isProfessor) && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-600 text-white">
                                      Professor
                                    </span>
                                  )}
                                  {(profile.badges?.isInstitute || profile.isInstitute || post.isInstitute) && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-600 text-white">
                                      Institute
                                    </span>
                                  )}
                                  {(profile.badges?.isOfficial || profile.isOfficial || post.isOfficial) && !post.is_retweet && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-800 text-white">
                                      Official
                                    </span>
                                  )}
                                  
                                  {/* Separator dot */}
                                  <span className="text-gray-300 text-xs">·</span>
                                  
                                  {/* Timestamp */}
                                  <span className="text-gray-400 text-[11px]">
                                    {new Date(post.is_retweet ? (post.original_created_at || post.created_at) : post.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  
                                  {/* Post Type Tag - Compact Style */}
                                  {post.post_type && post.post_type !== 'general' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                      {post.post_type === 'quiz_room' ? '🎯 Quiz' : 
                                       post.post_type === 'question' ? '❓ Q' : 
                                       post.post_type === 'academic_question' ? '📚 Acad' : 
                                       post.post_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Delete Button - only show for own posts */}
                              {user && (user.id === post.user_id || user.username === profile.username) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Comment Content with Original Post Preview */}
                            {post.is_comment && (
                              <div className="pl-[46px] md:pl-[52px] mb-2">
                                <div className="text-gray-900 text-sm mb-2">
                                  <MathText text={post.comment_content || post.content} />
                                </div>
                                
                                {/* Original Post Preview */}
                                {post.original_post && (
                                  <div className="pl-2 border-l-2 border-blue-200 bg-blue-50/50 p-2 rounded-r-lg">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <img
                                        src={post.original_post.user_avatar || `https://ui-avatars.com/api/?name=${post.original_post.user_name}&background=random&size=24`}
                                        alt={post.original_post.user_name}
                                        className="w-4 h-4 rounded-full"
                                      />
                                      <span className="text-xs font-medium text-gray-700">
                                        {post.original_post.user_name}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-2">
                                      <MathText text={post.original_post.content} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Post Content (for regular posts and reposts) - Clickable to view single post */}
                            {!post.is_comment && (
                              <div 
                                className="text-gray-800 text-sm md:text-[15px] leading-relaxed pl-[46px] md:pl-[52px] cursor-pointer hover:bg-gray-50/50 -mx-3 md:-mx-4 px-3 md:px-4 py-1.5 transition-colors"
                                onClick={() => navigate(`/post/${post.id}`)}
                              >
                                <MathText text={post.content} />
                              </div>
                            )}
                            
                            {/* Post Media (images & videos) */}
                            {post.media_urls && post.media_urls.length > 0 && (
                              <div className="pl-[46px] md:pl-[52px] mt-2">
                                {post.media_urls.map((url, mIdx) => {
                                  const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('/video/');
                                  if (isVideo) {
                                    return <VideoPost key={`${post.id}-media-${url}`} src={url} className="rounded-lg" />;
                                  }
                                  return (
                                    <img key={`${post.id}-media-${url}`} src={url} alt="Post media"
                                      className="w-full rounded-lg object-cover max-h-80 cursor-pointer"
                                      onClick={() => navigate(`/post/${post.id}`)} />
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Room Code */}
                            {post.room_code && (
                              <div className="mt-2 ml-[46px] md:ml-[52px] p-1.5 bg-green-50 border border-green-200 rounded-lg inline-block">
                                <p className="text-[10px] text-green-700 font-medium">Room: {post.room_code}</p>
                              </div>
                            )}
                            
                            {/* Modern Interaction Bar - Higher contrast icons */}
                            <div className="flex items-center justify-between pl-[46px] md:pl-[52px] pt-1 mt-1">
                              <div className="flex items-center -ml-2">
                                {/* Like Button */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                                  className={`group flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                                    likedPosts.has(post.id) 
                                      ? 'text-rose-500' 
                                      : 'text-gray-500 hover:text-rose-500'
                                  }`}
                                >
                                  <div className={`p-0.5 rounded-full transition-all duration-200 group-hover:bg-rose-50 ${likedPosts.has(post.id) ? 'bg-rose-50' : ''}`}>
                                    <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                  </div>
                                  <span className="text-xs font-medium tabular-nums">{post.likes_count || 0}</span>
                                </button>
                                
                                {/* Comment Button - navigates to single post */}
                                <button 
                                  onClick={() => navigate(`/post/${post.id}`)}
                                  className="group flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 text-gray-500 hover:text-blue-500"
                                >
                                  <div className="p-0.5 rounded-full transition-all duration-200 group-hover:bg-blue-50">
                                    <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                                  </div>
                                  <span className="text-xs font-medium tabular-nums">{post.comments_count || 0}</span>
                                </button>
                                
                                {/* Share/Repost Button */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleShare(post.id); }}
                                  className={`group flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                                    sharedPosts.has(post.id) 
                                      ? 'text-emerald-500' 
                                      : 'text-gray-500 hover:text-emerald-500'
                                  }`}
                                >
                                  <div className={`p-0.5 rounded-full transition-all duration-200 group-hover:bg-emerald-50 ${sharedPosts.has(post.id) ? 'bg-emerald-50' : ''}`}>
                                    <Repeat2 className={`w-4 h-4 transition-transform group-hover:scale-110 ${sharedPosts.has(post.id) ? 'rotate-180' : ''}`} />
                                  </div>
                                  <span className="text-xs font-medium tabular-nums">{post.shares_count || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {activeTab === 'posts' ? (
                        <>
                          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-600 text-base">No posts yet</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {profile.name} hasn&apos;t shared anything yet
                          </p>
                        </>
                      ) : (
                        <>
                          <Repeat2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-600 text-base">No reposts yet</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {profile.name} hasn&apos;t reposted anything yet
                          </p>
                        </>
                      )}
                    </div>
                  )
                )}
                {activeTab === 'tests' && user && profile && user.id === profile.id && (
                  <TestHistoryTab />
                )}
                {activeTab === 'quizzes' && (
                  quizRooms.length > 0 ? (
                    <div className="space-y-3">
                      {quizRooms.map(room => (
                        <div key={room.room_code} className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-3 border border-green-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-800 truncate">{room.title}</h3>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{room.description}</p>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              <div className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-center">
                                <div className="text-[9px] font-semibold">CODE</div>
                                <div className="text-sm font-bold">{room.room_code}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            <span className="px-2 py-0.5 bg-white rounded-full text-gray-700 font-medium">
                              📝 {room.question_count} Qs
                            </span>
                            <span className="px-2 py-0.5 bg-white rounded-full text-gray-700 font-medium">
                              🏷️ {room.category}
                            </span>
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 font-semibold">
                              {(() => {
                                if (room.privacy === 'public') return '🌐 Public';
                                if (room.privacy === 'followers_only') return '👥 Followers';
                                return '🔒 Private';
                              })()}
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

      {/* Share Referral Modal */}
      <ShareReferralModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
      />
    </div>
  );
};

export default PublicProfile;