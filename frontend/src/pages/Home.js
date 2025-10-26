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
                onClick={() => navigate('/social')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Social Feed</span>
              </button>
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
        {/* Defence Exams Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 mb-8 border-2 border-green-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-green-800 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
                  Defence Exams
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎖️ Serve the Nation • Armed Forces & Paramilitary</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-green-200">
                ⚔️ NDA • Agniveer • CDS
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-200">
                🛡️ Army • Navy • Air Force
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-teal-200">
                🏆 CAPF & Paramilitary
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => ['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id)).map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-green-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Admission Tests Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png" 
                  alt="Admission Tests" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Admission Tests
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎓 Gateway to Excellence • Professional Entrance Exams</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-purple-200">
                ⚡ JEE • NEET • GATE
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-blue-200">
                🎯 CAT • CLAT • CUET
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-indigo-200">
                🌟 Engineering • Medical • Management
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'Admission Tests').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-200 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-purple-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>


        {/* Banking Examinations Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png" 
                alt="Banking Examinations" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Banking Examinations</h2>
              <p className="text-gray-600">Banking & Financial Services Entrance Exams</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exams.filter(exam => exam.category === 'Banking Examinations').map((exam) => (
              <motion.div
                key={exam.id}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
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

                  <button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all group-hover:scale-105">
                    View Syllabus →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* UPSC Examinations Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/lwzydz67_Gemini_Generated_Image_69zrpn69zrpn69zr_2-removebg-preview.png" 
                alt="UPSC Examinations" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">UPSC Examinations</h2>
              <p className="text-gray-600">Union Public Service Commission Exams</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exams.filter(exam => exam.category === 'UPSC Examinations').map((exam) => (
              <motion.div
                key={exam.id}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
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

                  <button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all group-hover:scale-105">
                    View Syllabus →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SSC Examinations Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png" 
                alt="SSC Examinations" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">SSC Examinations</h2>
              <p className="text-gray-600">Staff Selection Commission Exams</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exams.filter(exam => exam.category === 'SSC Examinations').map((exam) => (
              <motion.div
                key={exam.id}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
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

                  <button className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all group-hover:scale-105">
                    View Syllabus →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Teaching Examinations Section - Enhanced UI */}
        <div className="mb-16">
          {/* Unique Header with Gradient Background */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 mb-8 border-2 border-emerald-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png" 
                  alt="Teaching Examinations" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Teaching Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎓 Shape Future Minds • Teaching Eligibility & Recruitment</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-200">
                ✨ DSSB • KVS • CTET
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-teal-200">
                📚 Primary • Secondary • Higher Education
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-cyan-200">
                🏆 Delhi • Central • State Level
              </span>
            </div>
          </motion.div>

          {/* Enhanced Card Grid with Unique Styling */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'Teaching Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                {/* Card Content */}
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-emerald-300">
                  {/* Header with Gradient */}
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    {/* Animated Decorative Elements */}
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    {/* Icon & Title */}
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  {/* Enhanced Card Body */}
                  <div className="p-6 bg-gradient-to-br from-white to-gray-50">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed">{exam.description}</p>
                    
                    {/* Stats with Icons */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📝</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 block">Questions</span>
                          <span className="font-bold text-gray-900">{exam.total_questions}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">⏱️</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 block">Duration</span>
                          <span className="font-bold text-gray-900">{exam.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📚</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 block">Subjects</span>
                          <span className="font-bold text-gray-900">{exam.subjects.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced CTA Button */}
                    <motion.button 
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform transition-all flex items-center justify-center gap-2 group"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>View Syllabus</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        →
                      </motion.span>
                    </motion.button>
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
          {exams.filter(exam => 
            !['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id) && 
            !['Admission Tests', 'Banking Examinations', 'UPSC Examinations', 'SSC Examinations', 'Teaching Examinations'].includes(exam.category)
          ).map((exam) => (
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