import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator, 
  Atom, Brain, Users, Loader2, FlaskConical, Scale, TrendingUp, 
  Landmark, Map, Scroll, Briefcase, Dna, Clock, BarChart3, Award, 
  ChevronRight, GraduationCap
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
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
  'Flask': FlaskConical,
  'Globe': Globe,
  'Atom': Atom,
  'Brain': Brain,
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
  const pageTitle = `${boardLabel} ${seoClassLabel} Subjects | Ceibaa`;
  const pageDescription = `Explore ${boardLabel} ${seoClassLabel} subjects for free chapter-wise MCQs, practice tests, and detailed NCERT solutions.`;
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          const mappedSubjects = response.data.subjects.map(subj => ({
            name: subj.name,
            slug: subj.slug,
            icon: ICON_MAP[subj.icon] || BookOpen,
            color: subj.color || 'from-violet-500 to-violet-600',
            bgColor: `bg-violet-50/50 border-violet-100`,
            textColor: `text-[#7c5cff]`,
            description: `${boardLabel} Class ${selectedClass} ${subj.name} syllabus chapters.`
          }));
          setSubjects(mappedSubjects);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects for this class');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass, stream, board]);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FF] text-slate-800">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${boardLabel.toLowerCase()} class ${selectedClass}, ${seoClassLabel.toLowerCase()} subjects, chapter wise mcq, free subject wise mock test`}
        canonical={`https://ceibaa.in/chapter-tests/${classNumber}${boardQuery}`}
      />
      
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate(`/chapter-tests${boardQuery}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-455 hover:text-[#7c5cff] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Syllabus Index</span>
        </button>

        {/* Head description */}
        <section className="py-2 border-b border-slate-100/60 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-violet-50 text-[#7c5cff] text-[10px] font-extrabold uppercase tracking-wider border border-violet-100/50">
                <GraduationCap className="w-3.5 h-3.5 text-[#7c5cff]" />
                {boardLabel} · Class {selectedClass} {stream ? `(${stream.toUpperCase()})` : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Choose Subject
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Select a subject to access its chapter-wise mock tests
            </p>
          </div>

          {!loading && !error && subjects.length > 0 && (
            <span className="rounded-xl bg-slate-50 border border-slate-200/50 px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm shrink-0 self-start sm:self-auto">
              {subjects.length} Subjects available
            </span>
          )}
        </section>

        {/* Subjects Grid layout */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#7c5cff] animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-400">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <BookOpen className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-550">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#7c5cff] hover:bg-[#6a4ce4] text-white rounded-xl text-xs font-bold transition-all"
            >
              Retry Loading
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-550">No subjects loaded for Class {selectedClass}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Upload the chapter sheet in the administrator dashboard to show active content.</p>
            <button
              onClick={() => navigate(`/chapter-tests${boardQuery}`)}
              className="mt-4 px-4 py-2 bg-[#7c5cff] hover:bg-[#6a4ce4] text-white rounded-xl text-xs font-bold transition-all"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <button
                  key={subject.name}
                  onClick={() => {
                    const subjectSlug = subject.slug || subject.name.toLowerCase().replace(/ - /g, '---').replace(/\s+/g, '-');
                    if (stream && (selectedClass === '11' || selectedClass === '12')) {
                      navigate(`/chapter-tests/class-${selectedClass}/${stream}/${subjectSlug}${boardQuery}`);
                    } else {
                      navigate(`/chapter-tests/class-${selectedClass}/${subjectSlug}${boardQuery}`);
                    }
                  }}
                  className="group bg-white hover:bg-slate-50/20 border border-slate-250/60 hover:border-violet-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 text-left flex items-start gap-4 active:scale-95 w-full"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105 ${subject.bgColor}`}>
                    <Icon className={`w-5 h-5 ${subject.textColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-800 leading-tight group-hover:text-[#7c5cff] transition-colors truncate">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-450 font-semibold leading-relaxed mt-1 line-clamp-2">
                      {subject.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] font-extrabold text-[#7c5cff] uppercase tracking-wider">
                      <span>View chapters</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Platform Info Section (Lucide Icons, No Emojis) */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              About {boardLabel} Class {selectedClass} Practice
            </h2>
          </div>
          <p className="text-xs text-slate-455 font-semibold leading-relaxed">
            This workspace assists students to transition directly into mock quizzes and revisions. Select a subject above to explore its chapters. All questions are reviewed against the latest CBSE and NCERT textbook guidelines.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { icon: BookOpen, label: 'Subject-wise syllabus' },
              { icon: Clock, label: 'Instant mobile speed' },
              { icon: BarChart3, label: 'Performance analytics' },
              { icon: Award, label: 'Board-level revisions' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100/80 bg-slate-50/50">
                <item.icon className="w-4 h-4 text-[#7c5cff]" />
                <span className="text-[10px] font-extrabold text-slate-650 leading-none">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestSubjects;