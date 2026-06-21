import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator, Atom, Brain, Users, Loader2, FlaskConical, Scale, TrendingUp, Landmark, Map, Scroll, Briefcase, Dna } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { CLASS_COLORS } from '../config/constants';

const BACKEND_URL = window.location.origin;

// Icon mapping for subjects
const ICON_MAP = {
  'Calculator': Calculator,
  'BookOpen': BookOpen,
  'Languages': Languages,
  'Beaker': Beaker,
  'Globe': Globe,
  'Atom': Atom,
  'Brain': Brain,
  'Flask': FlaskConical,
  'Scale': Scale,
  'TrendingUp': TrendingUp,
  'Landmark': Landmark,
  'Map': Map,
  'Scroll': Scroll,
  'Briefcase': Briefcase,
  'Dna': Dna,
};

const ChapterTestSubjects = () => {
  const navigate = useNavigate();
  const { classNumber, stream } = useParams();
  const location = useLocation();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  
  const selectedClass = classNumber?.replace('class-', '') || '';
  const board = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardLabel = board === 'rbse' ? 'Rajasthan Board' : board === 'hbse' ? 'Haryana Board' : board === 'upboard' ? 'UP Board' : board === 'bseb' ? 'Bihar Board' : board === 'mpbse' ? 'MP Board' : 'CBSE';
  const boardQuery = `?board=${board}`;
  const seoClassLabel = `Class ${selectedClass}`;
  const pageTitle = `${boardLabel} ${seoClassLabel} Subjects - Chapter-wise MCQs & Practice Tests`;
  const pageDescription = `Explore ${boardLabel} ${seoClassLabel} subjects for free chapter-wise MCQs, practice tests, solutions, and quick revision. Start with your subject and move chapter by chapter.`;
  
  // State for subjects from API
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subjects from API (Single Source of Truth)
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${BACKEND_URL}/api/cbse-data/subjects/${selectedClass}?board=${board}`;
        if (stream && (selectedClass === '11' || selectedClass === '12')) {
          url += `&stream=${stream}`;
        }
        
        const response = await axios.get(url);
        if (response.data.success && response.data.subjects) {
          // Map API data to component format
          const mappedSubjects = response.data.subjects.map(subj => ({
            name: subj.name,
            slug: subj.slug,
            icon: ICON_MAP[subj.icon] || BookOpen,
            color: subj.color || 'from-blue-500 to-blue-600',
            bgColor: `bg-${subj.color?.split('-')[1] || 'blue'}-100`,
            textColor: `text-${subj.color?.split('-')[1] || 'blue'}-600`,
            description: `${boardLabel} ${subj.name} Chapters`
          }));
          setSubjects(mappedSubjects);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
        // Fallback to empty array - hardcoded fallback removed for single source of truth
      } finally {
        setLoading(false);
      }
    };

    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass, stream, board]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${boardLabel.toLowerCase()} class ${selectedClass}, ${seoClassLabel.toLowerCase()} subjects, chapter wise mcq, chapter wise practice test, ${boardLabel.toLowerCase()} quiz, free subject wise mock test`}
        canonical={`https://ceibaa.in/chapter-tests/${classNumber}${boardQuery}`}
      />
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/chapter-tests${boardQuery}`)}
          className="inline-flex items-center space-x-2 text-sm sm:text-base text-gray-700 hover:text-cyan-600 mb-5 sm:mb-7 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Class Selection</span>
        </button>

        {/* Header Section */}
        <div className="text-center mb-7 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 sm:px-5 py-2 rounded-full mb-3 sm:mb-4 shadow-lg shadow-cyan-500/20">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em]">{boardLabel}</span>
            <span className="text-white/70">•</span>
            <span className="text-sm sm:text-base font-bold">Class {selectedClass}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3 leading-tight">
            Choose Your Subject
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Start with a subject, then practice chapter-wise MCQs and solutions for {boardLabel} Class {selectedClass}.
          </p>
          {!loading && !error && subjects.length > 0 && (
            <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="rounded-full bg-white/90 border border-cyan-100 px-3 py-1 text-xs sm:text-sm font-semibold text-cyan-700 shadow-sm">
                {subjects.length} subjects available
              </span>
              <span className="rounded-full bg-white/90 border border-purple-100 px-3 py-1 text-xs sm:text-sm font-semibold text-purple-700 shadow-sm">
                Mobile-friendly chapter practice
              </span>
            </div>
          )}
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="text-center py-10 sm:py-12 bg-white rounded-2xl shadow-lg border border-white/70">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="text-base sm:text-xl text-gray-600">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 sm:py-12 bg-white rounded-2xl shadow-lg border border-white/70">
            <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-base sm:text-xl text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-10 sm:py-12 bg-white rounded-2xl shadow-lg border border-white/70">
            <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-base sm:text-xl text-gray-600">No subjects available for Class {selectedClass}</p>
            <p className="text-sm text-gray-500 mt-2 px-4">Upload class-wise sheets in the admin panel and they will appear here automatically.</p>
            <button
              onClick={() => navigate(`/chapter-tests${boardQuery}`)}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <button
                  key={subject.name}
                  onClick={() => {
                    // Use slug from API (Single Source of Truth) or fallback to generated slug
                    const subjectSlug = subject.slug || subject.name.toLowerCase().replace(/ - /g, '---').replace(/\s+/g, '-');
                    if (stream && (selectedClass === '11' || selectedClass === '12')) {
                      navigate(`/chapter-tests/class-${selectedClass}/${stream}/${subjectSlug}${boardQuery}`);
                    } else {
                      navigate(`/chapter-tests/class-${selectedClass}/${subjectSlug}${boardQuery}`);
                    }
                  }}
                  className="group relative bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-cyan-200 text-left overflow-hidden"
                >
                <div className={`absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br ${subject.color} opacity-10 rounded-bl-full`}></div>
                
                <div className="relative z-10">
                  <div className={`${subject.bgColor} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${subject.textColor}`} />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1.5 sm:mb-2 leading-snug pr-8">
                    {subject.name}
                  </h3>
                  
                  <p className="text-sm sm:text-[15px] text-gray-600 mb-4 leading-relaxed min-h-[2.75rem] sm:min-h-[3rem]">
                    {subject.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${subject.textColor}`}>
                      View Chapters →
                    </span>
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${subject.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <span className="text-white text-base sm:text-lg">→</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 sm:mt-10 bg-white rounded-2xl p-5 sm:p-7 shadow-md border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
            About {boardLabel} Class {selectedClass} Subject Practice
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center max-w-3xl mx-auto leading-relaxed">
            This page helps students move from board and class selection into chapter-wise practice quickly. Each subject opens a dedicated chapter list with MCQs, solutions, progress tracking, and test-ready revision.
          </p>
          <div className="text-gray-600 space-y-3 mt-5 sm:mt-6">
            <p className="text-center text-sm sm:text-base">
              All tests are designed according to the latest curriculum and board guidelines for {boardLabel}.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 mt-4 sm:mt-5">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                <span className="text-lg sm:text-2xl">✅</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Subject-wise access</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 px-3 sm:px-4 py-2 rounded-lg">
                <span className="text-lg sm:text-2xl">⏱️</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Fast mobile practice</span>
              </div>
              <div className="flex items-center space-x-2 bg-pink-50 px-3 sm:px-4 py-2 rounded-lg">
                <span className="text-lg sm:text-2xl">📊</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Detailed analytics</span>
              </div>
              <div className="flex items-center space-x-2 bg-orange-50 px-3 sm:px-4 py-2 rounded-lg">
                <span className="text-lg sm:text-2xl">🏆</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Exam-ready revision</span>
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