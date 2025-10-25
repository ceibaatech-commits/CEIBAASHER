import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  ArrowLeft, BookOpen, Clock, FileText, Trophy, Users, Star, 
  CheckCircle, Award, Target, Zap, TrendingUp, Download, Share2,
  PlayCircle, ChevronDown, ChevronUp, Calendar, BarChart
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

// Section component with scroll animation
const AnimatedSection = ({ children, className = '' }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ModernExamSyllabus = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      const examResponse = await axios.get(`${API_URL}/api/quiz/exam/${examId}`);
      if (examResponse.data.success) {
        setExamData(examResponse.data.exam);
      }

      const topicsResponse = await axios.get(`${API_URL}/api/quiz/topics/all/${examId}`);
      if (topicsResponse.data.success) {
        setAllTopics(topicsResponse.data.topics);
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (index) => {
    setExpandedTopics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading || !examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  const filteredTopics = selectedSubject === 'all' 
    ? allTopics 
    : allTopics.filter(t => t.subject === selectedSubject);

  const subjects = Object.keys(examData.subjects || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Header />
      
      {/* Hero Section with Parallax Effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-teal-700 text-white overflow-hidden"
        style={{ minHeight: '500px' }}
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/')}
            className="flex items-center text-white/90 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </motion.button>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="flex-shrink-0"
            >
              {examData.icon.startsWith('http') ? (
                <img 
                  src={examData.icon} 
                  alt={examData.name} 
                  className="w-32 h-32 object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="text-8xl drop-shadow-2xl">{examData.icon}</div>
              )}
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl font-black mb-4"
              >
                {examData.name}
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl text-white/90 mb-6 font-medium"
              >
                {examData.full_name}
              </motion.p>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-wrap gap-4 justify-center md:justify-start"
              >
                {[
                  { icon: FileText, label: 'Questions', value: examData.total_questions },
                  { icon: Clock, label: 'Duration', value: examData.duration },
                  { icon: BookOpen, label: 'Subjects', value: subjects.length }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    variants={scaleIn}
                    className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-xl border border-white/30 hover:bg-white/30 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <stat.icon className="w-6 h-6" />
                      <div>
                        <p className="text-sm opacity-90">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Hero Illustration - Right Side */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
              className="hidden lg:block flex-shrink-0"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/48pisksa_Gemini_Generated_Image_7osubg7osubg7osu%202.png"
                alt="Students Learning"
                className="w-80 h-80 object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* About Exam Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">About This Exam</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">
            {examData.description}
          </p>
        </div>
      </AnimatedSection>

      {/* Subject Filter Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Syllabus</h3>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-wrap gap-3"
          >
            <motion.button
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSubject('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedSubject === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Topics ({allTopics.length})
            </motion.button>
            {subjects.map((subject) => {
              const count = allTopics.filter(t => t.subject === subject).length;
              return (
                <motion.button
                  key={subject}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedSubject === subject
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject} ({count})
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Topics Grid */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTopics.map((topicData, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group"
            >
              <div className={`bg-gradient-to-br ${examData.color} p-6`}>
                <div className="flex items-start justify-between mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    onClick={() => toggleTopic(index)}
                    className="text-white bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-all"
                  >
                    {expandedTopics[index] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </motion.button>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{topicData.topic}</h3>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                  <p className="text-white text-sm font-semibold">{topicData.subject}</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Questions Available:</span>
                    <span className="font-bold text-blue-600 text-lg">{topicData.questions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min((topicData.questions / 50) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 h-3 rounded-full"
                    />
                  </div>
                </div>

                {expandedTopics[index] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4"
                  >
                    <p className="text-xs text-gray-500 mb-2 font-semibold">Subtopics:</p>
                    <div className="space-y-1">
                      {topicData.subtopics.map((subtopic, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-700">{subtopic}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Solo Practice</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/create-room/${examId}/${topicData.subject}/${topicData.topic}`)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Room Battle (PIN)</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/live-battle-1v1/${examId}/${topicData.subject}/${topicData.topic}`)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Live Battle (1v1)</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredTopics.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 text-lg">No topics available for this filter.</p>
          </motion.div>
        )}
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-12 text-center shadow-2xl"
        >
          <h3 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students preparing for {examData.name} with our comprehensive quizzes and live battles.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2"
          >
            <PlayCircle className="w-6 h-6" />
            <span>Start Preparing Now</span>
          </motion.button>
        </motion.div>
      </AnimatedSection>

      <Footer />
    </div>
  );
};

export default ModernExamSyllabus;
