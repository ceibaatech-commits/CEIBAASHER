import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Award, GraduationCap, ArrowRight, Sparkles, Zap, Target,
  BarChart3, Smartphone, Users, Bell, Clock, ChevronRight, Star, Flame,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const PASTEL_CYCLE = [
  { bg: 'bg-[#A7F3D0]', hover: 'group-hover:bg-[#6EE7B7]' },
  { bg: 'bg-[#E9D5FF]', hover: 'group-hover:bg-[#D8B4FE]' },
  { bg: 'bg-[#FFD831]', hover: 'group-hover:bg-[#FACC15]' },
  { bg: 'bg-[#FFBDBE]', hover: 'group-hover:bg-[#FCA5A5]' },
  { bg: 'bg-[#BAE6FD]', hover: 'group-hover:bg-[#7DD3FC]' },
  { bg: 'bg-[#FDE68A]', hover: 'group-hover:bg-[#FCD34D]' },
  { bg: 'bg-[#C7D2FE]', hover: 'group-hover:bg-[#A5B4FC]' },
];

const CLASS_DATA = [
  { num: 6, label: 'Class 6', tag: 'Foundation' },
  { num: 7, label: 'Class 7', tag: 'Foundation' },
  { num: 8, label: 'Class 8', tag: 'Foundation' },
  { num: 9, label: 'Class 9', tag: 'Pre-Board' },
  { num: 10, label: 'Class 10', tag: 'Board Year' },
  { num: 11, label: 'Class 11', tag: 'Stream' },
  { num: 12, label: 'Class 12', tag: 'Board Year' },
];

const STATE_BOARDS = [
  { name: 'Tamil Nadu Board', abbr: 'TNBSE', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjQ-xL8bBH8V0muviqy4ugfn8z3fjC-9RTDAtOkSg4xRky7-GbkbY8nmM&s=10' },
  { name: 'Maharashtra Board', abbr: 'MSBSHSE', logo: 'https://mahahsscboard.in/boardlogo.svg' },
  { name: 'West Bengal Board', abbr: 'WBBSE', logo: 'https://wbbse.wb.gov.in/img/logo.png' },
];

const FEATURES = [
  { icon: Target, title: 'Chapter-wise Practice', desc: 'Focused tests mapped to your textbook chapters', color: 'bg-[#A7F3D0]' },
  { icon: BarChart3, title: 'Track Your Growth', desc: 'Detailed analytics to identify weak areas', color: 'bg-[#E9D5FF]' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Immediate results with detailed explanations', color: 'bg-[#FFD831]' },
  { icon: Users, title: 'Live Competitions', desc: 'Real-time battles with students across India', color: 'bg-[#FFBDBE]' },
  { icon: Smartphone, title: 'Study Anywhere', desc: 'Works on mobile, tablet, and desktop', color: 'bg-[#BAE6FD]' },
  { icon: Sparkles, title: '100% Free Forever', desc: 'No charges, no subscriptions ever', color: 'bg-[#FDE68A]' },
];

const ChapterTestHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();

  const queryBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const [selectedBoard, setSelectedBoard] = useState(queryBoard);

  useEffect(() => {
    setSelectedBoard(queryBoard);
  }, [queryBoard]);

  const boardMeta = {
    cbse: { label: 'CBSE', logo: 'https://www.cbse.gov.in/images//logo.png', hero: 'NCERT Aligned · CBSE 2026', classesText: 'Classes 6–12', classRangeText: '6, 7, 8, 9, 10, 11 & 12', shortClassText: 'Class 6 to 12' },
    rbse: { label: 'Rajasthan Board', logo: 'https://rajeduboard.rajasthan.gov.in/Images/logo-bw.jpg', hero: 'RBSE Aligned · Rajasthan Board 2026', classesText: 'Classes 6–10', classRangeText: '6, 7, 8, 9, 10', shortClassText: 'Class 6 to 10' },
    hbse: { label: 'Haryana Board', logo: 'https://bseh.org.in/logo.png', hero: 'HBSE Aligned · Haryana Board 2026', classesText: 'Classes 6–10', classRangeText: '6, 7, 8, 9, 10', shortClassText: 'Class 6 to 10' },
    upboard: { label: 'UP Board', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH0-G5YTSz055LClxVm5HMPOXdk9YkJUz15fWpWxI2KuK9lCHuba85pRI&usqp=CAE&s', hero: 'UP Board Aligned · UPMSP 2026', classesText: 'Classes 6–10', classRangeText: '6, 7, 8, 9, 10', shortClassText: 'Class 6 to 10' },
    bseb: { label: 'Bihar Board', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTurIRzAozqqvB6oeu6AtsBKajPXAcneI5cfKH3AIJPwQiRss722qGPjc&s=10', hero: 'Bihar Board Aligned · BSEB 2026', classesText: 'Classes 6–10', classRangeText: '6, 7, 8, 9, 10', shortClassText: 'Class 6 to 10' },
    mpbse: { label: 'MP Board', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLa5vNIMOo1x4zzw6gDoPw8j-uZ0ZOyCQCS3ojKlpxIKwOJxI4ERIUELnm&s=10', hero: 'MP Board Aligned · MPBSE 2026', classesText: 'Classes 6–10', classRangeText: '6, 7, 8, 9, 10', shortClassText: 'Class 6 to 10' },
  };
  const activeBoard = boardMeta[selectedBoard] || boardMeta.cbse;
  const boardLabel = activeBoard.label;
  const boardLogo = activeBoard.logo;
  const visibleClasses = selectedBoard === 'cbse' ? CLASS_DATA : CLASS_DATA.filter(({ num }) => num <= 10);

  const handleClassClick = (classNum) => {
    const boardQuery = `?board=${selectedBoard}`;
    if (classNum === 11 || classNum === 12) {
      navigate(`/chapter-tests/class-${classNum}/select-stream${boardQuery}`);
    } else {
      navigate(`/chapter-tests/class-${classNum}${boardQuery}`);
    }
  };

  const handleBoardSelect = (boardId) => {
    setSelectedBoard(boardId);
    navigate(`/chapter-tests?board=${boardId}`);
    setTimeout(() => {
      document.getElementById('class-selection')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
      <SEO
        title={`Free Chapter-wise MCQs & Solutions - ${boardLabel} ${activeBoard.shortClassText}`}
        description={`Practice free chapter-wise MCQs, solutions, and interactive quizzes for ${boardLabel} classes ${activeBoard.classRangeText}. All subjects covered with instant results.`}
        keywords={`chapter wise mcq, solutions, ${boardLabel.toLowerCase()} class ${activeBoard.classRangeText.replace(/,/g, '')}, free mcq test, online quiz`}
        canonical="https://ceibaa.in/chapter-tests"
      />
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1">

        {/* ═══════ HERO — Video Background ═══════ */}
        <section className="relative min-h-[60vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_VIDEO}
            data-testid="hero-video"
          />
          <div className="absolute inset-0 bg-black/55" />

          {/* Floating decorative stickers */}
          <div className="hidden sm:block absolute top-10 left-10 z-10 bg-[#FFD831] border-2 border-[#0A0A0A] rounded-xl px-3 py-2 shadow-[3px_3px_0px_#0A0A0A] rotate-[-6deg]">
            <span className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5" style={{ fontFamily: FONT }}>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
              50k+ learners
            </span>
          </div>
          <div className="hidden sm:block absolute bottom-24 right-12 z-10 bg-[#A7F3D0] border-2 border-[#0A0A0A] rounded-xl px-3 py-2 shadow-[3px_3px_0px_#0A0A0A] rotate-[5deg]">
            <span className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5" style={{ fontFamily: FONT }}>
              <Star className="w-3.5 h-3.5 fill-[#0A0A0A]" strokeWidth={2.5} />
              100% Free
            </span>
          </div>

          <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
            <div
              className="inline-flex items-center gap-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6"
              data-testid="hero-badge"
            >
              <img src={boardLogo} alt={`${boardLabel} logo`} className="w-5 h-5 rounded-sm object-contain bg-white" loading="lazy" />
              <span className="w-2 h-2 bg-[#A7F3D0] rounded-full animate-pulse" />
              <span className="text-white text-xs sm:text-sm font-semibold tracking-wide" style={{ fontFamily: FONT }}>
                {activeBoard.hero}
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.08] mb-4 drop-shadow-lg"
              style={{ fontFamily: FONT, wordSpacing: '0.3em' }}
              data-testid="hero-title"
            >
              Master Every Chapter
              <br />
              <span className="text-[#FFD832]">Ace</span>{' '}
              <span className="text-[#A7F3D0]">Every&nbsp;Exam</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200 max-w-xl mx-auto mb-8 leading-relaxed" style={{ fontFamily: FONT }}>
              Chapter-wise practice tests for {boardLabel} {activeBoard.classesText}. Focused. Free. Built for Indian students.
            </p>

            <button
              onClick={() => document.getElementById('class-selection')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-8 py-4 rounded-xl font-bold text-base sm:text-lg shadow-[4px_4px_0px_#0A0A0A] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all active:translate-y-1.5"
              style={{ fontFamily: FONT }}
              data-testid="hero-cta"
            >
              Start Practicing Now
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <div className="w-7 h-11 border-2 border-white/40 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/60 rounded-full" />
            </div>
          </div>
        </section>

        {/* ═══════ STATS — Overlapping bento ═══════ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-16 relative z-20 mb-16" data-testid="stats-section">
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {[
              { val: '500+', label: 'Chapter Tests', Icon: BookOpen, bg: 'bg-[#A7F3D0]' },
              { val: '10,000+', label: 'Questions', Icon: Award, bg: 'bg-[#E9D5FF]' },
              { val: '7 Classes', label: '6th to 12th', Icon: GraduationCap, bg: 'bg-[#FFD831]' },
            ].map(({ val, label, Icon, bg }) => (
              <div
                key={label}
                className={`${bg} border-2 border-[#0A0A0A] rounded-xl p-3 sm:p-6 text-center shadow-[4px_4px_0px_#0A0A0A]`}
                data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-[2px_2px_0px_#0A0A0A]">
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-[#0A0A0A]" strokeWidth={2.5} />
                </div>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#0A0A0A]" style={{ fontFamily: FONT }}>{val}</p>
                <p className="text-xs sm:text-sm text-[#0A0A0A]/70 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ CLASS SELECTION ═══════ */}
        <section id="class-selection" className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20" data-testid="class-selection-section">
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-block bg-[#0A0A0A] text-[#FFD831] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ fontFamily: FONT }}>
              · Step 1 ·
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A0A0A] mb-2"
              style={{ fontFamily: FONT }}
              data-testid="class-selection-title"
            >
              Select Your Class
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">Pick your class and start solving chapter-wise tests</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleClasses.map(({ num, label, tag }, idx) => {
              const pastel = PASTEL_CYCLE[idx % PASTEL_CYCLE.length];
              return (
                <button
                  key={num}
                  onClick={() => handleClassClick(num)}
                  data-testid={`class-card-${num}`}
                  className="group bg-white border-2 border-[#0A0A0A] rounded-xl p-5 sm:p-6 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-1 hover:-translate-x-0.5 transition-all cursor-pointer flex flex-col items-center text-center relative"
                >
                  {(num === 10 || num === 12) && (
                    <span className="absolute -top-2 -right-2 bg-[#FFBDBE] border-2 border-[#0A0A0A] rounded-full px-2 py-0.5 text-[9px] font-bold shadow-[2px_2px_0px_#0A0A0A] rotate-3">
                      HOT
                    </span>
                  )}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 ${pastel.bg} ${pastel.hover} border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0A0A0A] transition-colors`}>
                    <span className="text-xl sm:text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: FONT }}>{num}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0A0A0A]" style={{ fontFamily: FONT }}>{label}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wide">{tag}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0A0A0A] mt-2 transition-colors" strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════ STATE BOARDS ═══════ */}
        <section className="relative border-y-2 border-[#0A0A0A] bg-gray-50 py-12 sm:py-16 mb-16 sm:mb-20" data-testid="state-boards-section">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <div className="flex-1 h-0.5 bg-[#0A0A0A]/10" />
              <span
                className="text-xs font-semibold text-gray-400 uppercase tracking-[0.08em] whitespace-nowrap"
                style={{ fontFamily: FONT }}
              >
                Board Selector
              </span>
              <div className="flex-1 h-0.5 bg-[#0A0A0A]/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-6" data-testid="state-boards-grid">
              {[
                { id: 'cbse', name: 'CBSE', description: 'Classes 6 to 12', logo: 'https://www.cbse.gov.in/images//logo.png' },
                { id: 'rbse', name: 'Rajasthan Board', description: 'Classes 6 to 10', logo: 'https://rajeduboard.rajasthan.gov.in/Images/logo-bw.jpg' },
                { id: 'hbse', name: 'Haryana Board', description: 'Classes 6 to 10', logo: 'https://bseh.org.in/logo.png' },
                { id: 'upboard', name: 'UP Board', description: 'Classes 6 to 10', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH0-G5YTSz055LClxVm5HMPOXdk9YkJUz15fWpWxI2KuK9lCHuba85pRI&usqp=CAE&s' },
                { id: 'bseb', name: 'Bihar Board', description: 'Classes 6 to 10', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTurIRzAozqqvB6oeu6AtsBKajPXAcneI5cfKH3AIJPwQiRss722qGPjc&s=10' },
                { id: 'mpbse', name: 'MP Board', description: 'Classes 6 to 10', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLa5vNIMOo1x4zzw6gDoPw8j-uZ0ZOyCQCS3ojKlpxIKwOJxI4ERIUELnm&s=10' },
              ].map(({ id, name, description, logo }) => {
                const isActive = selectedBoard === id;
                return (
                  <div
                    key={id}
                    data-testid={`state-board-card-${id}`}
                    onClick={() => handleBoardSelect(id)}
                    className={`bg-white border-2 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center cursor-pointer transition-all ${isActive ? 'border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] -translate-y-0.5' : 'border-gray-300 hover:border-[#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A]'}`}
                  >
                    <div className={`w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-lg overflow-hidden flex items-center justify-center mb-2 border-2 ${isActive ? 'border-[#0A0A0A] bg-[#A7F3D0]' : 'border-gray-200 bg-white'}`}>
                      {logo ? (
                        <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain bg-white" loading="lazy" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-[#0A0A0A]" />
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0A0A0A] leading-tight">{name}</h3>
                    <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5 uppercase">{description}</p>
                    <span className={`inline-flex items-center gap-1 border-2 border-[#0A0A0A] rounded-full px-2 py-0.5 text-[9px] sm:text-xs font-bold mt-2 ${isActive ? 'bg-[#A7F3D0]' : 'bg-[#FDE68A]'}`}>
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2.5} />
                      {isActive ? 'Selected' : 'Tap to choose'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5" data-testid="state-boards-grid-legacy">
              {STATE_BOARDS.map(({ name, abbr, logo }) => (
                <div
                  key={abbr}
                  data-testid={`state-board-card-${abbr}`}
                  className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-5 cursor-default opacity-70 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-lg overflow-hidden flex items-center justify-center mb-2 bg-white border-2 border-gray-200">
                    <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 leading-tight">{name}</h3>
                  <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5 uppercase">{abbr} · Coming Soon</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 sm:mt-10">
              <button
                onClick={() => toast.success(selectedBoard === 'cbse' ? "You'll be notified when your board goes live!" : `${boardLabel} flow is ready.`)}
                className="inline-flex items-center gap-2 bg-[#FFBDBE] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-full px-6 py-3 font-bold text-sm shadow-[4px_4px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
                style={{ fontFamily: FONT }}
                data-testid="notify-state-boards-btn"
              >
                <Bell className="w-4 h-4" strokeWidth={2.5} />
                {selectedBoard === 'cbse' ? 'Notify Me When My Board Launches' : `${selectedBoard.toUpperCase()} Flow Selected`}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES GRID ═══════ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20" data-testid="features-section">
          <div className="text-center mb-8 sm:mb-10">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A0A0A] mb-2"
              style={{ fontFamily: FONT }}
            >
              Everything You Need
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">Built by students, for students</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, idx) => (
              <div
                key={title}
                className="bg-white border-2 border-[#0A0A0A] rounded-xl p-5 sm:p-6 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-1 transition-all"
                data-testid={`feature-card-${idx}`}
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 ${color} border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0A0A0A]`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0A0A0A]" strokeWidth={2.5} />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: FONT }}>{title}</h4>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ WHY CEIBAA ═══════ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20" data-testid="why-ceibaa-section">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[8px_8px_0px_#0A0A0A] overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-6 sm:p-10 flex flex-col justify-center">
                <span
                  className="inline-block bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-3 py-1 rounded-full text-xs font-bold mb-4 w-fit shadow-[2px_2px_0px_#0A0A0A]"
                  style={{ fontFamily: FONT }}
                >
                  MADE FOR INDIA
                </span>
                <h2
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A0A0A] mb-4 leading-tight"
                  style={{ fontFamily: FONT }}
                >
                  Why Ceibaa is Perfect for Indian Students
                </h2>
                <div className="space-y-3">
                  {[
                    { title: 'Gamified Learning', desc: 'Battle friends, compete on leaderboards', color: 'bg-[#A7F3D0]' },
                    { title: '100% NCERT Aligned', desc: 'Mapped to CBSE board exam pattern', color: 'bg-[#E9D5FF]' },
                    { title: 'Live Competitions', desc: 'Earn badges and climb rankings', color: 'bg-[#FFD831]' },
                    { title: '100% Free Forever', desc: 'Quality education for every student', color: 'bg-[#FFBDBE]' },
                  ].map(({ title, desc, color }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className={`w-3 h-3 mt-1.5 ${color} border border-[#0A0A0A] rounded-sm flex-shrink-0`} />
                      <div>
                        <p className="text-sm font-bold text-[#0A0A0A]">{title}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative bg-[#A7F3D0] border-t md:border-t-0 md:border-l-2 border-[#0A0A0A] h-48 md:h-auto md:min-h-[360px]">
                <img
                  src="https://images.pexels.com/photos/5965699/pexels-photo-5965699.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Students studying together"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20" data-testid="final-cta-section">
          <div className="relative bg-[#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl p-8 sm:p-12 text-center overflow-hidden shadow-[8px_8px_0px_#FFD831]">
            <div className="absolute top-4 left-4 w-16 h-16 bg-[#FFD831]/15 rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-4 w-20 h-20 bg-[#A7F3D0]/10 rounded-full blur-2xl" />
            <div className="absolute top-6 right-8 w-4 h-4 bg-[#FFD831] rounded-full opacity-40" />
            <div className="absolute bottom-8 left-12 w-3 h-3 bg-[#E9D5FF] rounded-full opacity-40" />

            <div className="relative z-10">
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight"
                style={{ fontFamily: FONT }}
              >
                Join 50,000+ Students
                <br />
                Across India!
              </h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-6 sm:mb-8">
                Start your journey to exam success with India&apos;s most engaging learning platform
              </p>
              <button
                onClick={() => document.getElementById('class-selection')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-[#FFD831] text-[#0A0A0A] border-2 border-[#FFD831] px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-[4px_4px_0px_rgba(255,216,49,0.3)] hover:translate-y-0.5 hover:shadow-none transition-all"
                style={{ fontFamily: FONT }}
                data-testid="cta-start-learning"
              >
                Start Learning Now — It&apos;s Free!
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestHome;
