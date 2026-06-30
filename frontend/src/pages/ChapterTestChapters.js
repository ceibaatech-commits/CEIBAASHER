import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Play, Target, Brain, ChevronRight, GraduationCap, MessageCircle, Heart, User } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { API_URL, CLASS_COLORS, DIFFICULTY_COLORS } from '../config/constants';
import MathText from '../components/MathText';
import UserAvatar from '../components/UserAvatar';

const ChapterTestChapters = () => {
  const navigate = useNavigate();
  const { classNumber, subject, stream } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  const location = window.location;
  const board = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardLabel = board === 'rbse' ? 'Rajasthan Board' : board === 'hbse' ? 'Haryana Board' : board === 'upboard' ? 'UP Board' : board === 'bseb' ? 'Bihar Board' : board === 'mpbse' ? 'MP Board' : 'CBSE';
  const boardQuery = `?board=${board}`;
  
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
  // eslint-disable-next-line
  }, [selectedClass, subject, board]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/chapter-tests/chapters`, {
        params: {
          class_param: selectedClass,
          subject: subject,
          board
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
        chapterNumber: chapter.chapter_number,
        stream: stream, // Include stream for Class 11/12
        board
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
        chapter: chapter.chapter_name,
        stream: stream, // Include stream for Class 11/12
        board
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
              onClick={() => navigate(`/chapter-tests${boardQuery}`)}
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

  const subjectDisplay = subject ? subject.replace(/---/g, ' - ').replace(/-/g, ' ') : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={`Class ${selectedClass} ${subjectDisplay} - Free Chapter-wise MCQs`}
        description={`Practice free chapter-wise MCQs for ${boardLabel} Class ${selectedClass} ${subjectDisplay}. Solve chapter-based questions with instant results and detailed solutions.`}
        keywords={`class ${selectedClass} ${subjectDisplay} mcq, class ${selectedClass} ${subjectDisplay} solutions, ${boardLabel.toLowerCase()} chapter wise test`}
        canonical={`https://ceibaa.in/chapter-tests/${classNumber}/${subject}`}
      />
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
                    navigate(`/chapter-tests/class-${selectedClass}/${stream}${boardQuery}`);
                } else {
                    navigate(`/chapter-tests/class-${selectedClass}${boardQuery}`);
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

      {/* DESKTOP Header — Clean light breadcrumb (no loud gradient slab) */}
      <div className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  if (stream && (selectedClass === '11' || selectedClass === '12')) {
                    navigate(`/chapter-tests/class-${selectedClass}/${stream}${boardQuery}`);
                  } else {
                    navigate(`/chapter-tests/class-${selectedClass}${boardQuery}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                {boardLabel} · Class {selectedClass}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-semibold text-slate-900 truncate">{formattedSubject}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <BookOpen className="w-4 h-4 text-violet-600" />
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>
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

            {/* DESKTOP Stats Bar — Clean neutral strip with single primary CTA */}
            <div className="hidden md:flex items-center justify-between gap-6 bg-white rounded-2xl border border-slate-200 px-6 py-5 mb-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center divide-x divide-slate-100">
                <div className="pr-8">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                    <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                    Questions
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
                    {totalQuestions}<span className="text-slate-400 text-base">+</span>
                  </p>
                </div>
                <div className="px-8">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                    <Target className="w-3.5 h-3.5 text-violet-600" />
                    Chapters
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{chapters.length}</p>
                </div>
                <div className="pl-8">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-violet-600" />
                    Curriculum
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">NCERT</p>
                </div>
              </div>
              <button
                onClick={() => chapters[0] && handleStartPractice(chapters[0])}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(124,58,237,0.55)]"
                data-testid="chapters-lets-practice"
              >
                <Play className="w-4 h-4 fill-white" />
                Let&apos;s Practice
              </button>
            </div>

            {/* MOBILE Chapters List - Modern Clean Cards */}
            <div className="md:hidden space-y-3">
              {chapters.map((chapter, idx) => (
                <motion.div 
                  key={chapter.chapter_number || chapter.chapter_name || `ch-m-${idx}`} 
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

            {/* DESKTOP Chapters Grid — Clean white cards, single brand accent */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {chapters.map((chapter, idx) => (
                <motion.div
                  key={chapter.chapter_number || chapter.chapter_name || `ch-d-${idx}`}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-violet-200 hover:shadow-[0_18px_40px_-20px_rgba(124,58,237,0.32)] transition-all overflow-hidden"
                  data-testid={`chapter-card-${chapter.chapter_number}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                            Chapter {chapter.chapter_number}
                          </span>
                          {chapter.attempted && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 text-[15px] leading-snug line-clamp-2" style={{ letterSpacing: '-0.01em' }}>
                          {chapter.chapter_name}
                        </h4>
                      </div>
                      <button
                        onClick={() => setExpandedChapters(p => ({ ...p, [idx]: !p[idx] }))}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        aria-label={expandedChapters[idx] ? 'Collapse details' : 'Expand details'}
                      >
                        {expandedChapters[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-slate-100">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Questions</p>
                        <p className="font-semibold text-slate-900 text-base tabular-nums mt-0.5">{chapter.total_questions}</p>
                      </div>
                      <div className="text-center border-x border-slate-100">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Duration</p>
                        <p className="font-semibold text-slate-900 text-base tabular-nums mt-0.5">{chapter.duration}m</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Level</p>
                        <span className={`mt-0.5 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(chapter.difficulty)}`}>
                          {chapter.difficulty}
                        </span>
                      </div>
                    </div>

                    {chapter.last_score && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 mb-3 flex items-center justify-between">
                        <span className="text-xs text-emerald-700 font-medium">Last score</span>
                        <span className="text-sm font-semibold text-emerald-700 tabular-nums">{chapter.last_score}%</span>
                      </div>
                    )}

                    <AnimatePresence>
                      {expandedChapters[idx] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-slate-700">
                              <CheckCircle className="w-3 h-3 text-violet-600 shrink-0" />
                              <span>{chapter.total_questions} Multiple Choice Questions</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-700">
                              <CheckCircle className="w-3 h-3 text-violet-600 shrink-0" />
                              <span>NCERT-based syllabus</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-700">
                              <CheckCircle className="w-3 h-3 text-violet-600 shrink-0" />
                              <span>Instant results & detailed analysis</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartPractice(chapter)}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all text-white py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-[0_6px_18px_-6px_rgba(124,58,237,0.55)]"
                        data-testid={`solo-practice-btn-${chapter.chapter_number}`}
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Solo Practice
                      </button>
                      <button
                        onClick={() => handleCreateRoom(chapter)}
                        className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-slate-700 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                        data-testid={`create-room-btn-${chapter.chapter_number}`}
                      >
                        <Users className="w-4 h-4" />
                        Create Room
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
                  navigate(`/chapter-tests/class-${selectedClass}/${stream}${boardQuery}`);
                } else {
                  // For Class 6-10, go back to general subjects page
                  navigate(`/chapter-tests/class-${selectedClass}${boardQuery}`);
                }
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back to Subjects
            </button>
          </div>
        )}

        {/* Comprehensive Question Section - Capazoo Posts */}
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
                    <p className="text-white/80 text-sm">Questions from Capazoo for {formattedSubject}</p>
                  </div>
                </div>
                <Link 
                  to="/capazoo"
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
                  to="/capazoo"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View all {academicPosts.length} questions on Capazoo →
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
                <p className="text-white/90 text-sm">All questions follow the latest curriculum for {boardLabel}</p>
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
