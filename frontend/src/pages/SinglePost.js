import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Repeat2, CheckCircle, GraduationCap, Send, Trash2, Undo2, BookOpen, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const SinglePost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  // isAuthenticated is a function, so we need to call it or check user directly
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [shared, setShared] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  // Increment view count when page loads
  useEffect(() => {
    const incrementView = async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/view`);
        if (response.data.success) {
          setViewsCount(response.data.views);
        }
      } catch (err) {
        console.log('View count update failed:', err);
      }
    };
    
    // Only increment view after post is loaded
    if (post && postId) {
      incrementView();
    }
  }, [post, postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${BACKEND_URL}/api/social/posts/${postId}`, { headers });
      
      if (response.data.success) {
        setPost(response.data.post);
        setComments(response.data.post.comments || []);
        setLiked(response.data.post.liked_by_user || false);
        setLikesCount(response.data.post.likes_count || response.data.post.like_count || 0);
        setShared(response.data.post.shared_by_user || false);
        setShareCount(response.data.post.share_count || 0);
        setViewsCount(response.data.post.views || 0);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Post not found or has been deleted');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to like posts');
      return;
    }
    
    const wasLiked = liked;
    setLiked(!liked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      setLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error('Failed to like post');
    }
  };

  const handleShare = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to repost');
      return;
    }
    
    const wasShared = shared;
    setShared(!shared);
    setShareCount(prev => wasShared ? prev - 1 : prev + 1);
    
    try {
      const token = localStorage.getItem('token');
      if (wasShared) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/unshare`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Repost removed');
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/share`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Reposted!');
      }
    } catch (err) {
      setShared(wasShared);
      setShareCount(prev => wasShared ? prev + 1 : prev - 1);
      toast.error('Failed to update repost');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/comments`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setComments(prev => [...prev, response.data.comment]);
        setNewComment('');
        toast.success('Comment posted!');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleUndoRepost = async () => {
    if (!window.confirm('Are you sure you want to undo this repost?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/social/posts/${post.original_post_id}/unshare`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Repost removed');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to undo repost');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/social/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${day} ${month} ${year} at ${time}`;
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get post type badge
  const getPostTypeBadge = () => {
    if (post?.post_type === 'academic_question') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <GraduationCap className="w-3.5 h-3.5" />
          Academic Question
        </span>
      );
    }
    if (post?.post_type === 'question') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          Question
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-500 mb-6">{error || 'This post may have been deleted.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={logout} />
      
      <div className="max-w-xl mx-auto border-x border-gray-200 min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-6 px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </div>

        {/* Main Post */}
        <article className="border-b border-gray-200">
          {/* Author info */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${post.user_id}`)}
                >
                  <UserAvatar
                    profilePicture={post.user_avatar || post.user_profile_picture}
                    name={post.user_name}
                    size="lg"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="font-bold text-[15px] hover:underline cursor-pointer"
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                      {post.user_name}
                    </span>
                    {post.is_verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                    )}
                    {post.isTeacher && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">Teacher</span>
                    )}
                    {post.isProfessor && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded">Professor</span>
                    )}
                    {post.isInstitute && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">Institute</span>
                    )}
                    {post.isOfficial && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-800 text-white rounded">Official</span>
                    )}
                  </div>
                  <span className="text-gray-500 text-[15px]">@{post.username}</span>
                </div>
              </div>
              
              {/* Actions */}
              {user && user.id === post.user_id && (
                post.is_retweet ? (
                  <button
                    onClick={handleUndoRepost}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    title="Undo repost"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleDeletePost}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Post type badge */}
          {getPostTypeBadge() && (
            <div className="px-4 pb-2">
              {getPostTypeBadge()}
            </div>
          )}

          {/* Post content */}
          <div className="px-4 pb-3">
            <div className="text-[17px] leading-relaxed text-gray-900 whitespace-pre-wrap">
              <MathText text={post.content} />
            </div>
          </div>

          {/* Academic question details */}
          {post.post_type === 'academic_question' && (post.exam_category || post.subject || post.topic) && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {post.exam_category && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {post.exam_category}
                </span>
              )}
              {post.subject && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {post.subject}
                </span>
              )}
              {post.topic && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {post.topic}
                </span>
              )}
            </div>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="px-4 pb-3">
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                {post.media_urls[0].includes('.mp4') || post.media_urls[0].includes('.webm') ? (
                  <video 
                    src={post.media_urls[0]} 
                    controls 
                    className="w-full max-h-[512px] object-contain bg-black"
                  />
                ) : (
                  <img 
                    src={post.media_urls[0]} 
                    alt="" 
                    className="w-full"
                  />
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-gray-500 text-[15px]">
              {formatDate(post.created_at)}
            </span>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 flex items-center gap-5 border-b border-gray-200 text-[15px]">
            <span><strong>{shareCount}</strong> <span className="text-gray-500">Reposts</span></span>
            <span><strong>{likesCount}</strong> <span className="text-gray-500">Likes</span></span>
            <span><strong>{viewsCount}</strong> <span className="text-gray-500">Views</span></span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-around py-2 border-b border-gray-200">
            <button
              onClick={() => document.getElementById('comment-input')?.focus()}
              className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className={`p-3 rounded-full transition-colors ${
                shared 
                  ? 'text-green-500 hover:bg-green-50' 
                  : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
              }`}
            >
              <Repeat2 className={`w-5 h-5 ${shared ? 'stroke-[2.5px]' : ''}`} />
            </button>
            <button
              onClick={handleLike}
              className={`p-3 rounded-full transition-colors ${
                liked 
                  ? 'text-rose-500 hover:bg-rose-50' 
                  : 'text-gray-500 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </article>

        {/* Reply Section */}
        {isLoggedIn ? (
          <div className="px-4 py-3 border-b border-gray-200">
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <UserAvatar
                profilePicture={user?.profile_picture}
                name={user?.name}
                size="md"
              />
              <div className="flex-1">
                <input
                  id="comment-input"
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post your reply"
                  className="w-full py-2 text-[17px] placeholder-gray-500 bg-transparent border-none outline-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-bold text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-center text-gray-600 mb-3">
              <span 
                onClick={() => navigate('/login')}
                className="text-blue-500 font-bold hover:underline cursor-pointer"
              >
                Log in
              </span>
              {' '}to reply to this post
            </p>
          </div>
        )}

        {/* Comments */}
        <div>
          {comments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-3">
                  <div 
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                  >
                    <UserAvatar
                      profilePicture={comment.user_avatar || comment.user_profile_picture}
                      name={comment.user_name}
                      size="md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[15px] hover:underline cursor-pointer" onClick={() => navigate(`/profile/${comment.user_id}`)}>
                          {comment.user_name}
                        </span>
                        {comment.isTeacher && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">Teacher</span>
                        )}
                        {comment.isProfessor && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded">Professor</span>
                        )}
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500 text-sm">{formatCommentDate(comment.created_at)}</span>
                      </div>
                      {user && user.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-[15px] text-gray-900 mt-1 whitespace-pre-wrap">
                      <MathText text={comment.content} />
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SinglePost;
