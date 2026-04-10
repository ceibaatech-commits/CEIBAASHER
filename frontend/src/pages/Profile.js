import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  MapPin, Calendar, Link2, ArrowLeft, MoreHorizontal,
  Trophy, Zap, Target, BookOpen, Edit2, Plus,
  Heart, MessageCircle, Share2, Bookmark, CheckCircle2,
  Users, Activity, Award, Repeat2, Trash2, X
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import VideoPost from '../components/VictoryLane/VideoPost';
import FollowButton from '../components/FollowButton';
import { toast } from 'sonner';

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
const PostCard = ({ post, isOwn, onDelete, profile }) => {
  const [liked, setLiked] = useState(post.liked_by_user || false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(post.user_bookmarked || false);
  const [shared, setShared] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const toggleLike = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to like posts'); return; }
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

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to save posts'); return; }
    const next = !saved;
    setSaved(next);
    toast.success(next ? 'Post saved' : 'Removed from saved');
    try {
      if (next) {
        await axios.post(`${BACKEND_URL}/api/social/posts/${post.id}/bookmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${post.id}/bookmark`, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch { setSaved(!next); }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to repost'); return; }
    if (shared) { toast.info('Already reposted'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${post.id}/share`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setShared(true);
      toast.success('Reposted!');
    } catch { toast.error('Failed to repost'); }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Check this post', url }); } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success('Post link copied!');
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete?.(post.id);
    }
  };

  const displayName = post.user_name || post.username || profile?.name || 'User';
  const displayUsername = post.username || profile?.username || '';
  const displayAvatar = post.user_avatar || profile?.profile_picture;

  return (
    <div className="px-4 py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-testid="profile-post-card">
      {/* Post header with username */}
      <div className="flex items-start gap-3 mb-3">
        <div className="cursor-pointer" onClick={() => displayUsername && navigate(`/profile/${displayUsername}`)}>
          <UserAvatar profilePicture={displayAvatar} name={displayName} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900 truncate cursor-pointer hover:underline"
              onClick={() => displayUsername && navigate(`/profile/${displayUsername}`)}>
              {displayName}
            </span>
            <span className="text-sm text-gray-500 truncate">@{displayUsername}</span>
            <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{relTime(post.created_at)}</span>
          </div>
        </div>
        {/* Menu for own posts */}
        {isOwn && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              data-testid="post-menu-btn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 w-40">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  data-testid="delete-post-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Action buttons: Comment, Repost, Like, Share, Bookmark */}
      <div className="flex items-center justify-between -ml-1">
        <div className="flex items-center gap-0.5">
          {/* Comment */}
          <button
            onClick={(e) => { e.stopPropagation(); toast.info('Comments coming soon'); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95"
            data-testid="post-comment-btn"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{post.comments_count || post.comment_count || 0}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              shared ? 'text-green-500 bg-green-50' : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
            }`}
            data-testid="post-repost-btn"
          >
            <Repeat2 className={`w-3.5 h-3.5 ${shared ? 'stroke-[2.5px]' : ''}`} />
            <span>{(post.shares_count || post.share_count || 0) + (shared ? 1 : 0)}</span>
          </button>

          {/* Like */}
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

          {/* Share (clipboard/native) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all active:scale-95"
            data-testid="post-share-btn"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={toggleBookmark}
          className={`p-1.5 rounded-full transition-all active:scale-95 ${saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'}`}
          data-testid="post-bookmark-btn"
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-blue-600' : ''}`} />
        </button>
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

  const [showExamPicker, setShowExamPicker] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', website: '' });

  // Available exams (from the website)
  const AVAILABLE_EXAMS = [
    'JEE Main', 'JEE Advanced', 'NEET', 'UPSC CSE', 'CAT',
    'GATE', 'CBSE Class 10', 'CBSE Class 12', 'ICSE',
    'RPSC', 'SSC CGL', 'IBPS PO', 'NDA', 'CLAT',
    'Physics', 'Chemistry', 'Mathematics', 'Biology',
    'English', 'General Knowledge', 'Reasoning'
  ];

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
    if (tab === 'saved' && isOwnProfile && savedPosts.length === 0) {
      setSavedLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get(`${BACKEND_URL}/api/social/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setSavedPosts(res.data.posts || []);
          }
        }
      } catch { /* ignore */ }
      finally { setSavedLoading(false); }
    }
  }, [resolvedUserId, followers.length, following.length, isOwnProfile, savedPosts.length]);

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

  const handleBlockAndRedirect = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/profile/block`,
        { target_user_id: resolvedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Blocked @${profile.username}`);
      navigate('/victory-lane');
    } catch {
      toast.error('Failed to block user');
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: profile.name || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/profile/update`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setProfile(prev => ({ ...prev, ...editForm }));
        toast.success('Profile updated');
        setShowEditModal(false);
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAddExam = async (exam) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const currentExams = profile.exam_focus || [];
      if (currentExams.includes(exam)) { toast.info('Already added'); return; }
      const updated = [...currentExams, exam];
      await axios.put(
        `${BACKEND_URL}/api/profile/update`,
        { exam_focus: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(prev => ({ ...prev, exam_focus: updated }));
      toast.success(`Added ${exam}`);
      setShowExamPicker(false);
    } catch {
      toast.error('Failed to add exam');
    }
  };

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

      {/* Exam Picker Modal */}
      {showExamPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="exam-picker-modal">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Add Exam Focus</h3>
              <button onClick={() => setShowExamPicker(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-500 mb-3">Select exams you're preparing for:</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EXAMS.filter(e => !(profile?.exam_focus || []).includes(e)).map(exam => {
                  const s = examTagStyle(exam);
                  return (
                    <button
                      key={exam}
                      onClick={() => handleAddExam(exam)}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border transition-all hover:scale-105 active:scale-95 ${s.bg} ${s.text} ${s.border}`}
                    >
                      <Plus className="w-3 h-3" />
                      {exam}
                    </button>
                  );
                })}
              </div>
              {(profile?.exam_focus || []).length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Your current exams:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.exam_focus.map(tag => {
                      const s = examTagStyle(tag);
                      return (
                        <span key={tag} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                          <Target className="w-3 h-3" />{tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="edit-profile-modal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  data-testid="edit-name-input"
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  data-testid="edit-bio-input"
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Tell people about yourself..."
                />
                <p className="text-right text-xs text-gray-400 mt-0.5">{editForm.bio.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  data-testid="edit-location-input"
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  data-testid="edit-website-input"
                  type="text"
                  value={editForm.website}
                  onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                data-testid="save-profile-btn"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                      onClick={openEditModal}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      data-testid="edit-profile-btn"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit profile
                    </button>
                    <button
                      onClick={() => navigate('/victory-lane')}
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
                      <button
                        onClick={async () => {
                          try {
                            const tkn = localStorage.getItem('token');
                            const res = await axios.post(
                              `${BACKEND_URL}/api/messages/conversations`,
                              { target_user_id: resolvedUserId },
                              { headers: { Authorization: `Bearer ${tkn}` } }
                            );
                            if (res.data.success) {
                              navigate(`/messages/${res.data.conversation.id}`);
                            }
                          } catch {
                            toast.error('Could not start conversation');
                          }
                        }}
                        className="px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        data-testid="message-btn"
                      >
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
                    onClick={() => setShowExamPicker(true)}
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
                onClick={() => setShowExamPicker(true)}
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
                  profile={profile}
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
                    <button
                      onClick={() => {
                        const rc = post.quiz_details?.room_code || post.room_code;
                        if (rc) navigate(`/quiz-room/${rc}`);
                        else navigate(`/post/${post.id}`);
                      }}
                      data-testid={`quiz-attempt-${post.id}`}
                      className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >Attempt</button>
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
          <div className="bg-white">
            {savedLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Bookmark className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No saved posts yet</p>
                <p className="text-xs text-gray-400 mt-1">Bookmark posts from Victory Lane to see them here</p>
              </div>
            ) : (
              savedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwn={post.user_id === resolvedUserId}
                  onDelete={handleDeletePost}
                  profile={profile}
                />
              ))
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
