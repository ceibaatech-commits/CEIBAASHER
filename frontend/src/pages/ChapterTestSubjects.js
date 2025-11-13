import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ChapterTestSubjects = () => {
  const navigate = useNavigate();
  const { classNumber } = useParams();
  const location = window.location;
  
  // Extract class number from URL path (e.g., /chapter-tests/class-6)
  const pathParts = location.pathname.split('/');
  const classIndex = pathParts.findIndex(part => part.startsWith('class-'));
  const selectedClass = classIndex >= 0 ? pathParts[classIndex].replace('class-', '') : (classNumber?.replace('class-', '') || '');

  // Check auth state
  const [user, setUser] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ceibaa_user');
    setUser(null);
    setIsLoggedIn(false);
    navigate('/');
  };

  // Define subjects based on class
  let subjects = [];
  
  if (selectedClass === '6') {
    subjects = [
      {
        name: 'Mathematics',
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        description: 'Master mathematical concepts chapter by chapter'
      },
      {
        name: 'Science',
        icon: Beaker,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        description: 'Explore Physics, Chemistry, and Biology'
      },
      {
        name: 'History',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'Ancient India and Early Civilizations'
      },
      {
        name: 'Poorvi',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'NCERT Poorvi - English Textbook'
      },
      {
        name: 'Hindi',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'Improve your Hindi language proficiency'
      }
    ];
  } else if (selectedClass === '8') {
    // Class 8 has separate subjects for Geography, History, and Civics
    subjects = [
      {
        name: 'Mathematics',
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        description: 'Master mathematical concepts chapter by chapter'
      },
      {
        name: 'Science',
        icon: Beaker,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        description: 'Explore Physics, Chemistry, and Biology'
      },
      {
        name: 'Geography',
        icon: Globe,
        color: 'from-teal-500 to-teal-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        description: 'Resources and Development'
      },
      {
        name: 'History',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'Our Pasts III'
      },
      {
        name: 'Civics',
        icon: Globe,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        description: 'Social and Political Life'
      },
      {
        name: 'Hindi',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'NCERT Vasant - Hindi Textbook'
      }
    ];
  } else {
    // Other classes
    subjects = [
      {
        name: 'Mathematics',
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        description: 'Master mathematical concepts chapter by chapter'
      },
      {
        name: 'Science',
        icon: Beaker,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        description: 'Explore Physics, Chemistry, and Biology'
      },
      {
        name: 'Social Science',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'History, Geography, Civics, and Economics'
      },
      {
        name: 'English',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'Enhance your language and literature skills'
      },
      {
        name: 'Hindi',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'Improve your Hindi language proficiency'
      }
    ];
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/chapter-tests')}
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
            Select Your Subject
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a subject to access chapter-wise tests and start practicing
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <button
                key={subject.name}
                onClick={() => navigate(`/chapter-tests/class-${selectedClass}/${subject.name.toLowerCase().replace(' ', '-')}`)}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-transparent text-left overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${subject.color} opacity-10 rounded-bl-full`}></div>
                
                <div className="relative z-10">
                  <div className={`${subject.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${subject.textColor}`} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {subject.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {subject.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${subject.textColor}`}>
                      View Chapters →
                    </span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${subject.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white text-lg">📚</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            📝 About Class {selectedClass} Tests
          </h3>
          <div className="text-gray-600 space-y-3">
            <p className="text-center">
              All tests are designed according to the latest NCERT curriculum and CBSE guidelines.
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

export default ChapterTestSubjects;