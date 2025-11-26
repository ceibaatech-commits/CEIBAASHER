import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, MessageCircle, Share2, Send, Gift, Swords, Trophy, 
  Users, TrendingUp, UserPlus, Target, Sparkles, Play, Crown,
  Star, Diamond, Award, Bell, Plus, Image, Video, Smile, X
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SocialFeed = () => {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showMCQBrowser, setShowMCQBrowser] = useState(false);
  const [mcqList, setMcqList] = useState([]);
  const [selectedMCQ, setSelectedMCQ] = useState(null);
  const [mcqMode, setMcqMode] = useState('browse'); // 'browse' or 'create'
  const [examList, setExamList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [topicList, setTopicList] = useState([]);
  const [mcqFilters, setMcqFilters] = useState({ exam: '', subject: '', topic: '' });
  const [manualMCQ, setManualMCQ] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    subject: '',
    exam: ''
  });
  const [showQuizRoomModal, setShowQuizRoomModal] = useState(false);
  const [quizRoomData, setQuizRoomData] = useState({
    title: '',
    description: '',
    category: '',
    privacy: 'public',
    selectedQuestions: []
  });
  const [newPost, setNewPost] = useState({
    post_type: 'general',
    content: '',
    exam_category: '',
    subject: '',
    room_code: ''
  });

  // Fetch feed based on active tab
  useEffect(() => {
    fetchFeed();
  }, [activeTab, user]);

  const fetchFeed = async () => {
    if (!user) {
      // Allow viewing without login
      setLoading(false);
      // Fetch public trending feed
      try {
        const response = await axios.get(`${BACKEND_URL}/api/social/feed/trending`);
        if (response.data.success) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
      }
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'for-you':
          endpoint = `/feed/for-you?user_id=${user.id}`;
          break;
        case 'trending':
          endpoint = '/feed/trending';
          break;
        case 'following':
          endpoint = `/feed/following?user_id=${user.id}`;
          break;
        case 'leaderboard':
          endpoint = '/feed/leaderboard';
          break;
        case 'my-circle':
          endpoint = `/feed/my-circle?user_id=${user.id}`;
          break;
        default:
          endpoint = `/feed/for-you?user_id=${user.id}`;
      }

      const response = await axios.get(`${BACKEND_URL}/api/social${endpoint}`);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId, currentlyLiked) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (currentlyLiked) {
        await axios.delete(
          `${BACKEND_URL}/api/social/posts/${postId}/like?user_id=${user.id}`
        );
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {
          user_id: user.id
        });
      }

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user: !currentlyLiked,
            likes_count: currentlyLiked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, content) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts/${postId}/comment`,
        {
          user_id: user.id,
          content
        }
      );

      if (response.data.success) {
        // Update comments count
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const handleShare = async (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/share`, {
        user_id: user.id
      });

      // Update shares count
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            shares_count: post.shares_count + 1
          };
        }
        return post;
      }));

      alert('Post shared!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleMCQAttempt = async (postId, answer) => {
    // This is handled inside MCQCard component
    console.log('MCQ attempt:', postId, answer);
  };

  const fetchExamList = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/mcq/exams`);
      if (response.data.success) {
        setExamList(response.data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchSubjects = async (exam) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/mcq/subjects?exam=${encodeURIComponent(exam)}`);
      if (response.data.success) {
        setSubjectList(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTopics = async (exam, subject) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/mcq/topics?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}`);
      if (response.data.success) {
        setTopicList(response.data.topics);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const browseMCQs = async () => {
    try {
      const params = new URLSearchParams();
      if (mcqFilters.exam) params.append('exam', mcqFilters.exam);
      if (mcqFilters.subject) params.append('subject', mcqFilters.subject);
      if (mcqFilters.topic) params.append('topic', mcqFilters.topic);
      params.append('limit', '50');

      const response = await axios.get(`${BACKEND_URL}/api/social/mcq/browse?${params.toString()}`);
      if (response.data.success) {
        setMcqList(response.data.questions);
      }
    } catch (error) {
      console.error('Error browsing MCQs:', error);
    }
  };

  const postSelectedMCQ = async (questionId, caption) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/social/mcq/post?question_id=${questionId}${caption ? `&caption=${encodeURIComponent(caption)}` : ''}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowMCQBrowser(false);
        setSelectedMCQ(null);
        fetchFeed(); // Refresh feed
        alert('MCQ posted successfully!');
      }
    } catch (error) {
      console.error('Error posting MCQ:', error);
      alert('Failed to post MCQ');
    }
  };

  const postManualMCQ = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Validation
    if (!manualMCQ.question.trim()) {
      alert('Please enter a question');
      return;
    }
    if (!manualMCQ.optionA || !manualMCQ.optionB || !manualMCQ.optionC || !manualMCQ.optionD) {
      alert('Please fill all 4 options');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const mcqData = {
        question: manualMCQ.question,
        options: [manualMCQ.optionA, manualMCQ.optionB, manualMCQ.optionC, manualMCQ.optionD],
        correct_answer: manualMCQ.correctAnswer,
        explanation: manualMCQ.explanation,
        subject: manualMCQ.subject,
        exam: manualMCQ.exam
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts`,
        {
          post_type: 'mcq',
          content: newPost.content || 'Test your knowledge! 🧠',
          mcq_data: mcqData,
          exam_category: manualMCQ.exam,
          subject: manualMCQ.subject,
          tags: [manualMCQ.exam, manualMCQ.subject].filter(Boolean)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowMCQBrowser(false);
        setManualMCQ({
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
          explanation: '',
          subject: '',
          exam: ''
        });
        fetchFeed();
        alert('MCQ posted successfully!');
      }
    } catch (error) {
      console.error('Error posting manual MCQ:', error);
      alert('Failed to post MCQ');
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // For MCQ posts, use the dedicated endpoint
    if (newPost.post_type === 'mcq') {
      if (!selectedMCQ) {
        alert('Please select an MCQ question');
        return;
      }
      await postSelectedMCQ(selectedMCQ.id, newPost.content);
      setShowCreatePost(false);
      setSelectedMCQ(null);
      setNewPost({
        post_type: 'general',
        content: '',
        exam_category: '',
        subject: '',
        room_code: ''
      });
      return;
    }

    if (!newPost.content.trim()) {
      alert('Please enter post content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts`,
        newPost,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowCreatePost(false);
        setNewPost({
          post_type: 'general',
          content: '',
          exam_category: '',
          subject: '',
          room_code: ''
        });
        fetchFeed(); // Refresh feed
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const MCQCard = ({ post, user, onAttempt }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [attempted, setAttempted] = useState(false);
    const [result, setResult] = useState(null);
    const [stats, setStats] = useState({ attempt_count: post.attempt_count || 0, success_rate: 0 });

    const mcqData = post.mcq_data || {};
    const options = mcqData.options || [];
    const optionLabels = ['A', 'B', 'C', 'D'];

    const handleAttempt = async (answer) => {
      if (attempted || !user) return;
      
      setSelectedAnswer(answer);
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${BACKEND_URL}/api/social/mcq/attempt?post_id=${post.id}&selected_answer=${answer}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAttempted(true);
        setResult(response.data);
        
        // Fetch updated stats
        const statsResponse = await axios.get(`${BACKEND_URL}/api/social/mcq/stats/${post.id}`);
        setStats(statsResponse.data.stats);
      } catch (error) {
        console.error('Error attempting MCQ:', error);
        if (error.response?.data?.message === "Already attempted") {
          setAttempted(true);
          setResult({
            is_correct: error.response.data.is_correct,
            correct_answer: error.response.data.correct_answer,
            explanation: error.response.data.explanation
          });
        }
      }
    };

    return (
      <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200">
        <h4 className="font-bold text-indigo-900 mb-3">🧠 Test Your Knowledge</h4>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-gray-900 font-medium mb-4">{mcqData.question}</p>
          
          <div className="space-y-2">
            {options.map((option, index) => {
              const label = optionLabels[index];
              const isSelected = selectedAnswer === label;
              const isCorrect = result && result.correct_answer === label;
              const isWrong = attempted && isSelected && !result?.is_correct;
              
              return (
                <button
                  key={index}
                  onClick={() => !attempted && handleAttempt(label)}
                  disabled={attempted || !user}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isCorrect && attempted
                      ? 'border-green-500 bg-green-50'
                      : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  } ${attempted || !user ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center">
                    <span className="font-bold text-indigo-600 mr-3">{label}.</span>
                    <span className="text-gray-800">{option}</span>
                    {isCorrect && attempted && <span className="ml-auto text-green-600">✓</span>}
                    {isWrong && <span className="ml-auto text-red-600">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {attempted && result && (
          <div className={`p-4 rounded-lg mb-3 ${
            result.is_correct ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <p className={`font-bold mb-2 ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
            {result.explanation && (
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">Explanation:</span> {result.explanation}
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex gap-4">
            <span>👥 {stats.attempt_count} attempts</span>
            <span>✅ {stats.success_rate}% success rate</span>
          </div>
          {mcqData.subject && (
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
              {mcqData.subject}
            </span>
          )}
        </div>
      </div>
    );
  };

  const PostCard = ({ post }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showGiftModal, setShowGiftModal] = useState(false);

    const handleSendGift = async (giftType) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        await axios.post(`${BACKEND_URL}/api/social/posts/${post.id}/gift`, {
          user_id: user.id,
          gift_type: giftType
        });
        setShowGiftModal(false);
        alert(`${giftType} sent successfully!`);
      } catch (error) {
        console.error('Error sending gift:', error);
        alert(error.response?.data?.detail || 'Failed to send gift');
      }
    };

    const handleChallenge = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        await axios.post(`${BACKEND_URL}/api/social/posts/${post.id}/challenge`, {
          user_id: user.id,
          subject: post.subject || 'General',
          topic: 'Challenge'
        });
        alert('Challenge sent!');
      } catch (error) {
        console.error('Error sending challenge:', error);
        alert(error.response?.data?.detail || 'Failed to send challenge');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
        {/* User Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
              {post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900">{post.user_name}</h3>
                {post.user_verified && (
                  <span className="text-blue-500">
                    {post.user_verified_type === 'educator' && '✓'}
                    {post.user_verified_type === 'institution' && '🎓'}
                    {post.user_verified_type === 'government' && '🏛️'}
                    {post.user_verified_type === 'expert' && '⭐'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {post.user_location && `${post.user_location} • `}
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          
          {/* MCQ Card */}
          {post.post_type === 'mcq' && post.mcq_data && (
            <MCQCard 
              post={post} 
              user={user} 
              onAttempt={(postId, answer) => handleMCQAttempt(postId, answer)}
            />
          )}

          {/* Quiz Result Card */}
          {post.post_type === 'quiz_result' && post.battle_stats && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-bold text-green-900 mb-3">📊 Quiz Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                {post.battle_stats.accuracy !== undefined && (
                  <div><span className="text-gray-600">Score:</span> <span className="font-bold text-green-700">{post.battle_stats.accuracy}%</span></div>
                )}
                {post.battle_stats.correct_answers !== undefined && (
                  <div><span className="text-gray-600">Correct:</span> <span className="font-bold">{post.battle_stats.correct_answers}/{post.battle_stats.total_questions}</span></div>
                )}
                {post.battle_stats.rank && (
                  <div><span className="text-gray-600">Rank:</span> <span className="font-bold text-purple-600">#{post.battle_stats.rank}</span></div>
                )}
                {post.battle_stats.subject && (
                  <div><span className="text-gray-600">Subject:</span> <span className="font-bold">{post.battle_stats.subject}</span></div>
                )}
                {post.battle_stats.time_taken && (
                  <div><span className="text-gray-600">Time:</span> <span className="font-bold">{post.battle_stats.time_taken}</span></div>
                )}
              </div>
              <button 
                onClick={() => {
                  const quizDetails = post.quiz_details;
                  if (quizDetails) {
                    navigate(`/quiz-selection`, {
                      state: { 
                        exam: post.exam_category,
                        subject: post.subject
                      }
                    });
                  }
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Challenge This Quiz
              </button>
            </div>
          )}

          {/* Battle Stats Card */}
          {post.post_type === 'battle_victory' && post.battle_stats && (
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">🏆 Battle Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {post.battle_stats.accuracy && (
                  <div><span className="text-gray-600">Accuracy:</span> <span className="font-bold">{post.battle_stats.accuracy}%</span></div>
                )}
                {post.battle_stats.winStreak && (
                  <div><span className="text-gray-600">Win Streak:</span> <span className="font-bold">{post.battle_stats.winStreak}</span></div>
                )}
                {post.battle_stats.rank && (
                  <div><span className="text-gray-600">Rank:</span> <span className="font-bold">#{post.battle_stats.rank}</span></div>
                )}
                {post.battle_stats.subject && (
                  <div><span className="text-gray-600">Subject:</span> <span className="font-bold">{post.battle_stats.subject}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Quiz Announcement Card */}
          {post.post_type === 'quiz_announcement' && post.quiz_details && (
            <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-bold text-orange-900 mb-2">📚 {post.quiz_details.title}</h4>
              <div className="text-sm space-y-1 mb-3">
                {post.quiz_details.time && (
                  <p><span className="text-gray-600">⏰ Time:</span> {post.quiz_details.time}</p>
                )}
                {post.quiz_details.maxStudents && (
                  <p><span className="text-gray-600">👥 Max Students:</span> {post.quiz_details.maxStudents}</p>
                )}
                {post.quiz_details.difficulty && (
                  <p><span className="text-gray-600">🎯 Difficulty:</span> {post.quiz_details.difficulty}</p>
                )}
                {post.quiz_details.pin && (
                  <p><span className="text-gray-600">🔑 PIN:</span> <span className="font-mono font-bold">{post.quiz_details.pin}</span></p>
                )}
              </div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                <Play className="inline w-4 h-4 mr-2" />
                Join Now
              </button>
            </div>
          )}

          {/* Room Code Card */}
          {post.post_type === 'room_code' && post.room_code && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">🎮 Join Battle Room</h4>
              <div className="text-sm mb-3">
                <p className="text-gray-600 mb-2">Room Code:</p>
                <p className="text-3xl font-black text-green-600 tracking-widest">{post.room_code}</p>
              </div>
              <button 
                onClick={() => navigate(`/battle-lobby/${post.room_code}`, {
                  state: { autoJoin: true }
                })}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors w-full"
              >
                <Play className="inline w-4 h-4 mr-2" />
                Join Battle Now
              </button>
            </div>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-4">
              {post.media_urls.map((url, index) => (
                <img key={index} src={url} alt="Post media" className="rounded-lg w-full" />
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Engagement Buttons */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <button
            onClick={() => handleLikePost(post.id, post.liked_by_user)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              post.liked_by_user
                ? 'text-red-500 bg-red-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.liked_by_user ? 'fill-current' : ''}`} />
            <span className="font-semibold">{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">{post.comments_count || 0}</span>
          </button>

          <button
            onClick={() => handleShare(post.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-semibold">{post.shares_count || 0}</span>
          </button>

          <button
            onClick={() => setShowGiftModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Gift className="w-5 h-5" />
          </button>

          {post.post_type === 'battle_victory' && (
            <button
              onClick={handleChallenge}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Swords className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    handleComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Gift Modal */}
        {showGiftModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Send a Gift 🎁</h3>
                <button onClick={() => setShowGiftModal(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSendGift('star')}
                  className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-2">⭐</div>
                  <div className="font-bold">Star</div>
                  <div className="text-sm text-gray-600">10 coins</div>
                </button>

                <button
                  onClick={() => handleSendGift('diamond')}
                  className="bg-gradient-to-br from-blue-100 to-cyan-200 p-4 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-2">💎</div>
                  <div className="font-bold">Diamond</div>
                  <div className="text-sm text-gray-600">50 coins</div>
                </button>

                <button
                  onClick={() => handleSendGift('crown')}
                  className="bg-gradient-to-br from-purple-100 to-pink-200 p-4 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-2">👑</div>
                  <div className="font-bold">Crown</div>
                  <div className="text-sm text-gray-600">100 coins</div>
                </button>

                <button
                  onClick={() => handleSendGift('trophy')}
                  className="bg-gradient-to-br from-amber-100 to-orange-200 p-4 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="font-bold">Trophy</div>
                  <div className="text-sm text-gray-600">200 coins</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} logout={logout} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Feed Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'for-you'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'trending'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('following')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'following'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>Following</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('my-circle')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'my-circle'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Target className="w-5 h-5" />
            <span>My Circle</span>
          </button>
        </div>

        {/* Create Post Button */}
        {user && (
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold mb-6 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Post</span>
          </button>
        )}

        {/* Guest Banner - Only show if not loading and user is not logged in */}
        {!authLoading && !user && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 mb-6 text-center">
            <h3 className="text-xl font-bold mb-2">Join Ceibaa Social 🚀</h3>
            <p className="mb-4">Connect with learners, share your achievements, and grow together!</p>
            <button
              onClick={() => navigate('/login', { state: { from: '/social-feed' } })}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Login to Continue
            </button>
          </div>
        )}

        {/* Feed Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Create Post</h3>
                <button onClick={() => setShowCreatePost(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={newPost.post_type}
                    onChange={(e) => setNewPost({ ...newPost, post_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="general">General</option>
                    <option value="mcq">MCQ Question</option>
                    <option value="battle_victory">Battle Victory</option>
                    <option value="study_tip">Study Tip</option>
                    <option value="achievement">Achievement</option>
                    <option value="quiz_announcement">Quiz Announcement</option>
                    <option value="room_code">Share Room Code</option>
                  </select>
                </div>

                {/* MCQ Browser Button (only shown when post type is mcq) */}
                {newPost.post_type === 'mcq' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMCQBrowser(true);
                        setMcqMode('browse');
                        if (examList.length === 0) fetchExamList();
                      }}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all"
                    >
                      🔍 Browse & Post MCQ
                    </button>
                    {selectedMCQ && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800">Selected Question:</p>
                        <p className="text-sm text-gray-700 mt-1">{selectedMCQ.question.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Room Code Input (only shown when post type is room_code) */}
                {newPost.post_type === 'room_code' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Code
                    </label>
                    <input
                      type="text"
                      value={newPost.room_code || ''}
                      onChange={(e) => setNewPost({ ...newPost, room_code: e.target.value.toUpperCase() })}
                      placeholder="Enter 6-digit room code"
                      maxLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-2xl tracking-widest text-center"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's on your mind?"
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Category
                    </label>
                    <select
                      value={newPost.exam_category}
                      onChange={(e) => setNewPost({ ...newPost, exam_category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select...</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="SSC">SSC</option>
                      <option value="UPSC">UPSC</option>
                      <option value="Banking">Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newPost.subject}
                      onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                      placeholder="Physics, Chemistry, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreatePost}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MCQ Browser/Creator Modal */}
      {showMCQBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">📚 Post an MCQ Question</h3>
              <button onClick={() => setShowMCQBrowser(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => {
                  setMcqMode('browse');
                  if (examList.length === 0) fetchExamList();
                }}
                className={`pb-3 px-4 font-semibold transition-all ${
                  mcqMode === 'browse'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔍 Browse Database
              </button>
              <button
                onClick={() => setMcqMode('create')}
                className={`pb-3 px-4 font-semibold transition-all ${
                  mcqMode === 'create'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✍️ Create Your Own
              </button>
            </div>

            {/* Browse Database Mode */}
            {mcqMode === 'browse' && (
              <>
                {/* Dropdown Filters */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <select
                    value={mcqFilters.exam}
                    onChange={(e) => {
                      setMcqFilters({ exam: e.target.value, subject: '', topic: '' });
                      setSubjectList([]);
                      setTopicList([]);
                      if (e.target.value) fetchSubjects(e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Exam</option>
                    {examList.map(exam => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>

                  <select
                    value={mcqFilters.subject}
                    onChange={(e) => {
                      setMcqFilters({ ...mcqFilters, subject: e.target.value, topic: '' });
                      setTopicList([]);
                      if (e.target.value) fetchTopics(mcqFilters.exam, e.target.value);
                    }}
                    disabled={!mcqFilters.exam}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Subject</option>
                    {subjectList.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>

                  <select
                    value={mcqFilters.topic}
                    onChange={(e) => setMcqFilters({ ...mcqFilters, topic: e.target.value })}
                    disabled={!mcqFilters.subject}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Chapter</option>
                    {topicList.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>

                  <button
                    onClick={browseMCQs}
                    disabled={!mcqFilters.exam}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
                  >
                    Search
                  </button>
                </div>

                {/* MCQ List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mcqList.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Select exam and click Search to see questions</p>
                  ) : (
                    mcqList.map((mcq) => (
                      <div
                        key={mcq.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMCQ?.id === mcq.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => setSelectedMCQ(mcq)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium mb-2">{mcq.question}</p>
                            <div className="flex gap-2 text-xs">
                              {mcq.exam_name && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{mcq.exam_name}</span>
                              )}
                              {mcq.subject && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{mcq.subject}</span>
                              )}
                            </div>
                          </div>
                          {selectedMCQ?.id === mcq.id && (
                            <span className="text-indigo-600 font-bold ml-3">✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Post Button */}
                {selectedMCQ && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowMCQBrowser(false);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all"
                    >
                      Select This Question
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Create Your Own Mode */}
            {mcqMode === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question *</label>
                  <textarea
                    value={manualMCQ.question}
                    onChange={(e) => setManualMCQ({ ...manualMCQ, question: e.target.value })}
                    placeholder="Enter your question here..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Option A *</label>
                    <input
                      type="text"
                      value={manualMCQ.optionA}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, optionA: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Option B *</label>
                    <input
                      type="text"
                      value={manualMCQ.optionB}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, optionB: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Option C *</label>
                    <input
                      type="text"
                      value={manualMCQ.optionC}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, optionC: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Option D *</label>
                    <input
                      type="text"
                      value={manualMCQ.optionD}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, optionD: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer *</label>
                    <select
                      value={manualMCQ.correctAnswer}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, correctAnswer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject (Optional)</label>
                    <input
                      type="text"
                      value={manualMCQ.subject}
                      onChange={(e) => setManualMCQ({ ...manualMCQ, subject: e.target.value })}
                      placeholder="e.g., Physics, Math"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation (Optional)</label>
                  <textarea
                    value={manualMCQ.explanation}
                    onChange={(e) => setManualMCQ({ ...manualMCQ, explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={postManualMCQ}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all"
                >
                  Post MCQ
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

export default SocialFeed;