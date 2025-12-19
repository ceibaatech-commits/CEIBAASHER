import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator, Atom, Brain, Users, Loader2, FlaskConical, Scale, TrendingUp, Landmark, Map, Scroll, Briefcase, Dna } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { CLASS_COLORS } from '../config/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  
  const selectedClass = classNumber?.replace('class-', '') || '';
  
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
        let url = `${BACKEND_URL}/api/cbse-data/subjects/${selectedClass}`;
        if (stream && (selectedClass === '11' || selectedClass === '12')) {
          url += `?stream=${stream}`;
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
            description: `NCERT ${subj.name} Chapters`
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
  }, [selectedClass, stream]);
  
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
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-xl text-gray-600">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : subjects.length === 0 ? (
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