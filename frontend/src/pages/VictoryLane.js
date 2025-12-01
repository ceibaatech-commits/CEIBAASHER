import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Users, 
  Clock, Trophy, Play, Send, X, Plus, AlertCircle, CheckCircle2,
  Sparkles, TrendingUp, UserPlus, Wifi, WifiOff
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSocialSocket } from '../hooks/useSocialSocket';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VictoryLane = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  
  // Quiz Room Creation State
  const [quizForm, setQuizForm] = useState({
    title: '',
    category: '',
    difficulty: 'Medium',
    timeLimit: 15,
    questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  });

  // Categories for quiz rooms
  const categories = [
    'JEE Main Physics', 'JEE Main Chemistry', 'JEE Main Mathematics',
    'NEET Biology', 'NEET Physics', 'NEET Chemistry',
    'UPSC General Studies', 'UPSC History', 'UPSC Geography',
    'SSC Reasoning', 'SSC Quantitative', 'SSC English',
    'Banking Aptitude', 'CAT Verbal', 'CAT Quant'
  ];

  // Real-time socket handlers
  const handleNewPost = useCallback((newPostData) => {
    if (activeTab === 'for-you' || activeTab === 'trending') {
      setPosts(prevPosts => {
        if (prevPosts.some(p => p.id === newPostData.id)) return prevPosts;
        return [newPostData, ...prevPosts];
      });
      toast.success('New post in feed!', { duration: 2000 });
    }
  }, [activeTab]);

  const handlePostLiked = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, likes_count: data.likes_count };
      }
      return post;
    }));
  }, []);

  const handlePostUnliked = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, likes_count: data.likes_count };
      }
      return post;
    }));
  }, []);

  const handleNewComment = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, comments_count: data.comments_count };
      }
      return post;
    }));
  }, []);

  const handleNotification = useCallback((notification) => {
    toast(notification.content, {
      icon: notification.notification_type === 'like' ? '❤️' : 
            notification.notification_type === 'comment' ? '💬' :
            notification.notification_type === 'follow' ? '👤' : '🔔',
      duration: 4000
    });
  }, []);

  // Initialize socket connection
  const { isConnected, joinFeed } = useSocialSocket(
    user?.id,
    handleNewPost,
    handlePostLiked,
    handlePostUnliked,
    handleNewComment,
    handleNotification
  );

  // Join feed room when tab changes
  useEffect(() => {
    if (isConnected) {
      joinFeed(activeTab.replace('-', '_'));
    }
  }, [activeTab, isConnected, joinFeed]);

  // Fetch feed
  useEffect(() => {
    fetchFeed();
  }, [activeTab, user]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let endpoint = `${BACKEND_URL}/api/social/feed/for-you`;
      if (activeTab === 'trending') endpoint = `${BACKEND_URL}/api/social/feed/trending`;
      if (activeTab === 'following' && user) endpoint = `${BACKEND_URL}/api/social/feed/following?user_id=${user.id}`;
      
      const response = await axios.get(endpoint);
      if (response.data.success) {
        setPosts(response.data.posts || []);
        
        // Initialize liked/bookmarked states
        const liked = new Set();
        const bookmarked = new Set();
        response.data.posts?.forEach(post => {
          if (post.user_liked) liked.add(post.id);
          if (post.user_bookmarked) bookmarked.add(post.id);
        });
        setLikedPosts(liked);
        setBookmarkedPosts(bookmarked);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle like
  const toggleLike = async (postId) => {
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
        return { ...post, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 };
      }
      return post;
    }));

    try {
      if (isLiked) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    } catch (error) {
      // Revert on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      toast.error('Failed to update like');
    }
  };

  // Toggle bookmark
  const toggleBookmark = (postId) => {
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast.success('Removed from bookmarks');
      } else {
        newSet.add(postId);
        toast.success('Added to bookmarks');
      }
      return newSet;
    });
  };

  // Create text post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'general',
        content: newPostContent,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setNewPostContent('');
        toast.success('Post created!');
        fetchFeed();
      }
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  // Create quiz room
  const handleCreateQuizRoom = async () => {
    if (quizForm.questions.filter(q => q.question.trim()).length < 5) {
      toast.error('Minimum 5 questions required');
      return;
    }

    if (!quizForm.title.trim() || !quizForm.category) {
      toast.error('Please fill in title and category');
      return;
    }

    try {
      // Create battle room with questions
      const response = await axios.post(`${BACKEND_URL}/api/battle/create-room`, {
        hostName: user?.name || 'Quiz Host',
        subject: quizForm.category,
        maxParticipants: 50,
        timePerQuestion: quizForm.timeLimit * 60 / quizForm.questions.length,
        questions: quizForm.questions.filter(q => q.question.trim()).map((q, idx) => ({
          id: `q${idx + 1}`,
          question: q.question,
          options: q.options.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt })),
          correctAnswer: String.fromCharCode(97 + q.correctAnswer)
        }))
      });

      if (response.data.success) {
        // Also create a social post about the quiz room
        await axios.post(`${BACKEND_URL}/api/social/posts`, {
          post_type: 'quiz_room',
          content: `Created a new quiz room: ${quizForm.title}`,
          user_id: user.id,
          quiz_data: {
            title: quizForm.title,
            category: quizForm.category,
            difficulty: quizForm.difficulty,
            questions_count: quizForm.questions.filter(q => q.question.trim()).length,
            room_code: response.data.roomId,
            time_limit: quizForm.timeLimit
          }
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setShowQuizModal(false);
        setQuizForm({
          title: '',
          category: '',
          difficulty: 'Medium',
          timeLimit: 15,
          questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
        });
        toast.success(`Quiz room created! PIN: ${response.data.roomId}`);
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating quiz room:', error);
      toast.error('Failed to create quiz room');
    }
  };

  // Update question in form
  const updateQuestion = (index, field, value) => {
    setQuizForm(prev => {
      const newQuestions = [...prev.questions];
      if (field === 'question') {
        newQuestions[index] = { ...newQuestions[index], question: value };
      } else if (field.startsWith('option')) {
        const optIdx = parseInt(field.replace('option', ''));
        const newOptions = [...newQuestions[index].options];
        newOptions[optIdx] = value;
        newQuestions[index] = { ...newQuestions[index], options: newOptions };
      } else if (field === 'correctAnswer') {
        newQuestions[index] = { ...newQuestions[index], correctAnswer: value };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  // Add more questions
  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Hard': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Easy': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get gradient color for quiz room
  const getGradientColor = (category) => {
    if (category?.includes('Physics')) return '#8B5CF6';
    if (category?.includes('Chemistry')) return '#10B981';
    if (category?.includes('Mathematics') || category?.includes('Math')) return '#3B82F6';
    if (category?.includes('Biology')) return '#EC4899';
    if (category?.includes('History')) return '#F59E0B';
    if (category?.includes('Geography')) return '#14B8A6';
    return '#6366F1';
  };

  // Format timestamp
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

  // Join quiz room
  const handleJoinRoom = (roomCode) => {
    navigate(`/battle-lobby/${roomCode}`, { 
      state: { playerName: user?.name || 'Player', isHost: false }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Twitter-like Sticky Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Victory Lane</h1>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-3 -mb-px">
            {[
              { id: 'for-you', label: 'For You', icon: Sparkles },
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'following', label: 'Following', icon: UserPlus }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Create Post Section */}
        {user ? (
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your study wins, tips, or create a quiz room..."
                  className="w-full text-lg border-none outline-none resize-none min-h-[60px] placeholder-gray-400"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowQuizModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium hover:from-purple-200 hover:to-blue-200 transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Create Quiz Room
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Join the Victory Lane!</h3>
            <p className="text-white/80 mb-4">Share your wins, create quiz rooms, and compete with others</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Login to Participate
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          /* Feed Posts */
          <div className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white p-4 hover:bg-gray-50 transition">
                  <div className="flex gap-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {post.user_name?.charAt(0).toUpperCase() || post.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* User Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 hover:underline cursor-pointer">
                          {post.user_name || post.username || 'Anonymous'}
                        </span>
                        {post.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                        )}
                        <span className="text-gray-500 text-sm">@{post.username || 'user'}</span>
                        <span className="text-gray-500 text-sm">· {formatTimestamp(post.created_at)}</span>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-900 mt-1 mb-3 whitespace-pre-wrap">{post.content}</p>

                      {/* Quiz Room Card */}
                      {(post.post_type === 'quiz_room' || post.quiz_data) && post.quiz_data && (
                        <div 
                          className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition mt-3"
                          style={{ borderColor: `${getGradientColor(post.quiz_data.category)}40` }}
                        >
                          <div 
                            className="h-28 flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${getGradientColor(post.quiz_data.category)} 0%, ${getGradientColor(post.quiz_data.category)}cc 100%)` }}
                          >
                            <Trophy className="w-12 h-12 text-white opacity-80" />
                          </div>
                          <div className="p-4 bg-white">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {post.quiz_data.title || 'Quiz Room'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">{post.quiz_data.category}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Play className="w-4 h-4" />
                                <span>{post.quiz_data.questions_count || post.quiz_data.question_count || 5} questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{post.quiz_data.participants || 0} playing</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{post.quiz_data.time_limit || 15} min</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(post.quiz_data.difficulty || 'Medium')}`}>
                                {post.quiz_data.difficulty || 'Medium'}
                              </span>
                              <button 
                                onClick={() => handleJoinRoom(post.quiz_data.room_code)}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition"
                              >
                                Join Room
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Battle Result Card */}
                      {post.post_type === 'battle_victory' && post.battle_data && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            <span className="font-bold text-yellow-700">Battle Victory!</span>
                          </div>
                          <p className="text-gray-700">
                            Won against {post.battle_data.opponent} with score {post.battle_data.score}
                          </p>
                        </div>
                      )}

                      {/* Quiz Result Card */}
                      {post.post_type === 'quiz_result' && post.quiz_result && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-700">Quiz Completed!</span>
                          </div>
                          <p className="text-gray-700">
                            Score: {post.quiz_result.score}/{post.quiz_result.total} ({post.quiz_result.percentage}%)
                          </p>
                        </div>
                      )}

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between mt-4 max-w-md">
                        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition group">
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{post.comments_count || 0}</span>
                        </button>

                        <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition group">
                          <div className="p-2 rounded-full group-hover:bg-green-50 transition">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{post.shares_count || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-2 transition group ${
                            likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-50 transition">
                            <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-sm font-medium">{post.likes_count || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleBookmark(post.id)}
                          className={`p-2 rounded-full transition ${
                            bookmarkedPosts.has(post.id) ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className={`w-5 h-5 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quiz Creation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Quiz Room</h2>
              <button
                onClick={() => setShowQuizModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-5">
                {/* Quiz Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Thermodynamics Masterclass"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={quizForm.category}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={quizForm.difficulty}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 15 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Minimum 5 questions required</span> to create a quiz room
                  </p>
                </div>

                {/* Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Questions ({quizForm.questions.filter(q => q.question.trim()).length}/5 minimum)
                  </label>
                  <div className="space-y-4">
                    {quizForm.questions.map((q, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                        <p className="text-sm font-medium text-gray-500 mb-2">Question {idx + 1}</p>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="Enter your question..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                            <input
                              key={opt}
                              type="text"
                              value={q.options[optIdx]}
                              onChange={(e) => updateQuestion(idx, `option${optIdx}`, e.target.value)}
                              placeholder={`Option ${opt}`}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ))}
                        </div>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(idx, 'correctAnswer', parseInt(e.target.value))}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Correct: Option A</option>
                          <option value={1}>Correct: Option B</option>
                          <option value={2}>Correct: Option C</option>
                          <option value={3}>Correct: Option D</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addQuestion}
                    className="mt-3 text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Questions
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex gap-4">
              <button
                onClick={() => setShowQuizModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuizRoom}
                disabled={quizForm.questions.filter(q => q.question.trim()).length < 5 || !quizForm.title.trim() || !quizForm.category}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default VictoryLane;
