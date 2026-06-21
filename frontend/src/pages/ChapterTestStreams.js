import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Atom, TrendingUp, BookOpen } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { STREAM_COLORS, CLASS_COLORS } from '../config/constants';

const ChapterTestStreams = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { classNumber } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  
  // Extract class number from URL path since route is hardcoded
  const selectedClass = classNumber?.replace('class-', '') || location.pathname.match(/class-(\d+)/)?.[1];
  const selectedBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardQuery = `?board=${selectedBoard}`;

  const streams = [
    {
      name: 'Science',
      icon: Atom,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Physics, Chemistry, Biology, Mathematics',
      subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics']
    },
    {
      name: 'Commerce',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Accountancy, Business Studies, Economics',
      subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics']
    },
    {
      name: 'Humanities',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      description: 'History, Geography, Political Science, Sociology',
      subjects: ['History', 'Geography', 'Political Science', 'Sociology', 'Psychology']
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/chapter-tests${boardQuery}`)}
          className="flex items-center space-x-2 text-gray-700 hover:text-cyan-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Class Selection</span>
        </button>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-full mb-4">
            <span className="text-lg font-bold">Class {selectedClass}</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Select Your Stream
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your stream to access subject-wise chapter tests
          </p>
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {streams.map((stream) => {
            const Icon = stream.icon;
            return (
              <button
                key={stream.name}
                onClick={() => {
                  const streamSlug = stream.name.toLowerCase().replace(/\s+/g, '-');
                  navigate(`/chapter-tests/class-${selectedClass}/${streamSlug}${boardQuery}`);
                }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-transparent text-left overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stream.color} opacity-10 rounded-bl-full`}></div>
                
                <div className="relative z-10">
                  <div className={`${stream.bgColor} w-20 h-20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-10 h-10 ${stream.textColor}`} />
                  </div>
                  
                  <h3 className="text-3xl font-black text-gray-900 mb-3">
                    {stream.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {stream.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {stream.subjects.slice(0, 3).map((subject, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${stream.color}`}></span>
                        <span>{subject}</span>
                      </div>
                    ))}
                    {stream.subjects.length > 3 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${stream.color}`}></span>
                        <span>+{stream.subjects.length - 3} more</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`inline-flex items-center space-x-2 text-sm font-semibold ${stream.textColor} group-hover:translate-x-2 transition-transform duration-300`}>
                    <span>View Subjects</span>
                    <span>→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            📚 About Class {selectedClass} Tests
          </h3>
          <div className="text-gray-600 space-y-3">
            <p className="text-center">
              All tests are designed according to the latest curriculum guidelines for Class {selectedClass}.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="text-sm font-semibold text-gray-700">NCERT Based</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-lg">
                <span className="text-2xl">⏱️</span>
                <span className="text-sm font-semibold text-gray-700">Timed Tests</span>
              </div>
              <div className="flex items-center space-x-2 bg-pink-50 px-4 py-2 rounded-lg">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-semibold text-gray-700">Detailed Analytics</span>
              </div>
              <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg">
                <span className="text-2xl">🏆</span>
                <span className="text-sm font-semibold text-gray-700">Performance Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestStreams;
