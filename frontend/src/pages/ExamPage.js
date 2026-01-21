import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Swords, Clock, Award } from 'lucide-react';
import axios from 'axios';

const API_URL = window.location.origin;
const QUIZ_API_URL = window.location.origin; // Use main backend

const ExamPage = () => {
  const { examName } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, [examName]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${QUIZ_API_URL}/api/quiz/subjects/${examName}`);
      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const examInfo = {
    NEET: {
      fullName: 'National Eligibility cum Entrance Test',
      icon: '🏥',
      color: 'from-blue-500 to-cyan-500',
      description: 'Medical entrance exam for MBBS, BDS, and other medical courses in India'
    },
    JEE: {
      fullName: 'Joint Entrance Examination',
      icon: '🎓',
      color: 'from-purple-500 to-pink-500',
      description: 'Engineering entrance exam for IITs, NITs, and other premier engineering institutes'
    }
  };

  const info = examInfo[examName] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{info.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{examName}</h1>
              <p className="text-gray-600">{info.fullName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Exam Description */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">About {examName}</h2>
          <p className="text-gray-700 leading-relaxed">{info.description}</p>
        </div>

        {/* Subjects Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Subject</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all"
              >
                <div className={`bg-gradient-to-r ${info.color} p-6 text-white`}>
                  <h3 className="text-2xl font-bold">{subject.name}</h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {/* Solo Practice Button */}
                    <button
                      onClick={() => navigate(`/solo-practice/${examName}/${subject.name}`)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold">Solo Practice</span>
                      </div>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded">10 Qs</span>
                    </button>

                    {/* Battle Mode Button */}
                    <button
                      onClick={() => navigate(`/battle/${examName}/${subject.name}`)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Swords className="w-5 h-5" />
                        <span className="font-semibold">Battle Mode</span>
                      </div>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded">1v1</span>
                    </button>
                  </div>

                  {/* Subject Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>30s per question</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>Score points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Syllabus Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Syllabus Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject.name} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{subject.name}</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive questions covering all topics from the {examName} {subject.name} syllabus.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPage;