import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Play, Target, Brain, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { API_URL, CLASS_COLORS, DIFFICULTY_COLORS } from '../config/constants';

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

  useEffect(() => {
    if (!selectedClass || !subject) {
      setError('Invalid class or subject');
      setLoading(false);
      return;
    }
    fetchChapters();
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {/* Clean Header - Simplified Navigation */}
      <div className={`bg-gradient-to-br ${colorGradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center">
            {/* Back Arrow */}
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
            
            {/* Centered Title & Subtitle */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold">{formattedSubject}</h1>
              <p className="text-sm text-white/80">Class {selectedClass} • {chapters.length} Chapters</p>
            </div>
            
            {/* Spacer for alignment */}
            <div className="w-9"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {chapters.length > 0 && (
          <>
            {/* Stats & Practice Row - Unified */}
            <div className="flex items-stretch gap-3 mb-5">
              {/* Questions Stat - Secondary */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalQuestions}+</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
              </div>
              
              {/* Let's Practice - Primary CTA */}
              <button 
                onClick={() => chapters[0] && handleStartPractice(chapters[0])} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{"Let's Practice!"}</span>
              </button>
            </div>

            {/* Chapters List - Modern Cards */}
            <div className="space-y-3">
              {chapters.map((chapter, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Chapter Header */}
                    <div className="flex items-start justify-between mb-3">
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
                        <h4 className="font-semibold text-gray-900">{chapter.chapter_name}</h4>
                      </div>
                      <button 
                        onClick={() => setExpandedChapters(p => ({ ...p, [idx]: !p[idx] }))}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedChapters[idx] ? 
                          <ChevronUp className="w-4 h-4 text-gray-500" /> : 
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        }
                      </button>
                    </div>
                    
                    {/* Stats Row - Icon Based */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{chapter.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{chapter.duration}m</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(chapter.difficulty)}`}>
                        {chapter.difficulty}
                      </span>
                    </div>

                    {/* Previous Score */}
                    {chapter.last_score && (
                      <div className="bg-green-50 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                        <span className="text-xs text-gray-600">Previous Score</span>
                        <span className="text-sm font-bold text-green-600">{chapter.last_score}%</span>
                      </div>
                    )}

                    {/* Expandable Details */}
                    <AnimatePresence>
                      {expandedChapters[idx] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-3"
                        >
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span>{chapter.total_questions} Multiple Choice Questions</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span>NCERT Based Content</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span>Instant Results & Analysis</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons - Primary/Secondary Hierarchy */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStartPractice(chapter)} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm active:scale-[0.98]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Solo Practice</span>
                      </button>
                      <button 
                        onClick={() => handleCreateRoom(chapter)} 
                        className="flex-1 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm"
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
