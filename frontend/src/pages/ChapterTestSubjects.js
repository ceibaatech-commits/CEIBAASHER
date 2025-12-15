import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { CLASS_COLORS } from '../config/constants';

const ChapterTestSubjects = () => {
  const navigate = useNavigate();
  const { classNumber } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  
  const selectedClass = classNumber?.replace('class-', '') || '';

  // Define subjects based on class
  let subjects = [];
  
  if (selectedClass === '6') {
    subjects = [
      {
        name: 'Hindi - Malhar',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'NCERT Malhar - Hindi Textbook (13 chapters)'
      },
      {
        name: 'Social Science - Exploring Society India and Beyond',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'Geography, History & Civics (14 chapters)'
      },
      {
        name: 'Mathematics - Ganita Prakash',
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        description: 'NCERT Ganita Prakash (10 chapters)'
      },
      {
        name: 'English - Poorvi',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'NCERT Poorvi - English Textbook (5 units)'
      },
      {
        name: 'Science - Curiosity',
        icon: Beaker,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        description: 'NCERT Curiosity - Science (12 chapters)'
      },
      {
        name: 'Sanskrit - Deepakam',
        icon: Languages,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-600',
        description: 'NCERT Deepakam - Sanskrit (15 chapters)'
      }
    ];
  } else if (selectedClass === '7') {
    subjects = [
      {
        name: 'Hindi - Malhar',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'NCERT Malhar - Hindi Textbook (10 chapters)'
      },
      {
        name: 'Science - Curiosity',
        icon: Beaker,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        description: 'NCERT Curiosity - Science (12 chapters)'
      },
      {
        name: 'English - Poorvi',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'NCERT Poorvi - English Textbook (8 chapters)'
      },
      {
        name: 'Social Science - Exploring Society India and Beyond Part 2',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'History - Delhi to Mughal Era (8 chapters)'
      },
      {
        name: 'Social Science - Exploring Society India and Beyond',
        icon: Globe,
        color: 'from-teal-500 to-teal-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        description: 'Geography, Polity & Economics (12 chapters)'
      },
      {
        name: 'Mathematics - Ganita Prakash 1',
        icon: Calculator,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        description: 'NCERT Ganita Prakash Part 1 (8 chapters)'
      },
      {
        name: 'Mathematics - Ganita Prakash 2',
        icon: Calculator,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        description: 'NCERT Ganita Prakash Part 2 (7 chapters)'
      },
      {
        name: 'Sanskrit',
        icon: Languages,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-600',
        description: 'NCERT Sanskrit - (12 chapters)'
      }
    ];
  } else if (selectedClass === '8') {
    // Class 8 has all subjects including English and Hindi books
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
        name: 'English Honeydew',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'NCERT English Textbook'
      },
      {
        name: 'English It So Happened',
        icon: BookOpen,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        description: 'Supplementary Reader'
      },
      {
        name: 'Hindi Vasant',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'NCERT Vasant - Hindi Textbook'
      },
      {
        name: 'Hindi Durva',
        icon: Languages,
        color: 'from-rose-500 to-rose-600',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600',
        description: 'NCERT Durva - Hindi Textbook'
      },
      {
        name: 'Hindi Bharat Ki Khoj',
        icon: Languages,
        color: 'from-fuchsia-500 to-fuchsia-600',
        bgColor: 'bg-fuchsia-100',
        textColor: 'text-fuchsia-600',
        description: 'NCERT Bharat Ki Khoj'
      }
    ];
  } else if (selectedClass === '9') {
    // Class 9 has all 10 subjects including separate Social Science subjects
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
        description: 'Physics, Chemistry, and Biology'
      },
      {
        name: 'Geography',
        icon: Globe,
        color: 'from-teal-500 to-teal-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        description: 'Contemporary India I'
      },
      {
        name: 'History',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'India and the Contemporary World - I'
      },
      {
        name: 'Civics',
        icon: Globe,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        description: 'Democratic Politics - I'
      },
      {
        name: 'Economics',
        icon: Globe,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        description: 'Understanding Economic Development'
      },
      {
        name: 'Hindi Kshitij',
        icon: Languages,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        description: 'NCERT Kshitij - Hindi Textbook'
      },
      {
        name: 'English Beehive Poems',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        description: 'Poetry Collection'
      },
      {
        name: 'English Beehive Prose',
        icon: BookOpen,
        color: 'from-violet-500 to-violet-600',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-600',
        description: 'Prose Stories and Essays'
      },
      {
        name: 'English Moments',
        icon: BookOpen,
        color: 'from-fuchsia-500 to-fuchsia-600',
        bgColor: 'bg-fuchsia-100',
        textColor: 'text-fuchsia-600',
        description: 'Supplementary Reader'
      }
    ];
  } else if (selectedClass === '10') {
    // Class 10 has separate subjects and multiple English/Hindi books
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
        description: 'Physics, Chemistry, and Biology'
      },
      {
        name: 'Economics',
        icon: Globe,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        description: 'Understanding Economic Development'
      },
      {
        name: 'History',
        icon: Globe,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        description: 'India and Contemporary World - II'
      },
      {
        name: 'Civics',
        icon: Globe,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        description: 'Democratic Politics - II'
      },
      {
        name: 'Geography',
        icon: Globe,
        color: 'from-teal-500 to-teal-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-600',
        description: 'Contemporary India II'
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
        onLogin={handleLogin}
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
        {subjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No subjects available for Class {selectedClass}</p>
            <button
              onClick={() => navigate('/chapter-tests')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <button
                  key={subject.name}
                  onClick={() => {
                    const subjectSlug = subject.name.toLowerCase().replace(/\s+/g, '-');
                    navigate(`/chapter-tests/class-${selectedClass}/${subjectSlug}`);
                  }}
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
        )}

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