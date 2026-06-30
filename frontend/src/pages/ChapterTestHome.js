import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  BookOpen, Award, GraduationCap, ArrowRight, 
  Zap, Target, BarChart3, Smartphone, Users, Bell, Clock, 
  ChevronRight, Play, Star, Search, CheckCircle, ChevronDown, BarChart
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const STATE_BOARDS = [
  { id: 'cbse', name: 'CBSE', code: 'Central Board' },
  { id: 'rbse', name: 'Rajasthan Board', code: 'RBSE' },
  { id: 'hbse', name: 'Haryana Board', code: 'HBSE' },
  { id: 'upboard', name: 'UP Board', code: 'UPMSP' },
  { id: 'bseb', name: 'Bihar Board', code: 'BSEB' },
  { id: 'mpbse', name: 'MP Board', code: 'MPBSE' },
];

const CLASS_SYLLABUS = [
  {
    num: 6,
    label: 'Class 6',
    type: 'middle',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics---ganita-prakash', color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Science', slug: 'science---curiosity', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { name: 'Social Science', slug: 'social-science---exploring-society', color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'English', slug: 'english---poorvi', color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'Hindi', slug: 'hindi---malhar', color: 'text-amber-600 bg-amber-50 border-amber-100' },
      { name: 'Sanskrit', slug: 'sanskrit---deepakam', color: 'text-rose-600 bg-rose-50 border-rose-100' }
    ]
  },
  {
    num: 7,
    label: 'Class 7',
    type: 'middle',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics---ganita-prakash', color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Science', slug: 'science---curiosity', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { name: 'Social Science', slug: 'social-science---exploring-society', color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'English', slug: 'english---poorvi', color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'Hindi', slug: 'hindi---malhar', color: 'text-amber-600 bg-amber-50 border-amber-100' },
      { name: 'Sanskrit', slug: 'sanskrit---sulabha', color: 'text-rose-600 bg-rose-50 border-rose-100' }
    ]
  },
  {
    num: 8,
    label: 'Class 8',
    type: 'middle',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics', color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Science', slug: 'science', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { name: 'Social Science', slug: 'social-science', color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'English', slug: 'english---poorvi', color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'Hindi', slug: 'hindi---malhar', color: 'text-amber-600 bg-amber-50 border-amber-100' },
      { name: 'Sanskrit', slug: 'sanskrit---deepakam', color: 'text-rose-600 bg-rose-50 border-rose-100' }
    ]
  },
  {
    num: 9,
    label: 'Class 9',
    type: 'secondary',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics', color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Science', slug: 'science', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { name: 'Geography', slug: 'geography', color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'History', slug: 'history', color: 'text-amber-600 bg-amber-50 border-amber-100' },
      { name: 'Civics', slug: 'civics', color: 'text-teal-600 bg-teal-50 border-teal-100' },
      { name: 'Economics', slug: 'economics', color: 'text-rose-600 bg-rose-50 border-rose-100' },
      { name: 'English Beehive', slug: 'english-beehive', color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'English Moments', slug: 'english-moments', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
      { name: 'Hindi Kshitij', slug: 'hindi-kshitij', color: 'text-orange-600 bg-orange-50 border-orange-100' },
      { name: 'Sanskrit', slug: 'sanskrit', color: 'text-red-600 bg-red-50 border-red-100' }
    ]
  },
  {
    num: 10,
    label: 'Class 10',
    type: 'secondary',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics', color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Science', slug: 'science', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { name: 'Social Science', slug: 'social-science', color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'Economics', slug: 'economics', color: 'text-rose-600 bg-rose-50 border-rose-100' },
      { name: 'English First Flight', slug: 'english-first-flight', color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'English Footprints', slug: 'english-footprints-without-feet', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
      { name: 'Hindi Kshitij', slug: 'hindi-kshitij', color: 'text-orange-600 bg-orange-55 border-orange-100' },
      { name: 'Hindi Kritika', slug: 'hindi-kritika', color: 'text-orange-500 bg-orange-50/50 border-orange-100' },
      { name: 'Sanskrit', slug: 'sanskrit', color: 'text-red-600 bg-red-50 border-red-100' }
    ]
  },
  {
    num: 11,
    label: 'Class 11',
    type: 'senior',
    streams: [
      {
        name: 'Science',
        subjects: [
          { name: 'Physics', slug: 'physics', stream: 'science', color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { name: 'Chemistry', slug: 'chemistry', stream: 'science', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { name: 'Mathematics', slug: 'mathematics', stream: 'science', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Biology', slug: 'biology', stream: 'science', color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { name: 'English', slug: 'english', stream: 'science', color: 'text-orange-600 bg-orange-50 border-orange-100' }
        ]
      },
      {
        name: 'Commerce',
        subjects: [
          { name: 'Accountancy', slug: 'accountancy', stream: 'commerce', color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { name: 'Business Studies', slug: 'business-studies', stream: 'commerce', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Economics', slug: 'economics', stream: 'commerce', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { name: 'Mathematics', slug: 'mathematics', stream: 'commerce', color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { name: 'English', slug: 'english', stream: 'commerce', color: 'text-orange-600 bg-orange-50 border-orange-100' }
        ]
      },
      {
        name: 'Humanities',
        subjects: [
          { name: 'History', slug: 'history', stream: 'humanities', color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { name: 'Political Science', slug: 'political-science', stream: 'humanities', color: 'text-blue-605 bg-blue-50 border-blue-100' },
          { name: 'Geography', slug: 'geography', stream: 'humanities', color: 'text-emerald-600 bg-emerald-50 border-emerald-150' },
          { name: 'Sociology', slug: 'sociology', stream: 'humanities', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Psychology', slug: 'psychology', stream: 'humanities', color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { name: 'Economics', slug: 'economics', stream: 'humanities', color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { name: 'English', slug: 'english', stream: 'humanities', color: 'text-orange-600 bg-orange-55 border-orange-100' }
        ]
      }
    ]
  },
  {
    num: 12,
    label: 'Class 12',
    type: 'senior',
    streams: [
      {
        name: 'Science',
        subjects: [
          { name: 'Physics', slug: 'physics', stream: 'science', color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { name: 'Chemistry', slug: 'chemistry', stream: 'science', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { name: 'Mathematics', slug: 'mathematics', stream: 'science', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Biology', slug: 'biology', stream: 'science', color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { name: 'English', slug: 'english', stream: 'science', color: 'text-orange-600 bg-orange-50 border-orange-100' }
        ]
      },
      {
        name: 'Commerce',
        subjects: [
          { name: 'Accountancy', slug: 'accountancy', stream: 'commerce', color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { name: 'Business Studies', slug: 'business-studies', stream: 'commerce', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Economics', slug: 'economics', stream: 'commerce', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { name: 'Mathematics', slug: 'mathematics', stream: 'commerce', color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { name: 'English', slug: 'english', stream: 'commerce', color: 'text-orange-600 bg-orange-50 border-orange-100' }
        ]
      },
      {
        name: 'Humanities',
        subjects: [
          { name: 'History', slug: 'history', stream: 'humanities', color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { name: 'Political Science', slug: 'political-science', stream: 'humanities', color: 'text-blue-605 bg-blue-50 border-blue-100' },
          { name: 'Geography', slug: 'geography', stream: 'humanities', color: 'text-emerald-600 bg-emerald-50 border-emerald-150' },
          { name: 'Sociology', slug: 'sociology', stream: 'humanities', color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { name: 'Psychology', slug: 'psychology', stream: 'humanities', color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { name: 'Economics', slug: 'economics', stream: 'humanities', color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { name: 'English', slug: 'english', stream: 'humanities', color: 'text-orange-600 bg-orange-55 border-orange-100' }
        ]
      }
    ]
  }
];

const FEATURES = [
  { icon: Target, title: 'Chapter-wise Practice', desc: 'Assess your level of understanding by solving curated quizzes mapped to standard curriculum chapters.' },
  { icon: BarChart3, title: 'Diagnostic Growth', desc: 'Identify your weak areas and track your overall improvements with statistics.' },
  { icon: Users, title: 'Live Friend Battles', desc: 'Join online custom quiz lobbies using PIN codes to test speed and accuracy.' },
];

const ChapterTestHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();

  const queryBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const [selectedBoard, setSelectedBoard] = useState(queryBoard);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setSelectedBoard(queryBoard);
  }, [queryBoard]);

  const boardMeta = {
    cbse: { label: 'CBSE', hero: 'NCERT Aligned · CBSE 2026', classesText: 'Classes 6–12' },
    rbse: { label: 'Rajasthan Board', hero: 'RBSE Aligned · Rajasthan Board 2026', classesText: 'Classes 6–12' },
    hbse: { label: 'Haryana Board', hero: 'HBSE Aligned · Haryana 2026', classesText: 'Classes 6–12' },
    upboard: { label: 'UP Board', hero: 'UP Board Aligned · UPMSP 2026', classesText: 'Classes 6–12' },
    bseb: { label: 'Bihar Board', hero: 'Bihar Board Aligned · BSEB 2026', classesText: 'Classes 6–12' },
    mpbse: { label: 'MP Board', hero: 'MP Board Aligned · MPBSE 2026', classesText: 'Classes 6–12' }
  };
  
  const activeBoard = boardMeta[selectedBoard] || boardMeta.cbse;
  const boardLabel = activeBoard.label;

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
  };

  // Structured FAQ JSON-LD Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are these chapter-wise tests free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all chapter-wise tests, detailed textbook solutions, and live battle room practice quizzes on Ceibaa are 100% free for all students."
        }
      },
      {
        "@type": "Question",
        "name": "Is the content aligned with the latest CBSE syllabus?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Our practice questions are mapped to the latest NCERT textbooks and align with the CBSE 2026 exam patterns."
        }
      },
      {
        "@type": "Question",
        "name": "How does the Performance Tracker help me?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Performance Tracker records your score trends, speed, and accuracy per chapter, showing you exactly which concepts need revision before the final exams."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use Ceibaa on my mobile phone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Ceibaa is fully optimized for mobile browsers, so you can practice quizzes and review solutions anywhere, anytime."
        }
      }
    ]
  };

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalWebSite",
    "name": `Ceibaa Chapter Tests - ${boardLabel}`,
    "url": "https://ceibaa.in/chapter-tests",
    "description": `Practice free chapter-wise MCQs, NCERT solutions, and online mock quizzes for ${boardLabel} classes.`,
    "educationalLevel": `${activeBoard.classesText}`,
    "inLanguage": "en",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "INR"
    }
  };

  const filteredSyllabus = CLASS_SYLLABUS;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FF] text-slate-800">
      <SEO
        title="Free Chapter-wise MCQs & NCERT Solutions | Ceibaa"
        description="Practice free chapter-wise tests and NCERT practice questions. Track your growth with our performance tracker for board and CBSE exam preparation."
        keywords={`${boardLabel.toLowerCase()} mcq, ${boardLabel.toLowerCase()} class 10 mcq, ncert solutions chapter wise, free online quizzes for students, cbse mock test online`}
        canonical="https://ceibaa.in/chapter-tests"
      />
      
      {/* Dynamic imports for JSON-LD Structured Data Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* ═══════ TIGHT COMPACT EDITORIAL HERO SECTION ═══════ */}
        <section className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100/60 pb-4 gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-violet-50 text-[#7c5cff] text-[10px] font-extrabold uppercase tracking-wider border border-violet-100/50">
                <GraduationCap className="w-3.5 h-3.5 text-[#7c5cff]" />
                {activeBoard.hero}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Syllabus Index
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Practice chapter-wise online mock tests and solutions
            </p>
          </div>

          {/* Minimalist Board Switcher pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 border border-slate-200/50 p-1.5 rounded-2xl shrink-0">
            {STATE_BOARDS.map((b) => {
              const isActive = selectedBoard === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleBoardSelect(b.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive 
                      ? 'bg-[#7c5cff] text-white shadow-sm' 
                      : 'text-slate-555 hover:text-slate-800'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════ EDITORIAL SYLLABUS LIST (CLEAN ROW EXPLORER) ═══════ */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-4 sm:p-6 shadow-sm divide-y divide-slate-100/70">
          {filteredSyllabus.map((grade) => (
            <div 
              key={grade.num}
              className="py-5 sm:py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
            >
              {/* Left Column: Grade Identity */}
              <div className="flex items-center gap-4">
                {/* Large clean outline number */}
                <span className="text-4xl font-black text-slate-150 group-hover:text-[#7c5cff]/30 transition-colors select-none leading-none w-12 text-center">
                  {String(grade.num).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-855">{grade.label}</h3>
                  <button 
                    onClick={() => handleClassClick(grade.num)}
                    className="text-[9px] font-extrabold text-[#7c5cff] uppercase tracking-wider hover:underline block mt-0.5"
                  >
                    View entire syllabus
                  </button>
                </div>
              </div>

              {/* Right Column: Direct Subject Pill Links */}
              <div className="flex flex-col gap-3 md:max-w-xl w-full md:w-auto">
                {grade.subjects ? (
                  // Lower grades links (direct subjects)
                  <div className="flex flex-wrap gap-2">
                    {grade.subjects.map((sub) => (
                      <Link
                        key={sub.name}
                        to={`/chapter-tests/class-${grade.num}/${sub.slug}?board=${selectedBoard}`}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-violet-50/30 border border-slate-200/60 hover:border-violet-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#7c5cff] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <span>{sub.name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-455 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  // Senior grades stream-nested links
                  <div className="space-y-2 w-full">
                    {grade.streams.map((stream) => (
                      <div key={stream.name} className="flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] font-extrabold text-slate-405 uppercase tracking-widest mr-1 sm:ml-2 min-w-[70px]">
                          {stream.name}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {stream.subjects.map((sub) => (
                            <Link
                              key={sub.name}
                              to={`/chapter-tests/class-${grade.num}/${sub.stream}/${sub.slug}?board=${selectedBoard}`}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-violet-50/30 border border-slate-200/60 hover:border-violet-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#7c5cff] transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              <span>{sub.name}</span>
                              <ArrowRight className="w-3 h-3 text-slate-455" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ═══════ PERFORMANCE TRACKER CTA BLOCK ═══════ */}
        <section className="bg-gradient-to-br from-[#7c5cff] via-[#6a4ce4] to-[#4c2ec4] rounded-3xl p-6 text-white shadow-lg shadow-violet-500/10 relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-52 h-52 rounded-full bg-violet-400/25 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4 max-w-2xl">
              {/* Saly 3D Trophy Graphic */}
              <img 
                src="/images/3d_trophy.png" 
                alt="3D Trophy" 
                className="w-14 h-14 object-contain drop-shadow-lg shrink-0 hidden sm:block animate-bounce" 
                style={{ animationDuration: '3.5s' }}
              />
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 bg-white/20 border border-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
                  <BarChart className="w-3 h-3 text-white" />
                  Featured Tool
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Analyze Your Learning with Performance Tracker
                </h2>
                <p className="text-[11px] text-slate-200 leading-relaxed font-semibold">
                  Don't just solve quizzes blindly. Map your chapter accuracy history, analyze response speeds, identify subject weaknesses, and unlock special milestone rewards as you build a consistent learning streak.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile/board')}
              className="bg-white text-[#7c5cff] hover:bg-violet-55 rounded-2xl px-6 py-3 font-bold text-xs uppercase tracking-wider shadow-md hover:scale-102 active:scale-95 transition-all shrink-0 self-start md:self-center"
            >
              Open Tracker Board
            </button>
          </div>
        </section>

        {/* ═══════ STRUCTURED FAQ SECTION ═══════ */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3.5">
            {[
              { q: 'Are these chapter-wise tests free?', a: 'Yes, all chapter-wise tests, detailed textbook solutions, and live battle room practice quizzes on Ceibaa are 100% free for all students.' },
              { q: 'Is the content aligned with the latest CBSE syllabus?', a: 'Absolutely. Our practice questions are mapped to the latest NCERT textbooks and align with the CBSE 2026 exam patterns.' },
              { q: 'How does the Performance Tracker help me?', a: 'The Performance Tracker records your score trends, speed, and accuracy per chapter, showing you exactly which concepts need revision before the final exams.' },
              { q: 'Can I use Ceibaa on my mobile phone?', a: 'Yes! Ceibaa is fully optimized for mobile browsers, so you can practice quizzes and review solutions anywhere, anytime.' }
            ].map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border-b border-slate-100/70 last:border-none pb-3 last:pb-0">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-extrabold text-slate-800 hover:text-[#7c5cff] transition-all"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-455 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#7c5cff]' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-slate-500 font-semibold leading-relaxed animate-fade-in pl-1">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════ DETAILED INTRO & QUICKLINKS FOOTER (SEO COMPATIBLE) ═══════ */}
        <section className="bg-slate-55/40 border border-slate-200/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-200/60 pb-3">
            <h4 className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest">
              Syllabus Index & Board Preparation Resources
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            Welcome to Ceibaa, your personal space to master school syllabus concepts step-by-step. To make your <strong>CBSE exam preparation</strong> structured and stress-free, we have built targeted <strong>chapter-wise tests</strong> mapped to the current curriculum guidelines. Whether you are revising physics derivations, chemistry equations, or looking for high-yield <strong>NCERT practice questions</strong> for mathematics, our practice tests verify your fundamentals with detailed step-by-step solutions. Rather than cramming at the last minute, you can form consistent daily habits. Our advanced <strong>performance tracker</strong> records your accuracy trends, maps your speed, and reveals exactly which chapters require extra attention. Compete with school friends in live matches or solve quizzes in solo mode to score high in your exams.
          </p>

          <div className="pt-2">
            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Quick Subject Links for Search Engine Indexing
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-550">
              {filteredSyllabus.map((c) => (
                <Link 
                  key={c.num}
                  to={`/chapter-tests/class-${c.num}?board=${selectedBoard}`}
                  className="hover:text-[#7c5cff] transition-colors"
                >
                  {boardLabel} Class {c.num} Online Test Series
                </Link>
              ))}
              <Link to="/chapter-tests?board=cbse" className="hover:text-[#7c5cff] transition-colors">CBSE NCERT MCQ Chapters</Link>
              <Link to="/chapter-tests?board=upboard" className="hover:text-[#7c5cff] transition-colors">UP MSP Board Solutions</Link>
              <Link to="/chapter-tests?board=rbse" className="hover:text-[#7c5cff] transition-colors">RBSE Rajasthan Board MCQs</Link>
            </div>
          </div>
        </section>
        
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestHome;