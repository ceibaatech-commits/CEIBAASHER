import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Beaker, Globe, Languages, Calculator, Atom, Brain,
  Users, Loader2, FlaskConical, Scale, TrendingUp, Landmark, Map, Scroll,
  Briefcase, Dna, Sparkles, ChevronRight, BarChart3, Trophy, Zap, Clock,
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

const BACKEND_URL = window.location.origin;
const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const ICON_MAP = {
  Calculator, BookOpen, Languages, Beaker, Globe, Atom, Brain,
  Flask: FlaskConical, Scale, TrendingUp, Landmark, Map, Scroll, Briefcase, Dna,
};

// Same pastel cycle as home for visual continuity
const PASTEL_CYCLE = [
  { bg: 'bg-[#A7F3D0]', accent: '#A7F3D0', label: 'mint' },
  { bg: 'bg-[#E9D5FF]', accent: '#E9D5FF', label: 'lavender' },
  { bg: 'bg-[#FFD831]', accent: '#FFD831', label: 'yellow' },
  { bg: 'bg-[#FFBDBE]', accent: '#FFBDBE', label: 'peach' },
  { bg: 'bg-[#BAE6FD]', accent: '#BAE6FD', label: 'sky' },
  { bg: 'bg-[#FDE68A]', accent: '#FDE68A', label: 'butter' },
  { bg: 'bg-[#C7D2FE]', accent: '#C7D2FE', label: 'periwinkle' },
];

const ChapterTestSubjects = () => {
  const navigate = useNavigate();
  const { classNumber, stream } = useParams();
  const location = useLocation();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();

  const selectedClass = classNumber?.replace('class-', '') || '';
  const board = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardLabel =
    board === 'rbse' ? 'Rajasthan Board' :
    board === 'hbse' ? 'Haryana Board' :
    board === 'upboard' ? 'UP Board' :
    board === 'bseb' ? 'Bihar Board' :
    board === 'mpbse' ? 'MP Board' : 'CBSE';
  const boardQuery = `?board=${board}`;
  const seoClassLabel = `Class ${selectedClass}`;
  const pageTitle = `${boardLabel} ${seoClassLabel} Subjects - Chapter-wise MCQs & Practice Tests`;
  const pageDescription = `Explore ${boardLabel} ${seoClassLabel} subjects for free chapter-wise MCQs, practice tests, solutions, and quick revision. Start with your subject and move chapter by chapter.`;

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
          const mappedSubjects = response.data.subjects.map((subj) => ({
            name: subj.name,
            slug: subj.slug,
            icon: ICON_MAP[subj.icon] || BookOpen,
            description: `${boardLabel} ${subj.name} chapters`,
          }));
          setSubjects(mappedSubjects);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClass) fetchSubjects();
  }, [selectedClass, stream, board, boardLabel]);

  const handleSubjectClick = (subject) => {
    const subjectSlug = subject.slug || subject.name.toLowerCase().replace(/ - /g, '---').replace(/\s+/g, '-');
    if (stream && (selectedClass === '11' || selectedClass === '12')) {
      navigate(`/chapter-tests/class-${selectedClass}/${stream}/${subjectSlug}${boardQuery}`);
    } else {
      navigate(`/chapter-tests/class-${selectedClass}/${subjectSlug}${boardQuery}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${boardLabel.toLowerCase()} class ${selectedClass}, ${seoClassLabel.toLowerCase()} subjects, chapter wise mcq, chapter wise practice test, ${boardLabel.toLowerCase()} quiz, free subject wise mock test`}
        canonical={`https://ceibaa.in/chapter-tests/${classNumber}${boardQuery}`}
      />
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══════ BREADCRUMB & BACK ═══════ */}
        <button
          onClick={() => navigate(`/chapter-tests${boardQuery}`)}
          className="inline-flex items-center gap-2 bg-white border-2 border-[#0A0A0A] rounded-full px-4 py-2 text-sm font-bold text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all mb-6 sm:mb-8"
          data-testid="back-to-class-btn"
          style={{ fontFamily: FONT }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          <span>Back to Class</span>
        </button>

        {/* ═══════ HEADER ═══════ */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="page-chips">
            <span className="inline-flex items-center gap-1.5 bg-[#FFD831] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              {boardLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#A7F3D0] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              Class {selectedClass}
            </span>
            {stream && (
              <span className="inline-flex items-center gap-1.5 bg-[#E9D5FF] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A] uppercase">
                {stream}
              </span>
            )}
            {!loading && !error && subjects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-[#BAE6FD] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
                {subjects.length} Subjects
              </span>
            )}
          </div>

          <span className="inline-block bg-[#0A0A0A] text-[#FFD831] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ fontFamily: FONT }}>
            · Step 2 ·
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#0A0A0A] leading-tight mb-3" style={{ fontFamily: FONT }} data-testid="page-title">
            Pick a <span className="bg-[#FFD831] border-2 border-[#0A0A0A] px-2 inline-block rotate-[-1deg] shadow-[3px_3px_0px_#0A0A0A]">Subject</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed">
            Start with one. Practice chapter-by-chapter. Track your progress for {boardLabel} Class {selectedClass}.
          </p>
        </div>

        {/* ═══════ SUBJECTS GRID ═══════ */}
        {loading ? (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-10 text-center shadow-[4px_4px_0px_#0A0A0A]" data-testid="loading-state">
            <Loader2 className="w-10 h-10 text-[#0A0A0A] mx-auto mb-3 animate-spin" strokeWidth={2.5} />
            <p className="text-base font-bold text-[#0A0A0A]">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="bg-[#FFBDBE] border-2 border-[#0A0A0A] rounded-2xl p-10 text-center shadow-[4px_4px_0px_#0A0A0A]" data-testid="error-state">
            <BookOpen className="w-14 h-14 text-[#0A0A0A] mx-auto mb-3" strokeWidth={2.5} />
            <p className="text-base font-bold text-[#0A0A0A] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] px-5 py-2.5 rounded-lg font-bold text-sm shadow-[3px_3px_0px_#FFD831] hover:translate-y-0.5 transition-all"
              data-testid="retry-btn"
            >
              Retry
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#0A0A0A] rounded-2xl p-10 text-center" data-testid="empty-state">
            <BookOpen className="w-14 h-14 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-bold text-[#0A0A0A] mb-1">No subjects yet for Class {selectedClass}</p>
            <p className="text-sm text-gray-500 mb-4">Upload class-wise sheets in admin panel — they appear here automatically.</p>
            <button
              onClick={() => navigate(`/chapter-tests${boardQuery}`)}
              className="bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-5 py-2.5 rounded-lg font-bold text-sm shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="subjects-grid">
            {subjects.map((subject, idx) => {
              const pastel = PASTEL_CYCLE[idx % PASTEL_CYCLE.length];
              const Icon = subject.icon;
              return (
                <button
                  key={subject.name}
                  onClick={() => handleSubjectClick(subject)}
                  data-testid={`subject-card-${subject.slug || subject.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group relative bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-1 hover:-translate-x-0.5 transition-all text-left overflow-hidden"
                >
                  {/* Decorative corner accent */}
                  <div
                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full border-2 border-[#0A0A0A] opacity-30 group-hover:opacity-60 transition-opacity"
                    style={{ background: pastel.accent }}
                  />

                  {/* Icon */}
                  <div className={`relative w-14 h-14 sm:w-16 sm:h-16 ${pastel.bg} border-2 border-[#0A0A0A] rounded-xl flex items-center justify-center mb-4 shadow-[3px_3px_0px_#0A0A0A] group-hover:rotate-[-4deg] transition-transform`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#0A0A0A]" strokeWidth={2.5} />
                  </div>

                  {/* Title */}
                  <h3 className="relative text-lg sm:text-xl font-bold text-[#0A0A0A] mb-1 leading-tight" style={{ fontFamily: FONT }}>
                    {subject.name}
                  </h3>
                  <p className="relative text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
                    {subject.description}
                  </p>

                  {/* CTA Row */}
                  <div className="relative flex items-center justify-between pt-3 border-t-2 border-dashed border-[#0A0A0A]/20">
                    <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                      View chapters
                    </span>
                    <div className={`w-9 h-9 ${pastel.bg} border-2 border-[#0A0A0A] rounded-full flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] group-hover:translate-x-1 transition-transform`}>
                      <ChevronRight className="w-4 h-4 text-[#0A0A0A]" strokeWidth={3} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ═══════ INFO STRIP ═══════ */}
        {!loading && !error && subjects.length > 0 && (
          <div className="mt-10 sm:mt-14 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden" data-testid="info-strip">
            <div className="bg-[#0A0A0A] px-5 sm:px-7 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#A7F3D0] rounded-full animate-pulse" />
              <p className="text-[#FFD831] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]" style={{ fontFamily: FONT }}>
                About {boardLabel} · Class {selectedClass}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-sm sm:text-base text-gray-600 mb-5 leading-relaxed">
                Each subject opens a dedicated chapter list with MCQs, solutions, progress tracking, and test-ready revision — designed around the latest {boardLabel} curriculum.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: BookOpen, label: 'Subject-wise', bg: 'bg-[#A7F3D0]' },
                  { Icon: Zap, label: 'Fast practice', bg: 'bg-[#FFD831]' },
                  { Icon: BarChart3, label: 'Analytics', bg: 'bg-[#E9D5FF]' },
                  { Icon: Trophy, label: 'Exam-ready', bg: 'bg-[#FFBDBE]' },
                ].map(({ Icon, label, bg }) => (
                  <div
                    key={label}
                    className={`${bg} border-2 border-[#0A0A0A] rounded-xl p-3 flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A]`}
                  >
                    <Icon className="w-4 h-4 text-[#0A0A0A] flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestSubjects;
