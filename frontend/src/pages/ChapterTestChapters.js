import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Play, Target, Brain, ChevronRight, GraduationCap, MessageCircle, Heart, User } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_URL, CLASS_COLORS, DIFFICULTY_COLORS } from '../config/constants';
import MathText from '../components/MathText';
import UserAvatar from '../components/UserAvatar';

const ChapterTestChapters = () => {
  const navigate = useNavigate();
  const { classNumber, subject, stream } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  const location = window.location;
  
  // Extract class number from URL path if not in params (for class 11/12 with streams)
  const selectedClass = classNumber?.replace('class-', '') || location.pathname.match(/class-(\d+)/)?.[1] || '';
  // Format subject: handle "hindi---malhar" -> "Hindi - Malhar"
  // Triple dashes (---) become " - " (space-dash-space)
  const formattedSubject = useMemo(() => {
    if (!subject) return '';
    const lowercaseWords = ['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'or'];
    return subject
      .replace(/---/g, '|||')  // Temporarily replace triple dashes
      .replace(/-/g, ' ')      // Replace single dashes with spaces
      .replace(/\|\|\|/g, ' - ') // Restore triple dashes as " - "
      .split(' ')
      .map((word, index) => {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        // Keep lowercase words lowercase (except first word)
        if (index > 0 && lowercaseWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return capitalized;
      })
      .join(' ');
  }, [subject]);

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  
  // Academic posts state
  const [academicPosts, setAcademicPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!selectedClass || !subject) {
      setError('Invalid class or subject');
      setLoading(false);
      return;
    }
    fetchChapters();
    fetchAcademicPosts();
  }, [selectedClass, subject]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/chapter-tests/chapters`, {
        params: {
          class_param: selectedClass,
          subject: subject
        }
      });
      
      if (response.data.success) {
        setChapters(response.data.chapters || []);
      } else {
        setError('Failed to load chapters');
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setError(error.response?.data?.message || 'Failed to load chapters');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicPosts = async () => {
    try {
      setLoadingPosts(true);
      const className = `Class ${selectedClass}`;
      const response = await axios.get(`${API_URL}/api/social/academic-posts`, {
        params: {
          class_name: className,
          subject: formattedSubject,
          limit: 10
        }
      });
      
      if (response.data.success) {
        setAcademicPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching academic posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const startTest = (chapter) => {
    // Navigate to solo-practice with proper params
    const className = `Class-${selectedClass}`;
    const subjectParam = formattedSubject.toLowerCase().replace(/\s+/g, '-');
    const chapterParam = chapter.chapter_name.toLowerCase().replace(/\s+/g, '-');
    
    navigate(`/topic-quiz/${className}/${subjectParam}/${chapterParam}`, { 
      state: { 
        isClassBased: true,
        class_name: `Class ${selectedClass}`,
        subject: formattedSubject,
        chapter: chapter.chapter_name,
        chapterNumber: chapter.chapter_number
      } 
    });
  };

  const handleStartPractice = (chapter) => {
    startTest(chapter);
  };

  const handleCreateRoom = (chapter) => {
    // Format parameters for URL
    const examParam = `Class-${selectedClass}`;
    const subjectParam = formattedSubject.replace(/\s+/g, '-');
    const chapterParam = chapter.chapter_name.replace(/\s+/g, '-');
    navigate(`/create-room/${examParam}/${subjectParam}/${chapterParam}`, {
      state: {
        isClassBased: true,
        class_name: `Class ${selectedClass}`,
        subject: formattedSubject,
        chapter: chapter.chapter_name
      }
    });
  };

  const getDifficultyColor = (difficulty) => {
    const level = difficulty?.toLowerCase();
    return DIFFICULTY_COLORS[level] || DIFFICULTY_COLORS.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-96">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
            className="rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"
            aria-label="Loading chapters" 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">{error}</p>
            <button 
              onClick={() => navigate('/chapter-tests')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back to Class Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const colorGradient = CLASS_COLORS[selectedClass] || 'from-blue-600 to-teal-600';
  const totalQuestions = chapters.reduce((acc, ch) => acc + ch.total_questions, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {/* MOBILE Header - Clean & Simple */}
      <div className={`md:hidden bg-gradient-to-br ${colorGradient} text-white`}>
        <div className="px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (stream && (selectedClass === '11' || selectedClass === '12')) {
                  navigate(`/chapter-tests/class-${selectedClass}/${stream}`);
                } else {
                  navigate(`/chapter-tests/class-${selectedClass}`);
                }
              }}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">{formattedSubject}</h1>
              <p className="text-sm text-white/80">Class {selectedClass} • {chapters.length} Chapters</p>
            </div>
            <div className="w-9"></div>
          </div>
        </div>
      </div>

      {/* DESKTOP Header - Original Style */}
      <div className={`hidden md:block bg-gradient-to-br ${colorGradient} text-white py-4`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (stream && (selectedClass === '11' || selectedClass === '12')) {
                    navigate(`/chapter-tests/class-${selectedClass}/${stream}`);
                  } else {
                    navigate(`/chapter-tests/class-${selectedClass}`);
                  }
                }}
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-semibold text-sm">Back</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold">
                  Class {selectedClass}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-bold text-sm">{formattedSubject}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <BookOpen className="w-4 h-4" />
              <span className="font-bold text-sm">{chapters.length} Chapters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {chapters.length > 0 && (
          <>
            {/* MOBILE Stats & Practice Row */}
            <div className="md:hidden flex items-stretch gap-3 mb-4">
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{totalQuestions}+</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
              </div>
              <button 
                onClick={() => chapters[0] && handleStartPractice(chapters[0])} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg px-4 py-3 font-bold flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{"Let's Practice!"}</span>
              </button>
            </div>

            {/* DESKTOP Stats Bar - Original */}
            <div className="hidden md:block bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl shadow-lg">
                    <BookOpen className="w-6 h-6" />
                    <div>
                      <p className="text-2xl font-black">{totalQuestions}+</p>
                      <p className="text-xs font-semibold opacity-90">Questions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white px-5 py-3 rounded-xl shadow-lg">
                    <Target className="w-6 h-6" />
                    <div>
                      <p className="text-2xl font-black">{chapters.length}</p>
                      <p className="text-xs font-semibold opacity-90">Chapters</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-green-500 to-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
                    <Zap className="w-6 h-6" />
                    <div>
                      <p className="text-lg font-black">NCERT</p>
                      <p className="text-xs font-semibold opacity-90">Based</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => chapters[0] && handleStartPractice(chapters[0])} 
                  className={`bg-gradient-to-br ${colorGradient} text-white px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transform transition-all shadow-2xl flex items-center space-x-3`}
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>{"Let's Practice!"}</span>
                </button>
              </div>
            </div>

            {/* MOBILE Chapters List - Modern Clean Cards */}
            <div className="md:hidden space-y-3">
              {chapters.map((chapter, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Ch. {chapter.chapter_number}
                          </span>
                          {chapter.attempted && (
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              ✓ Done
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">{chapter.chapter_name}</h4>
                      </div>
                    </div>
                    
                    {/* Stats Row - Icon Based */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{chapter.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{chapter.duration}m</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(chapter.difficulty)}`}>
                        {chapter.difficulty}
                      </span>
                    </div>

                    {/* Action Buttons - Primary/Secondary */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStartPractice(chapter)} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Solo Practice</span>
                      </button>
                      <button 
                        onClick={() => handleCreateRoom(chapter)} 
                        className="flex-1 border-2 border-blue-200 text-blue-600 bg-white hover:bg-blue-50 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>Create Room</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DESKTOP Chapters Grid - Original Style */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className={`bg-gradient-to-br ${colorGradient} p-4 relative`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-white/30 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-bold">
                              Chapter {chapter.chapter_number}
                            </span>
                            {chapter.attempted && (
                              <span className="bg-green-400/30 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-bold">
                                ✓ Done
                              </span>
                            )}
                          </div>
                          <h4 className="text-white font-bold text-base drop-shadow-md">{chapter.chapter_name}</h4>
                        </div>
                        <button 
                          onClick={() => setExpandedChapters(p => ({ ...p, [idx]: !p[idx] }))}
                          className="bg-white/20 p-1 rounded hover:bg-white/30 transition-all"
                        >
                          {expandedChapters[idx] ? 
                            <ChevronUp className="w-4 h-4 text-white" /> : 
                            <ChevronDown className="w-4 h-4 text-white" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Questions</p>
                        <p className="font-bold text-blue-600 text-lg">{chapter.total_questions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-bold text-purple-600 text-lg">{chapter.duration}m</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Level</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(chapter.difficulty)}`}>
                          {chapter.difficulty}
                        </span>
                      </div>
                    </div>

                    {chapter.last_score && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Previous Score:</span>
                          <span className="text-sm font-bold text-green-600">{chapter.last_score}%</span>
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {expandedChapters[idx] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-3"
                        >
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>Test Details:</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-teal-500" />
                              <span className="text-gray-700">{chapter.total_questions} Multiple Choice Questions</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-teal-500" />
                              <span className="text-gray-700">NCERT Based Content</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-teal-500" />
                              <span className="text-gray-700">Instant Results & Analysis</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStartPractice(chapter)} 
                        className={`flex-1 bg-gradient-to-br ${colorGradient} text-white py-2 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center space-x-1 text-sm`}
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Solo Practice</span>
                      </button>
                      <button 
                        onClick={() => handleCreateRoom(chapter)} 
                        className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition-all flex items-center justify-center space-x-1 text-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>Create Room</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {chapters.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg mt-6">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No chapters available yet</p>
            <p className="text-gray-500 mt-2">Chapters will be added soon for {formattedSubject}!</p>
            <button
              onClick={() => {
                // For Class 11/12 with streams, go back to stream subjects page
                if (stream && (selectedClass === '11' || selectedClass === '12')) {
                  navigate(`/chapter-tests/class-${selectedClass}/${stream}`);
                } else {
                  // For Class 6-10, go back to general subjects page
                  navigate(`/chapter-tests/class-${selectedClass}`);
                }
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back to Subjects
            </button>
          </div>
        )}

        {/* Comprehensive Question Section - Victory Lane Posts */}
        {academicPosts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg mt-8 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Comprehensive Question</h2>
                    <p className="text-white/80 text-sm">Questions from Victory Lane for {formattedSubject}</p>
                  </div>
                </div>
                <Link 
                  to="/victory-lane"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Expert Questions
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {academicPosts.slice(0, 5).map((post) => (
                <Link 
                  key={post.id} 
                  to={`/post/${post.id}`}
                  className="block p-4 md:p-5 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex gap-3">
                    <UserAvatar
                      profilePicture={post.user_profile_picture || post.user_avatar}
                      name={post.user_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{post.user_name}</span>
                        {post.is_verified && (
                          <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                        )}
                        <span className="text-gray-500 text-xs">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Chapter Tag */}
                      {post.academic_chapter && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            📝 {post.academic_chapter}
                          </span>
                        </div>
                      )}
                      
                      {/* Question Content */}
                      <div className="text-gray-800 text-sm mb-3">
                        <MathText text={post.content} />
                      </div>
                      
                      {/* Engagement Stats */}
                      <div className="flex items-center gap-4 text-gray-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count || 0} answers
                        </span>
                        <span className="text-purple-600 font-medium ml-auto">
                          View Question →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {academicPosts.length > 5 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <Link 
                  to="/victory-lane"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View all {academicPosts.length} questions on Victory Lane →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Loading Posts */}
        {loadingPosts && academicPosts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg mt-8 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading comprehensive questions...</p>
          </div>
        )}

        {/* Why Choose Section */}
        {chapters.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mt-12 mb-12 border border-gray-700">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              🚀 Why Chapter-wise Practice?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
                <Target className="w-10 h-10 mb-3" />
                <h3 className="text-xl font-bold mb-2">Focused Learning</h3>
                <p className="text-white/90 text-sm">Master one chapter at a time with targeted practice</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
                <Zap className="w-10 h-10 mb-3" />
                <h3 className="text-xl font-bold mb-2">NCERT Aligned</h3>
                <p className="text-white/90 text-sm">All questions follow latest NCERT curriculum</p>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
                <Trophy className="w-10 h-10 mb-3" />
                <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                <p className="text-white/90 text-sm">Monitor your performance chapter by chapter</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChapterTestChapters;
