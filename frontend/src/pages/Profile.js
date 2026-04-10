import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  MapPin, Calendar, Link2, ArrowLeft, MoreHorizontal,
  Trophy, Zap, Target, BookOpen, Edit2, Plus,
  Heart, MessageCircle, Share2, Bookmark, CheckCircle2,
  Users, Activity, Award
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import VideoPost from '../components/VictoryLane/VideoPost';
import FollowButton from '../components/FollowButton';

const BACKEND_URL = window.location.origin;

// Exam tag colours
const EXAM_COLORS = {
  'JEE':        { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200' },
  'NEET':       { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200' },
  'UPSC':       { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200' },
  'Physics':    { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Chemistry':  { bg: 'bg-teal-50',   text: 'text-teal-800',   border: 'border-teal-200' },
  'Mathematics':{ bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Biology':    { bg: 'bg-pink-50',   text: 'text-pink-800',   border: 'border-pink-200' },
};
const examTagStyle = (tag) => {
  for (const [key, val] of Object.entries(EXAM_COLORS)) {
    if (tag.includes(key)) return val;
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

// Role badge
const RoleBadge = ({ profile }) => {
  if (profile.isProfessor || profile.badges?.isProfessor)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200"><Award className="w-3 h-3" />Professor</span>;
  if (profile.isTeacher || profile.badges?.isTeacher)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200"><Trophy className="w-3 h-3" />Teacher</span>;
  if (profile.isOfficial || profile.badges?.isOfficial)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-800 text-white"><CheckCircle2 className="w-3 h-3" />Official</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200"><BookOpen className="w-3 h-3" />Student</span>;
};

// Relative time
const relTime = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Post card
const PostCard = ({ post, isOwn, onDelete }) => {
  const [liked, setLiked] = useState(post.liked_by_user || false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);

  const toggleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const next = !liked;
    setLiked(next);
    setLikes(l => next ? l + 1 : Math.max(0, l - 1));
    try {
      await axios[next ? 'post' : 'delete'](
        `${BACKEND_URL}/api/social/posts/${post.id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { setLiked(!next); setLikes(l => next ? l - 1 : l + 1); }
  };

  return (
    <div className="px-4 py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-testid="profile-post-card">
      {post.quiz_details && (
        <div className="mb-3 rounded-xl border border-blue-100 overflow-hidden">
          <div className="bg-blue-50 px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-900 truncate">{post.quiz_details.title || 'Quiz'}</p>
              <p className="text-xs text-blue-600">{post.quiz_details.category} · {post.quiz_details.num_questions || '-'} questions</p>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-full shrink-0 hover:bg-blue-700 transition-colors">
              Attempt
            </button>
          </div>
        </div>
      )}

      {post.content && (
        <p className="text-sm text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap">
          {post.content.split(/(#\w+)/g).map((part, i) =>
            /^#/.test(part)
              ? <span key={i} className="text-blue-600 font-medium hover:underline cursor-pointer">{part}</span>
              : part
          )}
        </p>
      )}

      {post.media_url && post.media_type === 'video' && (
        <div className="mb-3 rounded-xl overflow-hidden"><VideoPost src={post.media_url} /></div>
      )}

      {post.media_url && post.media_type === 'image' && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={post.media_url} alt="" className="w-full object-cover max-h-80" loading="lazy" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-400 hover:bg-red-50'
            }`}
            data-testid="post-like-btn"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
            <span>{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{post.comments_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-green-500 hover:bg-green-50 transition-all">
            <Share2 className="w-3.5 h-3.5" />
            <span>{post.shares_count || 0}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaved(s => !s)}
            className={`p-1.5 rounded-full transition-all ${saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-blue-600' : ''}`} />
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete?.(post.id)}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs text-gray-400">{relTime(post.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

// Achievement card
const AchCard = ({ title, sub, xp, icon: Icon, color }) => (
  <div className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-gray-900">{title}</p>
    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    {xp && <p className="text-xs font-semibold text-amber-600 mt-2">+{xp} XP</p>}
  </div>
);

// MAIN COMPONENT
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followStatus, setFollowStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [mutualFollowers, setMutualFollowers] = useState([]);

  // Resolved user ID (fetched from profile)
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const isOwnProfile = currentUser && (currentUser.id === resolvedUserId || currentUser.username === username);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/profile/${username}`, {
        params: { current_user_id: currentUser?.id }
      });
      const userData = res.data.user || res.data.profile;
      if (res.data.success && userData) {
        const u = userData;
        setProfile(u);
        setResolvedUserId(u.id);
        setFollowersCount(u.followers_count || 0);
        setFollowingCount(u.following_count || 0);
        setFollowStatus(u.follow_status || null);
      } else {
        setProfile(null);
      }
    } catch { setProfile(null); }
    finally { setLoading(false); }
  }, [username, currentUser?.id]);

  const fetchPosts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${BACKEND_URL}/api/profile/${username}/posts`, {
        params: { current_user_id: currentUser?.id },
        headers
      }).catch(() => null);
      if (res?.data?.success) {
        setPosts(res.data.posts || []);
      } else {
        // Try alternate endpoint
        const alt = await axios.get(`${BACKEND_URL}/api/social/user/${uid}/posts`).catch(() => ({ data: {} }));
        if (alt.data?.success) setPosts(alt.data.posts || []);
      }
    } catch { setPosts([]); }
  }, [username, currentUser?.id]);

  const fetchStats = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${BACKEND_URL}/api/profile/stats/${uid}`, { headers }).catch(() => ({ data: null }));
      if (res.data) setStats(res.data);
    } catch { /* optional */ }
  }, []);

  const fetchMutualFollowers = useCallback(async (uid) => {
    if (!currentUser || !uid) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${BACKEND_URL}/api/profile/mutual-followers/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { mutual: [] } }));
      setMutualFollowers(res.data?.mutual?.slice(0, 3) || []);
    } catch { /* ignore */ }
  }, [currentUser]);

  const fetchTabData = useCallback(async (tab) => {
    if (!resolvedUserId) return;
    if (tab === 'followers' && followers.length === 0) {
      const res = await axios.get(`${BACKEND_URL}/api/profile/followers/${resolvedUserId}`).catch(() => ({ data: {} }));
      if (res.data.success) setFollowers(res.data.followers || []);
    }
    if (tab === 'following' && following.length === 0) {
      const res = await axios.get(`${BACKEND_URL}/api/profile/following/${resolvedUserId}`).catch(() => ({ data: {} }));
      if (res.data.success) setFollowing(res.data.following || []);
    }
  }, [resolvedUserId, followers.length, following.length]);

  // Initial profile fetch
  useEffect(() => {
    if (username) fetchProfile();
  }, [username, fetchProfile]);

  // Once we have the resolved user ID, fetch dependent data
  useEffect(() => {
    if (resolvedUserId) {
      fetchPosts(resolvedUserId);
      fetchStats(resolvedUserId);
      if (!isOwnProfile) fetchMutualFollowers(resolvedUserId);
    }
  }, [resolvedUserId, fetchPosts, fetchStats, fetchMutualFollowers, isOwnProfile]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { alert('Failed to delete post.'); }
  };

  const handleFollowChange = (newStatus) => {
    setFollowStatus(newStatus);
    if (newStatus && !followStatus) setFollowersCount(c => c + 1);
    else if (!newStatus && followStatus) setFollowersCount(c => Math.max(0, c - 1));
  };

  const handleBlockAndRedirect = () => navigate('/victory-lane');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={!!currentUser} user={currentUser} onLogout={logout} />
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-xl font-semibold text-gray-800">Profile not found</p>
        <button onClick={() => navigate('/victory-lane')} className="text-blue-600 hover:underline text-sm">
          Back to Victory Lane
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="profile-page">
      <Header isLoggedIn={!!currentUser} user={currentUser} onLogout={logout} />

      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-3 text-sm font-medium transition-colors"
          data-testid="profile-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Cover + header */}
        <div className="bg-white border-b border-gray-100">
          <div
            className="h-28 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50"
            style={profile.cover_image ? { backgroundImage: `url(${profile.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />

          <div className="px-4">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-9 mb-3">
              <div className="border-3 border-white rounded-full shadow-md">
                <UserAvatar profilePicture={profile.profile_picture} name={profile.name} size="xxl" />
              </div>

              <div className="flex items-center gap-2 mt-10">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => navigate('/settings/profile')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      data-testid="edit-profile-btn"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit profile
                    </button>
                    <button
                      onClick={() => navigate('/create-post')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      data-testid="create-post-btn"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </>
                ) : (
                  currentUser && (
                    <>
                      <button className="px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        Message
                      </button>
                      <FollowButton
                        targetUserId={resolvedUserId}
                        targetUsername={profile.username || profile.name}
                        initialStatus={followStatus}
                        onFollowChange={handleFollowChange}
                        onBlock={handleBlockAndRedirect}
                      />
                    </>
                  )
                )}
              </div>
            </div>

            {/* Name + role */}
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-100" />}
              <RoleBadge profile={profile} />
            </div>
            <p className="text-sm text-gray-500 mb-2">@{profile.username}</p>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{profile.bio}</p>
            )}

            {/* Exam focus tags */}
            {profile.exam_focus && profile.exam_focus.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.exam_focus.map(tag => {
                  const s = examTagStyle(tag);
                  return (
                    <span key={tag} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                      <Target className="w-3 h-3" />
                      {tag}
                    </span>
                  );
                })}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add exam
                  </button>
                )}
              </div>
            )}
            {!profile.exam_focus?.length && isOwnProfile && (
              <button
                onClick={() => navigate('/settings/profile')}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors mb-3"
              >
                <Target className="w-3 h-3" />
                Add exam focus (JEE, NEET, UPSC...)
              </button>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                  <Link2 className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.joined_at || profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Mutual followers */}
            {!isOwnProfile && mutualFollowers.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {mutualFollowers.map((u, i) => (
                    <div
                      key={u.id}
                      className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 font-bold text-xs"
                      style={{ marginLeft: i > 0 ? -6 : 0, zIndex: mutualFollowers.length - i }}
                    >
                      {(u.name || u.username || '?')[0].toUpperCase()}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Followed by {mutualFollowers.map(u => u.name || u.username).join(', ')}
                  {followersCount > mutualFollowers.length && ` and ${followersCount - mutualFollowers.length} others you follow`}
                </p>
              </div>
            )}

            {/* Close friend status badge */}
            {!isOwnProfile && followStatus === 'close_friend' && (
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <p className="text-xs font-medium text-teal-700">Following · Close friend</p>
              </div>
            )}

            {/* Follow stats */}
            <div className="flex gap-5 pb-3">
              <button
                className="text-left hover:opacity-70 transition-opacity"
                onClick={() => handleTabChange('following')}
                data-testid="following-count"
              >
                <span className="text-sm font-bold text-gray-900">{followingCount}</span>
                <span className="text-xs text-gray-500 ml-1">Following</span>
              </button>
              <button
                className="text-left hover:opacity-70 transition-opacity"
                onClick={() => handleTabChange('followers')}
                data-testid="followers-count"
              >
                <span className="text-sm font-bold text-gray-900">{followersCount}</span>
                <span className="text-xs text-gray-500 ml-1">Followers</span>
              </button>
              <span>
                <span className="text-sm font-bold text-gray-900">{posts.length}</span>
                <span className="text-xs text-gray-500 ml-1">Posts</span>
              </span>
            </div>
          </div>

          {/* Stats cards */}
          {(isOwnProfile || stats) && (
            <div className="grid grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
              {[
                { label: 'Quizzes', value: stats?.quizzes_completed ?? '-', icon: Target, color: 'text-blue-600' },
                { label: 'Avg score', value: stats?.avg_score ? `${Math.round(stats.avg_score)}%` : '-', icon: Activity, color: 'text-green-600' },
                { label: 'Battle wins', value: stats?.battle_wins ?? '-', icon: Zap, color: 'text-amber-600' },
                { label: 'Rank', value: stats?.rank ? `#${stats.rank}` : '-', icon: Trophy, color: 'text-purple-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white px-3 py-3 text-center">
                  <div className={`flex justify-center mb-1 ${color}`}><Icon className="w-4 h-4" /></div>
                  <p className="text-base font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex">
            {['posts', 'quizzes', 'achievements', isOwnProfile ? 'saved' : 'followers', isOwnProfile ? 'followers' : 'following'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                data-testid={`tab-${tab}`}
                className={`flex-1 py-3.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <div className="bg-white">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <BookOpen className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No posts yet</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/victory-lane')}
                    className="mt-3 text-sm text-indigo-600 hover:underline"
                  >
                    Share your first post on Victory Lane
                  </button>
                )}
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwn={isOwnProfile}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>
        )}

        {/* Tab: Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="bg-white p-4 grid grid-cols-1 gap-3">
            {posts.filter(p => p.quiz_details).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No quizzes shared yet</p>
              </div>
            ) : (
              posts.filter(p => p.quiz_details).map(post => (
                <div key={post.id} className="border border-blue-100 rounded-xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-900 truncate">{post.quiz_details.title}</p>
                      <p className="text-xs text-blue-600">{post.quiz_details.category} · {relTime(post.created_at)}</p>
                    </div>
                    <button className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-full">Attempt</button>
                  </div>
                  <div className="flex gap-6 px-4 py-2.5 bg-white">
                    <div><p className="text-sm font-bold text-gray-900">{post.quiz_details.attempts || 0}</p><p className="text-xs text-gray-500">Attempts</p></div>
                    <div><p className="text-sm font-bold text-gray-900">{post.quiz_details.avg_score || '-'}%</p><p className="text-xs text-gray-500">Avg score</p></div>
                    <div><p className="text-sm font-bold text-gray-900">{post.likes_count || 0}</p><p className="text-xs text-gray-500">Likes</p></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Achievements */}
        {activeTab === 'achievements' && (
          <div className="bg-white p-4 grid grid-cols-2 gap-3">
            <AchCard title="Top 50 Physics" sub="National leaderboard" xp={500} icon={Trophy} color="bg-amber-50 text-amber-600" />
            <AchCard title="100 Battle streak" sub="Won 100 battles" xp={300} icon={Zap} color="bg-blue-50 text-blue-600" />
            <AchCard title="Quiz master" sub="500+ quizzes done" xp={200} icon={Target} color="bg-teal-50 text-teal-600" />
            <AchCard title="Perfect score" sub="100% on mock test" xp={150} icon={Award} color="bg-purple-50 text-purple-600" />
          </div>
        )}

        {/* Tab: Followers / Following */}
        {(activeTab === 'followers' || activeTab === 'following') && (
          <div className="bg-white">
            {(activeTab === 'followers' ? followers : following).map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <UserAvatar profilePicture={u.profile_picture} name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                  {u.exam_focus?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {u.exam_focus.slice(0, 2).map(tag => (
                        <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${examTagStyle(tag).bg} ${examTagStyle(tag).text}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {currentUser && u.id !== currentUser.id && (
                  <FollowButton
                    targetUserId={u.id}
                    targetUsername={u.username || u.name}
                    initialStatus={null}
                    onFollowChange={() => {}}
                  />
                )}
              </div>
            ))}
            {(activeTab === 'followers' ? followers : following).length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No {activeTab} yet</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Saved */}
        {activeTab === 'saved' && isOwnProfile && (
          <div className="bg-white flex flex-col items-center justify-center py-16 text-gray-400">
            <Bookmark className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Bookmarked posts appear here</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
