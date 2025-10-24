import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText, Trophy } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ExamSyllabus = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');

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

  if (loading || !examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading syllabus...</p>
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
      <header className={`bg-gradient-to-r ${examData.color} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          
          <div className="flex items-start space-x-6">
            <div className="text-7xl">{examData.icon}</div>
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2">{examData.name}</h1>
              <p className="text-xl text-white/90 mb-4">{examData.full_name}</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">{examData.total_questions} Questions</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">{examData.duration}</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{subjects.length} Subjects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Syllabus</h2>
          <p className="text-gray-600 mb-6">{examData.description}</p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedSubject === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Topics ({allTopics.length})
            </button>
            {subjects.map((subject) => {
              const count = allTopics.filter(t => t.subject === subject).length;
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedSubject === subject
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topicData, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`)}
            >
              <div className={`bg-gradient-to-r ${examData.color} p-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">{topicData.topic}</h3>
                  <Trophy className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-white/80 text-sm mt-1">{topicData.subject}</p>
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

                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/topic-quiz/${examId}/${topicData.subject}/${topicData.topic}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Practice
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/create-room/${examId}/${topicData.subject}/${topicData.topic}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Battle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No topics available for this filter.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExamSyllabus;
