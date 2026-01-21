import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, CheckCircle, GraduationCap, Send, Trash2, Undo2 } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [postId]);

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
        setLikesCount(response.data.post.likes_count || 0);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Post not found or has been deleted');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error('Please login to comment');
        navigate('/login');
      }
      return;
    }

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/comment`, {
        content: newComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setComments(prev => [response.data.comment, ...prev]);
        setNewComment('');
        toast.success('Comment added!');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete post
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

  // Undo repost (for when viewing a repost)
  const handleUndoRepost = async () => {
    if (!window.confirm('Are you sure you want to undo this repost?')) return;
    
    try {
      const token = localStorage.getItem('token');
      // Use the original_post_id for the unshare endpoint
      await axios.delete(`${BACKEND_URL}/api/social/posts/${post.original_post_id}/unshare`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Repost removed');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to undo repost');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
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
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This post may have been deleted or is no longer available.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Main Post Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Post Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <UserAvatar
                profilePicture={post.user_avatar || post.user_profile_picture}
                name={post.user_name}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <span className="font-bold text-gray-900">{post.user_name}</span>
                  {post.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
                  )}
                  {post.isTeacher && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500 text-white">
                      Teacher
                    </span>
                  )}
                  {post.isProfessor && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-600 text-white">
                      Professor
                    </span>
                  )}
                  {post.isInstitute && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 text-white">
                      Institute
                    </span>
                  )}
                  {post.isOfficial && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-white">
                      Official
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
              </div>
              
              {/* Delete or Undo Button - only for own posts/reposts */}
              {user && user.id === post.user_id && (
                post.is_retweet ? (
                  <button
                    onClick={handleUndoRepost}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    title="Undo repost"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleDeletePost}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Academic Question Badge */}
          {post.post_type === 'academic_question' && (
            <div className="px-5 pt-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-800 font-semibold">Academic Question</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.academic_class && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      📚 {post.academic_class}
                    </span>
                  )}
                  {post.academic_subject && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      📖 {post.academic_subject}
                    </span>
                  )}
                  {post.academic_chapter && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      📝 {post.academic_chapter}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="p-5">
            <div className="text-gray-900 text-lg leading-relaxed">
              <MathText text={post.content} />
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-red-500' : ''}`} />
                  <span className="font-medium">{likesCount}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{comments.length}</span>
                </div>
              </div>
              <Link
                to="/victory-lane"
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                View on Victory Lane →
              </Link>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-100">
            <div className="p-5">
              <h3 className="font-bold text-gray-900 mb-4">
                {comments.length > 0 ? `${comments.length} Answer${comments.length > 1 ? 's' : ''}` : 'No answers yet'}
              </h3>

              {/* Add Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex gap-3">
                    <UserAvatar
                      profilePicture={user?.profile_picture}
                      name={user?.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your answer..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || submittingComment}
                          className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>Post Answer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                  <p className="text-gray-600 mb-3">Login to answer this question</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                  >
                    Login
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <UserAvatar
                      profilePicture={comment.user_avatar || comment.user_profile_picture}
                      name={comment.user_name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{comment.user_name}</span>
                          {comment.isTeacher && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white">
                              Teacher
                            </span>
                          )}
                          {comment.isProfessor && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-600 text-white">
                              Professor
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                        {/* Delete comment button - only for own comments */}
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="text-gray-700">
                        <MathText text={comment.content} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Be the first to answer this question!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SinglePost;
