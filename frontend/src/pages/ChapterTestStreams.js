import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Atom, TrendingUp, BookOpen, Sparkles, ChevronRight,
  Clock, BarChart3, Trophy, Zap, GraduationCap,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Neo-brutalist pastel cycle matching Home/Subjects/Chapters
const STREAM_CONFIG = [
  {
    name: 'Science',
    icon: Atom,
    bg: 'bg-[#BAE6FD]',
    description: 'Physics, Chemistry, Biology, Mathematics',
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English'],
    tag: 'PCM / PCB',
  },
  {
    name: 'Commerce',
    icon: TrendingUp,
    bg: 'bg-[#A7F3D0]',
    description: 'Accountancy, Business Studies, Economics',
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'],
    tag: 'Business',
  },
  {
    name: 'Humanities',
    icon: BookOpen,
    bg: 'bg-[#E9D5FF]',
    description: 'History, Geography, Political Science, Sociology',
    subjects: ['History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'English'],
    tag: 'Arts',
  },
];

const ChapterTestStreams = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { classNumber } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();

  const selectedClass = classNumber?.replace('class-', '') || location.pathname.match(/class-(\d+)/)?.[1];
  const selectedBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardQuery = `?board=${selectedBoard}`;
  const boardLabel =
    selectedBoard === 'rbse' ? 'Rajasthan Board' :
    selectedBoard === 'hbse' ? 'Haryana Board' :
    selectedBoard === 'upboard' ? 'UP Board' :
    selectedBoard === 'bseb' ? 'Bihar Board' :
    selectedBoard === 'mpbse' ? 'MP Board' : 'CBSE';

  const handleStreamSelect = (stream) => {
    const streamSlug = stream.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/chapter-tests/class-${selectedClass}/${streamSlug}${boardQuery}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══════ BACK BUTTON ═══════ */}
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
            <span className="inline-flex items-center gap-1.5 bg-[#BAE6FD] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              3 Streams
            </span>
          </div>

          <span className="inline-block bg-[#0A0A0A] text-[#FFD831] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ fontFamily: FONT }}>
            · Step 2 ·
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#0A0A0A] leading-tight mb-3" style={{ fontFamily: FONT }} data-testid="page-title">
            Pick a <span className="bg-[#FFD831] border-2 border-[#0A0A0A] px-2 inline-block rotate-[-1deg] shadow-[3px_3px_0px_#0A0A0A]">Stream</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed">
            Choose your stream to unlock subject-wise chapter tests for {boardLabel} Class {selectedClass}.
          </p>
        </div>

        {/* ═══════ STREAMS GRID ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10" data-testid="streams-grid">
          {STREAM_CONFIG.map((stream) => {
            const Icon = stream.icon;
            return (
              <button
                key={stream.name}
                onClick={() => handleStreamSelect(stream)}
                data-testid={`stream-card-${stream.name.toLowerCase()}`}
                className="group relative bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-1 hover:-translate-x-0.5 transition-all text-left overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div className={`absolute -top-10 -right-10 w-28 h-28 ${stream.bg} border-2 border-[#0A0A0A] rounded-full opacity-40 group-hover:opacity-70 transition-opacity`} />

                {/* Tag pill (top-right) */}
                <span className="relative inline-flex items-center gap-1 bg-[#0A0A0A] text-[#FFD831] border-2 border-[#0A0A0A] rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-4">
                  {stream.tag}
                </span>

                {/* Icon */}
                <div className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] ${stream.bg} border-2 border-[#0A0A0A] rounded-xl flex items-center justify-center mb-4 shadow-[3px_3px_0px_#0A0A0A] group-hover:rotate-[-4deg] transition-transform`}>
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#0A0A0A]" strokeWidth={2.5} />
                </div>

                {/* Title */}
                <h3 className="relative text-xl sm:text-2xl font-bold text-[#0A0A0A] mb-1 leading-tight" style={{ fontFamily: FONT }}>
                  {stream.name}
                </h3>
                <p className="relative text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
                  {stream.description}
                </p>

                {/* Subjects pills */}
                <div className="relative flex flex-wrap gap-1.5 mb-5 pb-5 border-b-2 border-dashed border-[#0A0A0A]/20">
                  {stream.subjects.slice(0, 4).map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center bg-white border-2 border-[#0A0A0A] rounded-full px-2 py-0.5 text-[10px] font-bold text-[#0A0A0A]"
                    >
                      {sub}
                    </span>
                  ))}
                  {stream.subjects.length > 4 && (
                    <span className="inline-flex items-center bg-[#0A0A0A] text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
                      +{stream.subjects.length - 4}
                    </span>
                  )}
                </div>

                {/* CTA Row */}
                <div className="relative flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                    View subjects
                  </span>
                  <div className={`w-9 h-9 ${stream.bg} border-2 border-[#0A0A0A] rounded-full flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] group-hover:translate-x-1 transition-transform`}>
                    <ChevronRight className="w-4 h-4 text-[#0A0A0A]" strokeWidth={3} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ═══════ INFO STRIP ═══════ */}
        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden" data-testid="info-strip">
          <div className="bg-[#0A0A0A] px-5 sm:px-7 py-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#A7F3D0] rounded-full animate-pulse" />
            <p className="text-[#FFD831] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]" style={{ fontFamily: FONT }}>
              About {boardLabel} · Class {selectedClass}
            </p>
          </div>

          <div className="p-5 sm:p-7">
            <p className="text-sm sm:text-base text-gray-600 mb-5 leading-relaxed">
              Each stream opens its own subject list with chapter-wise MCQs, solutions, and progress tracking — built around the latest {boardLabel} curriculum.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { Icon: GraduationCap, label: 'NCERT Based', bg: 'bg-[#A7F3D0]' },
                { Icon: Clock, label: 'Timed Tests', bg: 'bg-[#FFD831]' },
                { Icon: BarChart3, label: 'Analytics', bg: 'bg-[#E9D5FF]' },
                { Icon: Trophy, label: 'Performance', bg: 'bg-[#FFBDBE]' },
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

      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestStreams;
