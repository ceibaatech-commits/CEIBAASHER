// Social Feed Component - Updated for path-based routing
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, MessageCircle, Share2, Send, Trophy, Users, TrendingUp, 
  Target, Sparkles, Plus, X, Copy, CheckCircle, Edit2, Trash2, AlertCircle, Search
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Quiz Room Categories
const CATEGORIES = [
  'General Knowledge',
  'Science & Technology',
  'History & Geography',
  'Entertainment & Pop Culture',
  'Sports & Games',
  'Business & Economics',
  'Arts & Literature',
  'Mathematics',
  'Language & Literature',
  'Other'
];

const SocialFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  
  // Text Post State
  const [textPostContent, setTextPostContent] = useState('');
  
  // Quiz Room State
  const [roomForm, setRoomForm] = useState({
    title: '',
    description: '',
    category: 'General Knowledge',
    privacy: 'public'
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    time_limit: 30
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCreated, setRoomCreated] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/feed/trending`);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // TEXT POST FUNCTIONS
  const handleCreateTextPost = async () => {
    if (!user) {
      alert('Please login to create posts');
      navigate('/login');
      return;
    }

    if (!textPostContent.trim()) {
      alert('Please write something!');
      return;
    }

    if (textPostContent.length > 280) {
      alert('Text posts are limited to 280 characters');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        user_id: user.id,
        user_name: user.name || user.username || 'User',
        post_type: 'general',
        content: textPostContent
      });

      if (response.data.success) {
        setTextPostContent('');
        setShowCreatePostModal(false);
        fetchFeed();
        alert('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  // QUIZ ROOM FUNCTIONS
  const handleAddQuestion = () => {
    // Validate current question
    if (!currentQuestion.question_text.trim()) {
      alert('Please enter a question');
      return;
    }

    if (!currentQuestion.option_a.trim() || !currentQuestion.option_b.trim() || 
        !currentQuestion.option_c.trim() || !currentQuestion.option_d.trim()) {
      alert('Please fill all 4 options');
      return;
    }

    if (editingIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = { ...currentQuestion };
      setQuestions(updatedQuestions);
      setEditingIndex(null);
    } else {
      // Add new question
      if (questions.length >= 100) {
        alert('Maximum 100 questions allowed per room');
        return;
      }
      setQuestions([...questions, { ...currentQuestion }]);
    }

    // Reset form
    setCurrentQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      time_limit: 30
    });
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingIndex(index);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setCurrentQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      time_limit: 30
    });
    setEditingIndex(null);
  };

  const handleCreateRoom = async () => {
    if (!user) {
      alert('Please login to create quiz rooms');
      navigate('/login');
      return;
    }

    // Validate
    if (!roomForm.title.trim()) {
      alert('Please enter a room title');
      return;
    }

    if (!roomForm.description.trim()) {
      alert('Please enter a room description');
      return;
    }

    if (questions.length < 5) {
      alert(`Minimum 5 questions required. You have ${questions.length} questions.`);
      return;
    }

    if (questions.length > 100) {
      alert('Maximum 100 questions allowed per room');
      return;
    }

    setCreatingRoom(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/quiz-rooms`, {
        user_id: user.id,
        user_name: user.name || user.username || 'User',
        title: roomForm.title,
        description: roomForm.description,
        category: roomForm.category,
        privacy: roomForm.privacy,
        questions: questions
      });

      if (response.data.success) {
        setRoomCreated({
          room_code: response.data.room_code,
          room_id: response.data.room_id
        });
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert(error.response?.data?.detail || 'Failed to create quiz room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCopyRoomCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCloseRoomModal = () => {
    setShowCreateRoomModal(false);
    setRoomForm({
      title: '',
      description: '',
      category: 'General Knowledge',
      privacy: 'public'
    });
    setQuestions([]);
    setCurrentQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      time_limit: 30
    });
    setEditingIndex(null);
    setRoomCreated(null);
  };

  const handleJoinRoom = async (roomCode, post) => {
    if (!user) {
      alert('Please login to take this quiz');
      navigate('/login');
      return;
    }

    // Check if quiz is private and user is not the host
    if (post && post.quiz_details?.privacy === 'private' && post.user_id && user.id !== post.user_id) {
      alert('This is a private quiz. Only the host can attempt it.');
      return;
    }
    
    try {
      // Fetch the quiz room details and questions
      const response = await axios.get(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}`, {
        params: {
          user_id: user.id
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        const quizData = response.data.room;
        
        // Navigate directly to the quiz (skip lobby)
        navigate(`/quiz-room/${roomCode}`, {
          state: {
            room: quizData,
            questions: quizData.questions,
            playerName: user.name || user.username,
            roomTitle: quizData.title,
            category: quizData.category
          }
        });
      }
    } catch (error) {
      console.error('Error loading quiz room:', error);
      if (error.response?.status === 404) {
        alert('Quiz room not found or has been deleted');
      } else if (error.response?.status === 410) {
        alert('This quiz has expired (24 hours elapsed)');
      } else if (error.response?.status === 403) {
        alert(error.response?.data?.detail || 'You do not have access to this quiz');
      } else {
        alert('Failed to load quiz room. Please try again.');
      }
    }
  };

  // ENGAGEMENT FUNCTIONS
  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Please login to like posts');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {
        user_id: user.id
      });
      fetchFeed();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Post/Room Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            {/* Text Post Input */}
            <input
              type="text"
              placeholder="Share something with the community..."
              value={textPostContent}
              onChange={(e) => setTextPostContent(e.target.value)}
              maxLength={280}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              onFocus={() => !user && navigate('/login')}
            />
            
            {/* Post Button */}
            <button
              onClick={handleCreateTextPost}
              disabled={!textPostContent.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
            
            {/* Create Room Button */}
            <button
              onClick={() => {
                if (!user) {
                  alert('Please login to create quiz rooms');
                  navigate('/login');
                  return;
                }
                setShowCreateRoomModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
          </div>
          
          {textPostContent && (
            <div className="mt-2 text-sm text-gray-500 text-right">
              {textPostContent.length}/280
            </div>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLikePost}
                onJoinRoom={handleJoinRoom}
                onCopyCode={handleCopyRoomCode}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {!roomCreated ? (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Create Quiz Room</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {questions.length}/100 questions {questions.length < 5 && `(Need ${5 - questions.length} more)`}
                    </p>
                  </div>
                  <button onClick={handleCloseRoomModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Room Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Room Title *</label>
                      <input
                        type="text"
                        value={roomForm.title}
                        onChange={(e) => setRoomForm({...roomForm, title: e.target.value})}
                        placeholder="e.g., Science Quiz Challenge"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={roomForm.description}
                        onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                        placeholder="Describe your quiz room..."
                        rows="3"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <select
                          value={roomForm.category}
                          onChange={(e) => setRoomForm({...roomForm, category: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Privacy</label>
                        <select
                          value={roomForm.privacy}
                          onChange={(e) => setRoomForm({...roomForm, privacy: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="public">Public</option>
                          <option value="followers_only">Followers Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Question Builder */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {editingIndex !== null ? 'Edit Question' : 'Add Question'}
                    </h3>

                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Question *</label>
                        <input
                          type="text"
                          value={currentQuestion.question_text}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                          placeholder="Enter your question..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Option A *</label>
                          <input
                            type="text"
                            value={currentQuestion.option_a}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, option_a: e.target.value})}
                            placeholder="Option A"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Option B *</label>
                          <input
                            type="text"
                            value={currentQuestion.option_b}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, option_b: e.target.value})}
                            placeholder="Option B"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Option C *</label>
                          <input
                            type="text"
                            value={currentQuestion.option_c}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, option_c: e.target.value})}
                            placeholder="Option C"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Option D *</label>
                          <input
                            type="text"
                            value={currentQuestion.option_d}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, option_d: e.target.value})}
                            placeholder="Option D"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer</label>
                          <select
                            value={currentQuestion.correct_answer}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (seconds)</label>
                          <input
                            type="number"
                            value={currentQuestion.time_limit}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, time_limit: parseInt(e.target.value) || 30})}
                            min="10"
                            max="60"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleAddQuestion}
                          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                        >
                          {editingIndex !== null ? 'Update Question' : 'Add Question'}
                        </button>
                        {editingIndex !== null && (
                          <button
                            onClick={handleCancelEdit}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  {questions.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Questions ({questions.length})</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {questions.map((q, index) => (
                          <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">
                                  {index + 1}. {q.question_text}
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div>A) {q.option_a}</div>
                                  <div>B) {q.option_b}</div>
                                  <div>C) {q.option_c}</div>
                                  <div>D) {q.option_d}</div>
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    Correct: {q.correct_answer}
                                  </span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {q.time_limit}s
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditQuestion(index)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create Room Button */}
                  <div className="border-t border-gray-200 pt-6">
                    {questions.length < 5 && (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <strong>Need more questions:</strong> Add at least {5 - questions.length} more questions to create the room.
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleCreateRoom}
                      disabled={questions.length < 5 || creatingRoom || !roomForm.title.trim() || !roomForm.description.trim()}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingRoom ? 'Creating Room...' : 'Create Quiz Room'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Success Screen
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Room Created!</h2>
                <p className="text-gray-600 mb-6">Share this code with others to join</p>
                
                <div className="inline-flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-8">
                  <div className="text-white">
                    <div className="text-sm font-medium mb-1">Room Code</div>
                    <div className="text-5xl font-bold tracking-wider">{roomCreated.room_code}</div>
                  </div>
                  <button
                    onClick={() => handleCopyRoomCode(roomCreated.room_code)}
                    className="p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all"
                  >
                    {copiedCode ? <CheckCircle className="w-6 h-6 text-white" /> : <Copy className="w-6 h-6 text-white" />}
                  </button>
                </div>

                <button
                  onClick={handleCloseRoomModal}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, onLike, onJoinRoom, onCopyCode, user }) => {
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [postingComment, setPostingComment] = React.useState(false);
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchComments = async () => {
    if (!showComments) return;
    
    setLoadingComments(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/posts/${post.id}/comments`);
      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      alert('Please login to comment');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setPostingComment(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts/${post.id}/comment`, {
        user_id: user.id,
        user_name: user.name || user.username || 'User',
        content: newComment
      });

      if (response.data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  React.useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const getPostIcon = (type) => {
    switch (type) {
      case 'quiz_room': return <Target className="w-5 h-5" />;
      case 'battle_victory': return <Trophy className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getPostBadgeColor = (type) => {
    switch (type) {
      case 'quiz_room': return 'from-green-500 to-teal-500';
      case 'battle_victory': return 'from-yellow-500 to-orange-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const isHost = user && post.user_id && user.id === post.user_id;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {post.user_name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-bold text-gray-800">{post.user_name || 'User'}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPostBadgeColor(post.post_type)} text-white text-sm font-semibold flex items-center gap-1`}>
          {getPostIcon(post.post_type)}
          {post.post_type === 'quiz_room' ? 'Quiz Room' : 
           post.post_type === 'battle_victory' ? 'Battle Victory' : 'Post'}
        </div>
      </div>

      {/* Quiz Room Card */}
      {post.post_type === 'quiz_room' && post.room_code && (
        <div className="mb-4 p-6 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl">
          {/* Room Code - Large and Prominent */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-200">
            <div>
              <div className="text-xs text-green-600 font-semibold mb-1">ROOM CODE</div>
              <div className="text-4xl font-bold text-green-700 tracking-wider">{post.room_code}</div>
            </div>
            <button
              onClick={() => onCopyCode(post.room_code)}
              className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          {post.quiz_details && (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{post.quiz_details.title}</h3>
              <p className="text-gray-600 mb-4">{post.quiz_details.description}</p>
              
              <div className="flex gap-3 mb-4">
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700">
                  📝 {post.quiz_details.question_count} Questions
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700">
                  🏷️ {post.quiz_details.category}
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700">
                  {post.quiz_details.privacy === 'public' ? '🌐 Public' : 
                   post.quiz_details.privacy === 'followers_only' ? '👥 Followers' : '🔒 Private'}
                </span>
              </div>

              <button
                onClick={() => onJoinRoom(post.room_code, post)}
                className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-teal-500 text-white hover:shadow-lg transition-all"
              >
                {post.quiz_details.privacy === 'private' && !isHost
                  ? '🔒 Private Quiz (Host Only)'
                  : 'Start Quiz 🚀'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</div>
      
      {/* Engagement Buttons */}
      <div className="flex gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-all"
        >
          <Heart className="w-5 h-5" />
          <span className="font-semibold">{post.likes_count || 0}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">{post.comments_count || 0}</span>
        </button>
        
        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-all">
          <Share2 className="w-5 h-5" />
          <span className="font-semibold">{post.shares_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Comment Input */}
          {user && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || postingComment}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4 text-gray-500">Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {comment.user_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-xl px-4 py-2">
                      <p className="font-semibold text-sm text-gray-800">{comment.user_name || 'User'}</p>
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
