import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  ArrowLeft, BookOpen, Clock, FileText, Trophy, Users, Star, 
  CheckCircle, Award, Target, Zap, TrendingUp, Download, Share2,
  PlayCircle, ChevronDown, ChevronUp, Calendar, BarChart, AlertCircle,
  Lightbulb, BookMarked, GraduationCap, Brain
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const AnimatedSection = ({ children, className = '' }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
};

const ModernExamSyllabus = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [weightageData, setWeightageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      const [examResponse, topicsResponse, weightageResponse] = await Promise.all([
        axios.get(`${API_URL}/api/quiz/exam/${examId}`),
        axios.get(`${API_URL}/api/quiz/topics/all/${examId}`),
        axios.get(`${API_URL}/api/quiz/weightage/${examId}`)
      ]);
      
      if (examResponse.data.success) setExamData(examResponse.data.exam);
      if (topicsResponse.data.success) setAllTopics(topicsResponse.data.topics);
      if (weightageResponse.data.success) setWeightageData(weightageResponse.data.weightage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
          className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const filteredTopics = selectedSubject === 'all' ? allTopics : allTopics.filter(t => t.subject === selectedSubject);
  const subjects = Object.keys(examData.subjects || {});

  // SSC Specific Data (can be extended to other exams)
  const examInfo = {
    SSC: {
      posts: ['Lower Divisional Clerk', 'Junior Secretariat Assistant', 'Postal Assistant', 'Sorting Assistant', 'Data Entry Operator'],
      ageLimit: '18-27 years',
      qualification: '12th Pass',
      negativeMarking: 'Yes (0.5 marks)',
      mode: 'Computer Based Examination',
      stages: ['Tier 1 - CBT', 'Tier 2 - Skill Test']
    }
  };

  const currentExamInfo = examInfo[examId] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header />
      
      {/* Enhanced Hero */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white overflow-hidden" style={{ minHeight: '550px' }}>
        <div className="absolute inset-0">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 8, repeat: Infinity }} 
            className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} 
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} onClick={() => navigate('/')}
            className="flex items-center text-white/90 hover:text-white mb-6 group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </motion.button>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.8 }}>
                  {examData.icon.startsWith('http') ? (
                    <img src={examData.icon} alt={examData.name} className="w-20 h-20 object-contain" />
                  ) : (
                    <div className="text-6xl">{examData.icon}</div>
                  )}
                </motion.div>
                <div>
                  <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-black">
                    {examData.name}
                  </motion.h1>
                  <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="text-xl text-white/90 font-medium mt-2">{examData.full_name}</motion.p>
                </div>
              </div>

              <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-3 gap-4">
                {[
                  { icon: FileText, label: 'Questions', value: examData.total_questions },
                  { icon: Clock, label: 'Duration', value: examData.duration },
                  { icon: BookOpen, label: 'Subjects', value: subjects.length }
                ].map((stat, idx) => (
                  <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -4 }}
                    className="bg-white/10 backdrop-blur-lg px-4 py-3 rounded-2xl border border-white/20">
                    <stat.icon className="w-6 h-6 mb-2" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs opacity-80">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="hidden lg:flex justify-center">
              <img src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/hswh4l48_Gemini_Generated_Image_7osubg7osubg7osu_2-removebg-preview.png"
                alt="Students" className="w-full max-w-md h-auto object-contain drop-shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {currentExamInfo && (
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 inline-flex space-x-2">
            {['overview', 'syllabus'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {tab === 'overview' ? 'Exam Overview' : 'Complete Syllabus'}
              </button>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* Exam Info (SSC) */}
      {currentExamInfo && activeTab === 'overview' && (
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Posts Available</h3>
              </div>
              <div className="space-y-3">
                {currentExamInfo.posts.map((post, idx) => (
                  <motion.div key={idx} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{post}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-teal-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Important Details</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Age Limit', value: currentExamInfo.ageLimit, icon: Calendar },
                  { label: 'Qualification', value: currentExamInfo.qualification, icon: BookMarked },
                  { label: 'Exam Mode', value: currentExamInfo.mode, icon: FileText },
                  { label: 'Negative Marking', value: currentExamInfo.negativeMarking, icon: AlertCircle }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-teal-600" />
                      <span className="font-semibold text-gray-700">{item.label}:</span>
                    </div>
                    <span className="text-gray-900 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Syllabus Section */}
      {activeTab === 'syllabus' && (
        <>
          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Filter by Subject</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setSelectedSubject('all')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedSubject === 'all' ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  All Topics ({allTopics.length})
                </button>
                {subjects.map(subject => (
                  <button key={subject} onClick={() => setSelectedSubject(subject)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedSubject === subject ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {subject} ({allTopics.filter(t => t.subject === subject).length})
                  </button>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic, idx) => (
                <motion.div key={idx} whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                  <div className={`bg-gradient-to-br ${examData.color} p-6`}>
                    <div className="flex justify-between items-start mb-3">
                      <Trophy className="w-8 h-8 text-white" />
                      <button onClick={() => setExpandedTopics(p => ({ ...p, [idx]: !p[idx] }))}
                        className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-all">
                        {expandedTopics[idx] ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                      </button>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">{topic.topic}</h4>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-semibold inline-block">{topic.subject}</span>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Questions:</span>
                        <span className="font-bold text-blue-600 text-lg">{topic.questions}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-blue-600 to-teal-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min((topic.questions / 50) * 100, 100)}%` }} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedTopics[idx] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="mb-4 space-y-1 max-h-40 overflow-y-auto">
                          {topic.subtopics.map((sub, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5" />
                              <span>{sub}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <button onClick={() => navigate(`/topic-quiz/${examId}/${topic.subject}/${topic.topic}`)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                        📚 Solo Practice
                      </button>
                      <button onClick={() => navigate(`/create-room/${examId}/${topic.subject}/${topic.topic}`)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                        🎯 Room Battle
                      </button>
                      <button onClick={() => navigate(`/live-battle-1v1/${examId}/${topic.subject}/${topic.topic}`)}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                        ⚔️ Live Battle
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </>
      )}

      {/* CTA */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-3xl p-12 text-center shadow-2xl">
          <h3 className="text-4xl font-bold text-white mb-4">Ready to Start Preparing?</h3>
          <p className="text-xl text-white/90 mb-8">Join thousands mastering {examData.name}</p>
          <button onClick={() => setActiveTab('syllabus')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all">
            <PlayCircle className="w-6 h-6 inline mr-2" /> Start Now
          </button>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
};

export default ModernExamSyllabus;

