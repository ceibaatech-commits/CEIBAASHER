import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, MessageCircle, Share2, Bookmark, Send, Hash, TrendingUp, 
  Users, MessageSquare, Clock, X, Image as ImageIcon, Video, Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SocialFeed = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('feed'); // feed, trending, bookmarks

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('ceibaa_token');
    const userData = localStorage.getItem('ceibaa_user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFeedData(token);
  };

  const fetchFeedData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch feed posts
      const feedRes = await axios.get(`${BACKEND_URL}/api/social/feed`, { headers });
      setPosts(feedRes.data);

      // Fetch trending hashtags
      const trendingRes = await axios.get(`${BACKEND_URL}/api/social/trending/hashtags`, { headers });
      setTrendingHashtags(trendingRes.data);

      // Fetch suggested users
      const usersRes = await axios.get(`${BACKEND_URL}/api/social/discover/users`, { headers });
      setSuggestedUsers(usersRes.data);

      // Fetch stories
      const storiesRes = await axios.get(`${BACKEND_URL}/api/social/stories`, { headers });
      setStories(storiesRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const token = localStorage.getItem('ceibaa_token');
    
    try {
      // Extract hashtags
      const hashtags = newPostContent.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
      
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts`,
        {
          content: newPostContent,
          hashtags: hashtags
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts([response.data, ...posts]);
      setNewPostContent('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem('ceibaa_token');
    const post = posts.find(p => p.id === postId);

    try {
      if (post.is_liked) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (postId) => {
    const token = localStorage.getItem('ceibaa_token');
    const post = posts.find(p => p.id === postId);

    try {
      if (post.is_bookmarked) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/bookmark`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_bookmarked: false }
            : p
        ));
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/bookmark`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_bookmarked: true }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async (postId) => {
    const token = localStorage.getItem('ceibaa_token');

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts/${postId}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts([response.data, ...posts]);
      
      // Update original post share count
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, shares_count: p.shares_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleComment = async (postId) => {
    const token = localStorage.getItem('ceibaa_token');
    
    try {
      const res = await axios.get(`${BACKEND_URL}/api/social/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(res.data);
      setSelectedPost(postId);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    const token = localStorage.getItem('ceibaa_token');
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts/${selectedPost}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([response.data, ...comments]);
      setNewComment('');
      
      // Update comment count
      setPosts(posts.map(p => 
        p.id === selectedPost 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFollowUser = async (userId) => {
    const token = localStorage.getItem('ceibaa_token');
    
    try {
      await axios.post(
        `${BACKEND_URL}/api/social/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuggestedUsers(suggestedUsers.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
                Ceibaa
              </h1>
              <div className="flex space-x-4">
                <button 
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'feed' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('feed')}
                >
                  Feed
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'trending' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('trending')}
                >
                  Trending
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'bookmarks' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('bookmarks')}
                >
                  Bookmarks
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/messages')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MessageSquare className="w-6 h-6 text-gray-600" />
              </button>
              <img 
                src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`}
                alt={user?.name}
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={() => navigate(`/profile/${user?.id}`)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Profile */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="text-center">
                <img 
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3"
                />
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-500">@{user?.name.toLowerCase().replace(/\s+/g, '')}</p>
                
                <button 
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                >
                  View Profile
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <button className="w-full flex items-center space-x-3 text-left p-3 hover:bg-gray-50 rounded-lg">
                  <Hash className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Topics</span>
                </button>
                <button 
                  onClick={() => navigate('/messages')}
                  className="w-full flex items-center space-x-3 text-left p-3 hover:bg-gray-50 rounded-lg"
                >
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Messages</span>
                </button>
                <button className="w-full flex items-center space-x-3 text-left p-3 hover:bg-gray-50 rounded-lg">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Bookmarks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Feed */}
          <div className="col-span-6">
            {/* Stories */}
            {stories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <div className="flex space-x-4 overflow-x-auto">
                  {stories.map((userStories) => (
                    <div key={userStories.user_id} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5 cursor-pointer">
                        <img 
                          src={userStories.user_profile_picture || `https://ui-avatars.com/api/?name=${userStories.user_name}`}
                          alt={userStories.user_name}
                          className="w-full h-full rounded-full border-2 border-white"
                        />
                      </div>
                      <p className="text-xs text-center mt-1 truncate w-16">{userStories.user_name.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Post */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex space-x-3">
                <img 
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`}
                  alt={user?.name}
                  className="w-12 h-12 rounded-full"
                />
                <button 
                  onClick={() => setShowCreatePost(true)}
                  className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500"
                >
                  What's on your mind?
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm p-6">
                  {/* Post Header */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img 
                      src={post.user_profile_picture || `https://ui-avatars.com/api/?name=${post.user_name}`}
                      alt={post.user_name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold">{post.user_name}</h3>
                        {post.is_verified && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.hashtags.map((tag, idx) => (
                        <span key={idx} className="text-purple-600 hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quiz Attachment */}
                  {post.quiz_id && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">📝 Quiz Battle</p>
                      <p className="font-semibold">{post.quiz_title}</p>
                      <button className="mt-2 text-sm text-purple-600 hover:underline">
                        Join Battle →
                      </button>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center text-sm text-gray-500 mb-3 pt-3 border-t">
                    <span>{post.likes_count} likes</span>
                    <span className="mx-2">•</span>
                    <span>{post.comments_count} comments</span>
                    <span className="mx-2">•</span>
                    <span>{post.shares_count} shares</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 ${post.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                    >
                      <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                      <span>Like</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Comment</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                    <button 
                      onClick={() => handleBookmark(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 ${post.is_bookmarked ? 'text-purple-600' : 'text-gray-600'}`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <p className="text-gray-500 text-lg mb-4">No posts yet!</p>
                  <p className="text-gray-400">Follow some users to see their posts here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Trending */}
          <div className="col-span-3">
            <div className="space-y-4 sticky top-24">
              {/* Trending Hashtags */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold">Trending Topics</h3>
                </div>
                <div className="space-y-3">
                  {trendingHashtags.map((hashtag, idx) => (
                    <div key={idx} className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer">
                      <p className="font-semibold text-purple-600">#{hashtag.tag}</p>
                      <p className="text-xs text-gray-500">{hashtag.count} posts</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who to Follow */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold">Who to Follow</h3>
                </div>
                <div className="space-y-3">
                  {suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={suggestedUser.profile_picture || `https://ui-avatars.com/api/?name=${suggestedUser.name}`}
                          alt={suggestedUser.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center space-x-1">
                            <p className="font-semibold text-sm">{suggestedUser.name}</p>
                            {suggestedUser.is_verified && (
                              <span className="text-blue-500 text-xs">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{suggestedUser.followers_count} followers</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleFollowUser(suggestedUser.id)}
                        className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full font-medium"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Create Post</h2>
                <button onClick={() => setShowCreatePost(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex space-x-3 mb-4">
                <img 
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`}
                  alt={user?.name}
                  className="w-12 h-12 rounded-full"
                />
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's happening? Use #hashtags to categorize..."
                  className="flex-1 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-purple-600">
                    <ImageIcon className="w-6 h-6" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-purple-600">
                    <Video className="w-6 h-6" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-purple-600">
                    <Smile className="w-6 h-6" />
                  </button>
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold">Comments</h2>
                <button onClick={() => setSelectedPost(null)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img 
                      src={comment.user_profile_picture || `https://ui-avatars.com/api/?name=${comment.user_name}`}
                      alt={comment.user_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold text-sm">{comment.user_name}</p>
                      <p className="text-gray-800">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(comment.created_at)}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>

              <div className="border-t p-4">
                <div className="flex space-x-3">
                  <img 
                    src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialFeed;
