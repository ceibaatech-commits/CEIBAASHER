import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, FileText, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Target, BarChart, TrendingUp, Award } from 'lucide-react';
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
                <h1 className="text-3xl font-black">{examData.name}</h1>
                <p className="text-white/90 text-sm mt-1">{examData.full_name}</p>
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
                    <h4 className="text-white font-bold text-base flex-1 drop-shadow-md">{topic.topic}</h4>
                    <button onClick={() => setExpandedTopics(p => ({ ...p, [idx]: !p[idx] }))}
                      className="bg-white/20 p-1 rounded hover:bg-white/30 transition-all">
                      {expandedTopics[idx] ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-semibold drop-shadow-md">{topic.subject}</span>
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
                      className="mb-3 max-h-24 overflow-y-auto space-y-1">
                      {topic.subtopics.map((sub, i) => (
                        <div key={i} className="flex items-start gap-1 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span>{sub}</span>
                        </div>
                      ))}
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

      <Footer />
    </div>
  );
};

export default ModernExamSyllabus;


