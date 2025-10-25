import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp, BookOpen, FileText, Clock } from 'lucide-react';
import axios from 'axios';
import CeibaaLogo from '../components/CeibaaLogo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchExams();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setIsLoggedIn(true);
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
      }
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/exams`);
      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transform Learning into Competition
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Master competitive exams through engaging multiplayer battles. Practice with syllabus-based quizzes or compete live with opponents!
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/join-room')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Join Battle Room</span>
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 rounded-lg font-bold text-lg transition-all inline-flex items-center space-x-2"
              >
                <Trophy className="w-5 h-5" />
                <span>Leaderboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">8 Major Exams</p>
              <p className="text-xs text-gray-600">Complete Syllabus</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Live Battles</p>
              <p className="text-xs text-gray-600">Real-time Competition</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 text-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Topic-wise Quiz</p>
              <p className="text-xs text-gray-600">Focused Practice</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Track Progress</p>
              <p className="text-xs text-gray-600">Detailed Analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Exam Cards */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Competitive Exam
          </h2>
          <p className="text-xl text-gray-600">
            Select your target exam to explore complete syllabus and start practicing
          </p>
        </div>

        {/* Exam Cards Grid */}
        {/* Defence Exams Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-emerald-800 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Defence Exams</h2>
              <p className="text-gray-600">Armed Forces & Paramilitary Entrance Exams</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exams.filter(exam => ['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id)).map((exam) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                <div className={`bg-gradient-to-br ${exam.color} p-6 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative text-white">
                    <div className="mb-3">
                      {exam.icon.startsWith('http') ? (
                        <img src={exam.icon} alt={exam.name} className="w-20 h-20 object-contain mx-auto drop-shadow-lg" />
                      ) : (
                        <div className="text-5xl">{exam.icon}</div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-1 drop-shadow-md">{exam.name}</h3>
                    <p className="text-white text-sm drop-shadow-md">{exam.full_name}</p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 text-sm mb-4 h-12">{exam.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{exam.total_questions} Qs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{exam.duration}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other Exams Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8">Other Competitive Exams</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exams.filter(exam => !['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id)).map((exam) => (
            <div
              key={exam.id}
              onClick={() => navigate(`/exam/${exam.id}`)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              data-testid={`exam-card-${exam.id}`}
            >
              <div className={`bg-gradient-to-br ${exam.color} p-6 relative overflow-hidden`}>
                {/* Dark overlay for better text contrast */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative text-white">
                  <div className="mb-3">
                    {exam.icon.startsWith('http') ? (
                      <img src={exam.icon} alt={exam.name} className="w-20 h-20 object-contain mx-auto drop-shadow-lg" />
                    ) : (
                      <div className="text-5xl">{exam.icon}</div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-1 drop-shadow-md">{exam.name}</h3>
                  <p className="text-white text-sm drop-shadow-md">{exam.full_name}</p>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 text-sm mb-4 h-12">{exam.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-semibold text-gray-900">{exam.total_questions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">{exam.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subjects:</span>
                    <span className="font-semibold text-gray-900">{exam.subjects.length}</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all group-hover:scale-105">
                  View Syllabus →
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">How Ceibaa Works</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Select Your Exam</h4>
                <p className="text-white/80 text-sm">Choose from 8 major competitive exams</p>
              </div>
              <div className="text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Pick Your Topic</h4>
                <p className="text-white/80 text-sm">Topic-wise practice from complete syllabus</p>
              </div>
              <div className="text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Battle & Win</h4>
                <p className="text-white/80 text-sm">Compete live or practice solo</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;