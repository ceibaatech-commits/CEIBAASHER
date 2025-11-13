import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Play, Target, Brain, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChapterTestChapters = () => {
  const navigate = useNavigate();
  const { classNumber, subject, stream } = useParams();
  const location = window.location;
  
  // Extract class number from URL path
  const pathParts = location.pathname.split('/');
  const classIndex = pathParts.findIndex(part => part.startsWith('class-'));
  const selectedClass = classIndex >= 0 ? pathParts[classIndex].replace('class-', '') : '';
  
  const formattedSubject = subject?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchChapters();
  }, [selectedClass, subject]);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('ceibaa_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ceibaa_user');
    setUser(null);
    setIsLoggedIn(false);
    navigate('/');
  };

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chapter-tests/chapters`, {
        params: {
          class_param: selectedClass,
          subject: formattedSubject
        }
      });
      
      if (response.data.success) {
        setChapters(response.data.chapters || []);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
          className="rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" 
        />
      </div>
    );
  }

  // Color based on class
  const classColors = {
    '6': 'from-blue-500 to-blue-600',
    '7': 'from-purple-500 to-purple-600',
    '8': 'from-pink-500 to-pink-600',
    '9': 'from-orange-500 to-orange-600',
    '10': 'from-red-500 to-red-600',
    '11': 'from-teal-500 to-teal-600',
    '12': 'from-indigo-500 to-indigo-600'
  };

  const colorGradient = classColors[selectedClass] || 'from-blue-600 to-teal-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />
      
      {/* Compact Hero */}
      <div className={`bg-gradient-to-br ${colorGradient} text-white py-8`}>
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate(`/chapter-tests/${classNumber}`)}
            className="flex items-center space-x-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Subjects</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                  Class {selectedClass}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold">{formattedSubject}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black">Chapter-wise Tests</h1>
              <p className="text-white/90 mt-2">{chapters.length} Chapters Available</p>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/30">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{chapters.length}</p>
                    <p className="text-white/80 text-xs">Chapters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Animated Poster */}
        <div className="relative overflow-hidden rounded-3xl mb-8">
          <div className={`relative bg-gradient-to-br ${colorGradient} p-8 md:p-12`}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/30 inline-block">
                  <p className="text-white font-semibold flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>NCERT Chapter-wise Tests</span>
                  </p>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white">
                  Master Every Chapter!
                </h2>

                <p className="text-lg text-white/90">
                  Practice {chapters.length} Chapters with Detailed MCQs
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-xl font-bold text-white">{chapters.reduce((acc, ch) => acc + ch.total_questions, 0)}+</p>
                        <p className="text-white/80 text-xs">Questions</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-xl font-bold text-white">30-50m</p>
                        <p className="text-white/80 text-xs">Per Test</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})} 
                    className="bg-white text-gray-900 px-5 py-2 rounded-xl font-bold hover:scale-105 transform transition-all shadow-lg flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Practice</span>
                  </button>
                </div>
              </div>

              <div className="relative h-64 hidden md:block">
                <div className="absolute top-0 right-0 w-48 bg-white/20 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">NCERT Based</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-xs">All questions aligned with latest NCERT syllabus</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <button 
                    onClick={() => startTest(chapter)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    📚 Solo Practice
                  </button>
                  <button 
                    onClick={() => {
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
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    🎯 Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No chapters available yet</p>
            <p className="text-gray-500 mt-2">Chapters will be added soon!</p>
          </div>
        )}

        {/* Why Choose Section */}
        {chapters.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mt-12 border border-gray-700">
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
