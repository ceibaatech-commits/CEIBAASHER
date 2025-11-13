import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, FileText, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Target, BarChart, TrendingUp, Award, Star, Play, ChevronRight, Brain, Flame } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ModernExamSyllabus = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [weightageData, setWeightageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});
  const [showWeightage, setShowWeightage] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    const fetchData = async () => {
      try {
        const [exam, topics, weightage] = await Promise.all([
          axios.get(`${API_URL}/api/quiz/exam/${examId}`),
          axios.get(`${API_URL}/api/quiz/topics/all/${examId}`),
          axios.get(`${API_URL}/api/quiz/weightage/${examId}`)
        ]);
        if (exam.data.success) setExamData(exam.data.exam);
        if (topics.data.success) setAllTopics(topics.data.topics);
        if (weightage.data.success) setWeightageData(weightage.data.weightage);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId]);

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

  if (loading || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
          className="rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const filteredTopics = selectedSubject === 'all' ? allTopics : allTopics.filter(t => t.subject === selectedSubject);
  const subjects = Object.keys(examData.subjects || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* SEO Component */}
      <SEO 
        examName={examData?.full_name || examData?.name}
        title={`${examData?.full_name || examData?.name} 2026 - Test Series, MCQ & Free Practice Quizzes | Ceibaa`}
        description={`Prepare for ${examData?.full_name || examData?.name} 2026 with comprehensive test series, MCQs & free practice quizzes. Master all subjects with live battles, real-time mock tests & detailed syllabus coverage on Ceibaa.`}
        keywords={`${examData?.name} 2026, ${examData?.name} test series, ${examData?.name} MCQ, ${examData?.name} practice quiz, ${examData?.name} mock test, ${examData?.name} preparation, ${examData?.name} syllabus`}
      />
      
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />
      
      {/* Compact Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <button onClick={() => navigate('/')} className="flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-4">
              {examData.icon.startsWith('http') ? (
                <img src={examData.icon} alt={examData.name} className="w-16 h-16 object-contain" />
              ) : (
                <div className="text-5xl">{examData.icon}</div>
              )}
              <div>
                <h1 className="text-3xl font-black">
                  {examData.name} 2026 - Test Series, MCQ & Free Practice Quizzes
                </h1>
                <p className="text-white/90 text-sm mt-1">{examData.full_name} Preparation Platform</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FileText, label: 'Questions', value: examData.total_questions },
                { icon: Clock, label: 'Duration', value: examData.duration },
                { icon: BookOpen, label: 'Subjects', value: subjects.length }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Weightage Toggle */}
        {weightageData && (
          <div className="mb-6">
            <button onClick={() => setShowWeightage(!showWeightage)}
              className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Topic-wise Weightage Analysis</h3>
                  <p className="text-xs text-gray-600">Click to view preparation strategy</p>
                </div>
              </div>
              {showWeightage ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {showWeightage && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-xl shadow-md p-4 mt-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {Object.entries(weightageData.subjects).map(([name, data]) => (
                      <div key={name} className={`bg-gradient-to-br ${data.color} p-3 rounded-lg text-white text-center`}>
                        <p className="text-xs opacity-90">{name}</p>
                        <p className="text-2xl font-bold">{data.questions}</p>
                        <p className="text-xs">Questions</p>
                      </div>
                    ))}
                  </div>

                  {Object.entries(weightageData.subjects).map(([name, data]) => (
                    <div key={name} className="mb-3 last:mb-0">
                      <div className={`bg-gradient-to-r ${data.color} text-white px-3 py-2 rounded-t-lg font-bold text-sm`}>
                        {name}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-b-lg grid grid-cols-2 gap-2">
                        {data.topics.map((topic, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs bg-white p-2 rounded">
                            <span className="font-medium flex-1">{topic.name}</span>
                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                topic.importance === 'Very High' ? 'bg-red-100 text-red-700' :
                                topic.importance === 'High' ? 'bg-orange-100 text-orange-700' :
                                topic.importance === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>{topic.expected}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}


        {/* Animated Exam Poster */}
        <div className="relative overflow-hidden rounded-3xl mb-8">
          <div className={`relative bg-gradient-to-br ${examData.color} p-8 md:p-12`}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/30 inline-block">
                  <p className="text-white font-semibold flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Sub-Topic Wise Mock Tests</span>
                  </p>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white">
                  Master Every Sub-Topic!
                </h2>

                <p className="text-lg text-white/90">
                  500+ Sub-Topic Tests Across {subjects.length} Subjects
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-xl font-bold text-white">{examData.total_questions}+</p>
                        <p className="text-white/80 text-xs">Questions</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/30">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-xl font-bold text-white">5K+</p>
                        <p className="text-white/80 text-xs">Active Users</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})} className="bg-white text-gray-900 px-5 py-2 rounded-xl font-bold hover:scale-105 transform transition-all shadow-lg flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Start Free Test</span>
                  </button>
                </div>
              </div>

              <div className="relative h-64 hidden md:block">
                <div className="absolute top-0 right-0 w-48 bg-white/20 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Progress</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedSubject('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedSubject === 'all' ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              All ({allTopics.length})
            </button>
            {subjects.map(subject => (
              <button key={subject} onClick={() => setSelectedSubject(subject)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedSubject === subject ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {subject} ({allTopics.filter(t => t.subject === subject).length})
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic, idx) => (
            <motion.div key={idx} whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
              <div className={`bg-gradient-to-br ${examData.color} p-4 relative`}>
                {/* Dark overlay for better text contrast */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-bold text-base flex-1 drop-shadow-md">{topic.subject}</h4>
                    <button onClick={() => setExpandedTopics(p => ({ ...p, [idx]: !p[idx] }))}
                      className="bg-white/20 p-1 rounded hover:bg-white/30 transition-all">
                      {expandedTopics[idx] ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-semibold drop-shadow-md">{topic.syllabus_topic}</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-bold text-blue-600 text-base">{topic.questions}</span>
                </div>

                <AnimatePresence>
                  {expandedTopics[idx] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mb-3 max-h-64 overflow-y-auto">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Focus on Specific Concepts:</span>
                      </div>
                      <div className="space-y-2">
                        {topic.sub_topics && topic.sub_topics.map((sub, i) => (
                          <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 hover:from-blue-50 hover:to-blue-100 transition-all group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5 group-hover:text-blue-600 transition-colors" />
                                <span className="text-xs text-gray-700 group-hover:text-blue-900 font-medium">{sub}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/topic-quiz/${examId}/${topic.subject}/${topic.topic}`, { state: { subTopic: sub } });
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold shadow-sm hover:shadow transition-all"
                                  title="Practice this concept"
                                >
                                  📚
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/create-room/${examId}/${topic.subject}/${topic.topic}`, { state: { subTopic: sub } });
                                  }}
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-semibold shadow-sm hover:shadow transition-all"
                                  title="Create room for this concept"
                                >
                                  🎯
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <button onClick={() => navigate(`/topic-quiz/${examId}/${topic.subject}/${topic.topic}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:shadow-lg transition-all">
                    📚 Solo Practice
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => navigate(`/create-room/${examId}/${topic.subject}/${topic.topic}`)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-all">
                      🎯 Room
                    </button>
                    <button onClick={() => navigate(`/live-battle-1v1/${examId}/${topic.subject}/${topic.topic}`)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-all">
                      ⚔️ Battle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {/* Why Choose Ceibaa - Features */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mb-12 border border-gray-700">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          🚀 Why Choose Ceibaa?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
            <Target className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Sub-Topic Wise Focus</h3>
            <p className="text-white/90 text-sm">Master every topic by breaking it into smaller, focused segments</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
            <Zap className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Real-Time Battles</h3>
            <p className="text-white/90 text-sm">Compete with live opponents and learn faster through competition</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white hover:scale-105 transform transition-all">
            <BarChart className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
            <p className="text-white/90 text-sm">Track your progress in every sub-topic with detailed insights</p>
          </div>
        </div>
      </div>

      {/* Success Stories & CTA */}
      <div className="relative overflow-hidden rounded-3xl mb-12">
        <div className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-700 p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-block bg-white/20 backdrop-blur-xl px-6 py-2 rounded-full border border-white/30 mb-4">
                <p className="text-white font-bold flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Join 5,000+ Daily Active Students</span>
                </p>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-white mb-3">
                Study Smarter, Not Longer!
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                Beat distractions with focused 15-minute sub-topic quizzes
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: '⏱️', number: '15min', label: 'Avg Study Session' },
                { icon: '📚', number: '5K+', label: 'Daily Active Users' },
                { icon: '🎯', number: '87%', label: 'Complete Tests' },
                { icon: '⭐', number: '4.6/5', label: 'User Rating' }
              ].map((stat, index) => (
                <div key={index} className="bg-white/20 backdrop-blur-xl rounded-xl p-4 text-center border border-white/30 hover:scale-105 transform transition-all">
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <p className="text-2xl font-black text-white mb-1">{stat.number}</p>
                  <p className="text-white/80 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/30">
              <div className="flex items-center justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-lg md:text-xl text-white text-center mb-4 italic">
                "The sub-topic wise breakdown really helped me focus. I used to get distracted easily, but now I can practice specific concepts for 15-20 mins and stay focused. Much better than random questions!"
              </p>
              
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                  👨‍🎓
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">Rahul K.</p>
                  <p className="text-white/80 text-sm">CDS Aspirant • Delhi</p>
                </div>
              </div>
            </div>

            {/* Additional Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/30">
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/90 text-sm mb-3">
                  "Battle mode is addictive in a good way! I practice more because it's fun competing with others. My weak areas in math improved a lot."
                </p>
                <p className="text-white font-semibold text-sm">Priya M. • NEET Student</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/30">
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/90 text-sm mb-3">
                  "Before Ceibaa, I wasted hours scrolling social media. Now I do quick 10-minute quizzes whenever I'm free. My consistency improved a lot!"
                </p>
                <p className="text-white font-semibold text-sm">Amit S. • JEE Aspirant</p>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                className="bg-white text-green-600 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transform transition-all shadow-2xl inline-flex items-center space-x-3"
              >
                <Zap className="w-6 h-6" />
                <span>Start Now - Completely Free!</span>
                <ChevronRight className="w-6 h-6" />
              </button>

              <p className="text-white/80 mt-4 text-sm">
                ✅ No Credit Card Required • ✅ Instant Access • ✅ 24/7 Support
              </p>
            </div>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600"></div>
      </div>

      <Footer />
    </div>
  );
};

export default ModernExamSyllabus;


