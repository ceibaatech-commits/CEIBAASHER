import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText, Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const API_URL = window.location.origin;

const ExamSyllabus = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [examData, setExamData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});
  const [showWeightage, setShowWeightage] = useState(false);

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

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTopic = (index) => {
    setExpandedTopics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading || !examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  const filteredTopics = selectedSubject === 'all' 
    ? allTopics 
    : allTopics.filter(t => t.subject === selectedSubject);

  const subjects = Object.keys(examData.subjects || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title={`${examData?.name || examId} - Free Mock Test & Practice Questions`}
        description={`Practice free mock tests, topic-wise MCQs and previous year questions for ${examData?.name || examId}. Get instant results and detailed solutions on Ceibaa.`}
        keywords={`${examData?.name || examId} mock test, ${examData?.name || examId} practice questions, ${examData?.name || examId} free mcq, ${examData?.name || examId} online test`}
        canonical={`https://ceibaa.in/exam/${examId}`}
      />
      <Header 
        isLoggedIn={isAuthenticated()}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {/* Exam Banner - Ultra Compact on Mobile (~110px total) */}
      <div className={`bg-gradient-to-r ${examData.color} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 md:py-8">
          {/* Back Button - Inline on Mobile */}
          <button
            onClick={() => navigate('/victory-lane')}
            className="flex items-center text-white/90 hover:text-white mb-1 md:mb-4 transition-colors text-xs md:text-base"
          >
            <ArrowLeft className="w-3 h-3 md:w-5 md:h-5 mr-1" />
            <span className="md:inline">Back</span>
          </button>
          
          {/* Mobile: Ultra Compact Header */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="flex-shrink-0">
              {examData.icon.startsWith('http') ? (
                <img src={examData.icon} alt={examData.name} className="w-10 h-10 md:w-24 md:h-24 object-contain" />
              ) : (
                <div className="text-3xl md:text-7xl">{examData.icon}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-4xl font-bold mb-0 md:mb-2 text-white truncate leading-tight">{examData.name}</h1>
              <p className="text-[10px] md:text-xl text-white/80 font-medium line-clamp-1 leading-tight">{examData.full_name}</p>
              
              {/* Stats Row - Hidden on mobile, shown in Quick Stats Bar below */}
              <div className="hidden md:flex items-center gap-4 mt-4 flex-wrap">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold text-white">{examData.total_questions} Questions</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-white">{examData.duration}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold text-white">{subjects.length} Subjects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar - Mobile Only (Compact) */}
      <div className="md:hidden bg-slate-800 px-2 py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <div className="flex items-center space-x-0.5">
              <FileText className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium">{examData.total_questions}Qs</span>
            </div>
            <div className="w-px h-2.5 bg-white/30"></div>
            <div className="flex items-center space-x-0.5">
              <Users className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-medium">5K+</span>
            </div>
          </div>
          <div 
            className="bg-white text-slate-800 px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5 shadow-sm cursor-default"
          >
            <span>▶</span>
            <span>Start</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 md:py-12">
        {/* Topic Weightage Analysis - Collapsible on Mobile */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md mb-2 md:mb-8 overflow-hidden">
          <button 
            onClick={() => setShowWeightage(!showWeightage)}
            className="w-full px-2 py-2 md:px-6 md:py-4 flex items-center justify-between md:cursor-default"
          >
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 md:w-8 md:h-8 bg-blue-100 rounded flex items-center justify-center">
                <Trophy className="w-3 h-3 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-xs md:text-2xl font-bold text-gray-900">Topic-Wise Weightage</h2>
            </div>
            <div className="md:hidden flex items-center space-x-1">
              <span className="text-[10px] text-blue-600 font-medium">{showWeightage ? 'Hide' : 'Show'}</span>
              {showWeightage ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </div>
          </button>
          
          {/* Desktop always shows, mobile toggles */}
          <div className={`${showWeightage ? 'block' : 'hidden'} md:block px-2 pb-2 md:px-6 md:pb-6`}>
            <p className="text-gray-500 text-[10px] md:text-base mb-2 md:mb-6 line-clamp-2">{examData.description}</p>
            
            {/* Subject Filter Pills - Ultra Compact on Mobile */}
            <div className="flex flex-wrap gap-1 md:gap-3">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-2 py-0.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-medium transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                All ({allTopics.length})
              </button>
              {subjects.map((subject) => {
                const count = allTopics.filter(t => t.subject === subject).length;
                return (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-2 py-0.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-medium transition-all ${
                      selectedSubject === subject
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {subject} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Topics List - Mobile: Ultra Compact Collapsible Cards (~50px collapsed) */}
        <div className="md:hidden space-y-1">
          {filteredTopics.map((topicData, index) => (
            <div
              key={index}
              className="bg-white rounded overflow-hidden border border-gray-100"
            >
              {/* Topic Header - Collapsed: ~50px height */}
              <button
                onClick={() => toggleTopic(index)}
                className={`w-full bg-gradient-to-r ${examData.color} px-2 py-1.5 flex items-center justify-between`}
              >
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-white font-medium text-xs truncate">{topicData.topic}</h3>
                  <span className="text-white/70 text-[10px]">{topicData.subject}</span>
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <span className="text-white text-[10px]">{topicData.questions}Qs</span>
                  {expandedTopics[index] ? (
                    <ChevronUp className="w-3 h-3 text-white/70" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-white/70" />
                  )}
                </div>
              </button>

              {/* Expanded Content - Compact */}
              {expandedTopics[index] && (
                <div className="px-2 py-1.5 bg-gray-50">
                  {/* Subtopics */}
                  {topicData.subtopics && topicData.subtopics.length > 0 && (
                    <div className="mb-1.5">
                      <div className="flex flex-wrap gap-0.5">
                        {topicData.subtopics.slice(0, 3).map((subtopic, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
                          >
                            {subtopic}
                          </span>
                        ))}
                        {topicData.subtopics.length > 3 && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            +{topicData.subtopics.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Horizontal Ultra Compact */}
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`);
                      }}
                      className="flex-1 bg-blue-600 text-white py-1.5 px-1 rounded text-[10px] font-medium flex items-center justify-center space-x-0.5"
                    >
                      <span>📚</span>
                      <span>Solo</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/create-room/${examId}/${topicData.subject}/${topicData.topic}`);
                      }}
                      className="flex-1 bg-purple-600 text-white py-1.5 px-1 rounded text-[10px] font-medium flex items-center justify-center space-x-0.5"
                    >
                      <span>🎯</span>
                      <span>Room</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/matchmaking/${examId}/${topicData.subject}/${topicData.topic}`);
                      }}
                      className="flex-1 bg-orange-600 text-white py-1.5 px-1 rounded text-[10px] font-medium flex items-center justify-center space-x-0.5"
                    >
                      <span>⚔️</span>
                      <span>Battle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Grid View - Unchanged */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topicData, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`)}
            >
              <div className={`bg-gradient-to-r ${examData.color} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{topicData.topic}</h3>
                <p className="text-white font-semibold text-sm bg-white/20 px-3 py-1 rounded-full inline-block">{topicData.subject}</p>
              </div>
              
              <div className="p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Questions Available:</span>
                    <span className="font-bold text-blue-600">{topicData.questions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min((topicData.questions / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Subtopics:</p>
                  <div className="flex flex-wrap gap-1">
                    {topicData.subtopics.slice(0, 3).map((subtopic, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {subtopic}
                      </span>
                    ))}
                    {topicData.subtopics.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        +{topicData.subtopics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    📚 Solo Practice
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/create-room/${examId}/${topicData.subject}/${topicData.topic}`);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    🎯 Room Battle (PIN)
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/matchmaking/${examId}/${topicData.subject}/${topicData.topic}`);
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    ⚔️ Live Battle (1v1)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-600 text-sm md:text-lg">No topics available for this filter.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ExamSyllabus;
