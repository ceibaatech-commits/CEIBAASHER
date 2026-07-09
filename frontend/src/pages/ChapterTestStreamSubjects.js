import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Beaker, Calculator, TrendingUp, Globe, Users, Brain,
  Sparkles, ChevronRight, BarChart3, Trophy, Zap, Clock, FlaskConical, Atom,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Same pastel cycle used across Home / Subjects / Chapters / Streams
const PASTEL_CYCLE = [
  { bg: 'bg-[#A7F3D0]', accent: '#A7F3D0' },
  { bg: 'bg-[#E9D5FF]', accent: '#E9D5FF' },
  { bg: 'bg-[#FFD831]', accent: '#FFD831' },
  { bg: 'bg-[#FFBDBE]', accent: '#FFBDBE' },
  { bg: 'bg-[#BAE6FD]', accent: '#BAE6FD' },
  { bg: 'bg-[#FDE68A]', accent: '#FDE68A' },
  { bg: 'bg-[#C7D2FE]', accent: '#C7D2FE' },
];

const ChapterTestStreamSubjects = () => {
  const navigate = useNavigate();
  const { classNumber, stream } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  const location = window.location;

  const selectedClass = classNumber?.replace('class-', '') || location.pathname.match(/class-(\d+)/)?.[1];
  const formattedStream = stream ? stream.charAt(0).toUpperCase() + stream.slice(1) : '';
  const selectedBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardQuery = `?board=${selectedBoard}`;
  const boardLabel =
    selectedBoard === 'rbse' ? 'Rajasthan Board' :
    selectedBoard === 'hbse' ? 'Haryana Board' :
    selectedBoard === 'upboard' ? 'UP Board' :
    selectedBoard === 'bseb' ? 'Bihar Board' :
    selectedBoard === 'mpbse' ? 'MP Board' : 'CBSE';

  // Subject mapping for each stream
  const streamSubjects = {
    science: [
      { name: 'Physics',     icon: Atom,          description: 'Mechanics, Electricity, Optics' },
      { name: 'Chemistry',   icon: FlaskConical,  description: 'Physical, Organic, Inorganic' },
      { name: 'Biology',     icon: Brain,         description: 'Botany, Zoology, Ecology' },
      { name: 'Mathematics', icon: Calculator,    description: 'Calculus, Algebra, Geometry' },
      { name: 'English',     icon: BookOpen,      description: 'Literature and Language' },
    ],
    commerce: [
      { name: 'Accountancy',      icon: Calculator,  description: 'Financial Accounting, Cost Accounting' },
      { name: 'Business Studies', icon: TrendingUp,  description: 'Management, Marketing, Finance' },
      { name: 'Economics',        icon: TrendingUp,  description: 'Micro & Macro Economics' },
      { name: 'Mathematics',      icon: Calculator,  description: 'Statistics, Calculus' },
      { name: 'English',          icon: BookOpen,    description: 'Literature and Language' },
    ],
    humanities: [
      { name: 'History',           icon: BookOpen, description: 'Ancient, Medieval, Modern' },
      { name: 'Geography',         icon: Globe,    description: 'Physical, Human Geography' },
      { name: 'Political Science', icon: Users,    description: 'Indian Politics, World Politics' },
      { name: 'Sociology',         icon: Users,    description: 'Society and Social Change' },
      { name: 'Psychology',        icon: Brain,    description: 'Cognitive, Social Psychology' },
      { name: 'English',           icon: BookOpen, description: 'Literature and Language' },
    ],
    arts: [
      { name: 'History',           icon: BookOpen, description: 'Ancient, Medieval, Modern' },
      { name: 'Geography',         icon: Globe,    description: 'Physical, Human Geography' },
      { name: 'Political Science', icon: Users,    description: 'Indian Politics, World Politics' },
      { name: 'Sociology',         icon: Users,    description: 'Society and Social Change' },
      { name: 'Psychology',        icon: Brain,    description: 'Cognitive, Social Psychology' },
      { name: 'English',           icon: BookOpen, description: 'Literature and Language' },
    ],
  };

  const subjects = streamSubjects[stream?.toLowerCase()] || [];

  const handleSubjectClick = (subject) => {
    const subjectSlug = subject.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/chapter-tests/class-${selectedClass}/${stream}/${subjectSlug}${boardQuery}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══════ BACK BUTTON ═══════ */}
        <button
          onClick={() => navigate(`/chapter-tests/class-${selectedClass}/select-stream${boardQuery}`)}
          className="inline-flex items-center gap-2 bg-white border-2 border-[#0A0A0A] rounded-full px-4 py-2 text-sm font-bold text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all mb-6 sm:mb-8"
          data-testid="back-to-stream-btn"
          style={{ fontFamily: FONT }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          <span>Back to Streams</span>
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
            <ChevronRight className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />
            <span className="inline-flex items-center gap-1.5 bg-[#E9D5FF] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A] uppercase">
              {formattedStream}
            </span>
            {subjects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-[#BAE6FD] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
                {subjects.length} Subjects
              </span>
            )}
          </div>

          <span className="inline-block bg-[#0A0A0A] text-[#FFD831] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ fontFamily: FONT }}>
            · Step 3 ·
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#0A0A0A] leading-tight mb-3" style={{ fontFamily: FONT }} data-testid="page-title">
            Pick a <span className="bg-[#FFD831] border-2 border-[#0A0A0A] px-2 inline-block rotate-[-1deg] shadow-[3px_3px_0px_#0A0A0A]">Subject</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed">
            {formattedStream} stream subjects for {boardLabel} Class {selectedClass}. Practice chapter-by-chapter.
          </p>
        </div>

        {/* ═══════ SUBJECTS GRID ═══════ */}
        {subjects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#0A0A0A] rounded-2xl p-10 text-center" data-testid="empty-state">
            <BookOpen className="w-14 h-14 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-bold text-[#0A0A0A] mb-1">No subjects available for this stream</p>
            <p className="text-sm text-gray-500 mb-4">Please pick another stream.</p>
            <button
              onClick={() => navigate(`/chapter-tests/class-${selectedClass}/select-stream${boardQuery}`)}
              className="bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-5 py-2.5 rounded-lg font-bold text-sm shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all"
            >
              Back to Streams
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
                  data-testid={`subject-card-${subject.name.toLowerCase().replace(/\s+/g, '-')}`}
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
        {subjects.length > 0 && (
          <div className="mt-10 sm:mt-14 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden" data-testid="info-strip">
            <div className="bg-[#0A0A0A] px-5 sm:px-7 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#A7F3D0] rounded-full animate-pulse" />
              <p className="text-[#FFD831] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]" style={{ fontFamily: FONT }}>
                About Class {selectedClass} · {formattedStream}
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-sm sm:text-base text-gray-600 mb-5 leading-relaxed">
                Each subject opens chapter-wise MCQs, solutions, and progress tracking — fully aligned with the latest {boardLabel} {formattedStream} curriculum.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: BookOpen, label: 'NCERT Based', bg: 'bg-[#A7F3D0]' },
                  { Icon: Zap, label: 'Timed Tests', bg: 'bg-[#FFD831]' },
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

export default ChapterTestStreamSubjects;
