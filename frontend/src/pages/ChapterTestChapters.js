import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle,
  ChevronDown, ChevronUp, Play, Target, ChevronRight, GraduationCap,
  MessageCircle, Heart, Loader2, Flame, Sparkles, BarChart3,
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { API_URL, DIFFICULTY_COLORS } from '../config/constants';
import MathText from '../components/MathText';
import UserAvatar from '../components/UserAvatar';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Pastel cycle for chapter cards (matches Home + Subjects pages)
const PASTEL_CYCLE = [
  { bg: 'bg-[#A7F3D0]', accent: '#A7F3D0' },
  { bg: 'bg-[#E9D5FF]', accent: '#E9D5FF' },
  { bg: 'bg-[#FFD831]', accent: '#FFD831' },
  { bg: 'bg-[#FFBDBE]', accent: '#FFBDBE' },
  { bg: 'bg-[#BAE6FD]', accent: '#BAE6FD' },
  { bg: 'bg-[#FDE68A]', accent: '#FDE68A' },
  { bg: 'bg-[#C7D2FE]', accent: '#C7D2FE' },
];

// Difficulty pill — neo-brutalist style
const difficultyStyle = (diff) => {
  const level = (diff || '').toLowerCase();
  if (level.includes('easy')) return 'bg-[#A7F3D0]';
  if (level.includes('medium')) return 'bg-[#FFD831]';
  if (level.includes('hard')) return 'bg-[#FFBDBE]';
  return 'bg-[#E9D5FF]';
};

const ChapterTestChapters = () => {
  const navigate = useNavigate();
  const { classNumber, subject, stream } = useParams();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();
  const location = window.location;
  const board = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardLabel =
    board === 'rbse' ? 'Rajasthan Board' :
    board === 'hbse' ? 'Haryana Board' :
    board === 'upboard' ? 'UP Board' :
    board === 'bseb' ? 'Bihar Board' :
    board === 'mpbse' ? 'MP Board' : 'CBSE';
  const boardQuery = `?board=${board}`;

  const selectedClass = classNumber?.replace('class-', '') || location.pathname.match(/class-(\d+)/)?.[1] || '';

  const formattedSubject = useMemo(() => {
    if (!subject) return '';
    const lowercaseWords = ['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'or'];
    return subject
      .replace(/---/g, '|||')
      .replace(/-/g, ' ')
      .replace(/\|\|\|/g, ' - ')
      .split(' ')
      .map((word, index) => {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        if (index > 0 && lowercaseWords.includes(word.toLowerCase())) return word.toLowerCase();
        return capitalized;
      })
      .join(' ');
  }, [subject]);

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [academicPosts, setAcademicPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!selectedClass || !subject) {
      setError('Invalid class or subject');
      setLoading(false);
      return;
    }
    fetchChapters();
    fetchAcademicPosts();
  }, [selectedClass, subject, board]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/chapter-tests/chapters`, {
        params: { class_param: selectedClass, subject, board },
      });
      if (response.data.success) {
        setChapters(response.data.chapters || []);
      } else {
        setError('Failed to load chapters');
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setError(err.response?.data?.message || 'Failed to load chapters');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicPosts = async () => {
    try {
      setLoadingPosts(true);
      const className = `Class ${selectedClass}`;
      const response = await axios.get(`${API_URL}/api/social/academic-posts`, {
        params: { class_name: className, subject: formattedSubject, limit: 10 },
      });
      if (response.data.success) setAcademicPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching academic posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const startTest = (chapter) => {
    const className = `Class-${selectedClass}`;
    const subjectParam = formattedSubject.toLowerCase().replace(/\s+/g, '-');
    const chapterParam = chapter.chapter_name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/topic-quiz/${className}/${subjectParam}/${chapterParam}`, {
      state: {
        isClassBased: true,
        class_name: `Class ${selectedClass}`,
        subject: formattedSubject,
        chapter: chapter.chapter_name,
        chapterNumber: chapter.chapter_number,
        stream,
        board,
      },
    });
  };

  const handleStartPractice = (chapter) => startTest(chapter);

  const handleCreateRoom = (chapter) => {
    const examParam = `Class-${selectedClass}`;
    const subjectParam = formattedSubject.replace(/\s+/g, '-');
    const chapterParam = chapter.chapter_name.replace(/\s+/g, '-');
    navigate(`/create-room/${examParam}/${subjectParam}/${chapterParam}`, {
      state: {
        isClassBased: true,
        class_name: `Class ${selectedClass}`,
        subject: formattedSubject,
        chapter: chapter.chapter_name,
        stream,
        board,
      },
    });
  };

  const handleBack = () => {
    if (stream && (selectedClass === '11' || selectedClass === '12')) {
      navigate(`/chapter-tests/class-${selectedClass}/${stream}${boardQuery}`);
    } else {
      navigate(`/chapter-tests/class-${selectedClass}${boardQuery}`);
    }
  };

  const subjectDisplay = subject ? subject.replace(/---/g, ' - ').replace(/-/g, ' ') : '';
  const totalQuestions = chapters.reduce((acc, ch) => acc + (ch.total_questions || 0), 0);
  const attemptedCount = chapters.filter((ch) => ch.attempted).length;
  const progressPct = chapters.length > 0 ? Math.round((attemptedCount / chapters.length) * 100) : 0;

  // ═══════ LOADING ═══════
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
        <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-10 text-center shadow-[4px_4px_0px_#0A0A0A]">
            <Loader2 className="w-10 h-10 text-[#0A0A0A] mx-auto mb-3 animate-spin" strokeWidth={2.5} />
            <p className="text-base font-bold text-[#0A0A0A]">Loading chapters...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══════ ERROR ═══════
  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
        <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-[#FFBDBE] border-2 border-[#0A0A0A] rounded-2xl p-10 text-center shadow-[6px_6px_0px_#0A0A0A] max-w-md">
            <BookOpen className="w-14 h-14 text-[#0A0A0A] mx-auto mb-3" strokeWidth={2.5} />
            <p className="text-base font-bold text-[#0A0A0A] mb-4">{error}</p>
            <button
              onClick={() => navigate(`/chapter-tests${boardQuery}`)}
              className="bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] px-5 py-2.5 rounded-lg font-bold text-sm shadow-[3px_3px_0px_#FFD831] hover:translate-y-0.5 transition-all"
            >
              Back to Class Selection
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: '#FDFBF7' }}>
      <SEO
        title={`Class ${selectedClass} ${subjectDisplay} - Free Chapter-wise MCQs`}
        description={`Practice free chapter-wise MCQs for ${boardLabel} Class ${selectedClass} ${subjectDisplay}. Solve chapter-based questions with instant results and detailed solutions.`}
        keywords={`class ${selectedClass} ${subjectDisplay} mcq, class ${selectedClass} ${subjectDisplay} solutions, ${boardLabel.toLowerCase()} chapter wise test`}
        canonical={`https://ceibaa.in/chapter-tests/${classNumber}/${subject}`}
      />
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══════ BACK BUTTON ═══════ */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-white border-2 border-[#0A0A0A] rounded-full px-4 py-2 text-sm font-bold text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all mb-6"
          data-testid="back-to-subjects-btn"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          <span>Back to Subjects</span>
        </button>

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 sm:p-7 mb-6 shadow-[6px_6px_0px_#0A0A0A]" data-testid="page-hero">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-[#FFD831] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              {boardLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#A7F3D0] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              Class {selectedClass}
            </span>
            <ChevronRight className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />
            <span className="inline-flex items-center gap-1.5 bg-[#E9D5FF] border-2 border-[#0A0A0A] rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A]">
              {formattedSubject}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-[#0A0A0A] leading-tight mb-2" style={{ fontFamily: FONT }} data-testid="page-title">
            {formattedSubject}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            {chapters.length} chapters · {totalQuestions}+ practice questions
          </p>

          {/* Progress bar */}
          {chapters.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Your progress
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0A0A0A]">
                  {attemptedCount} / {chapters.length} chapters · {progressPct}%
                </span>
              </div>
              <div className="relative w-full h-4 bg-white border-2 border-[#0A0A0A] rounded-full overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                <div
                  className="h-full bg-[#A7F3D0] border-r-2 border-[#0A0A0A] transition-all duration-500"
                  style={{ width: `${Math.max(progressPct, 2)}%` }}
                  data-testid="progress-bar-fill"
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══════ QUICK STATS ═══════ */}
        {chapters.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8" data-testid="quick-stats">
            {[
              { val: chapters.length, label: 'Chapters', Icon: BookOpen, bg: 'bg-[#A7F3D0]' },
              { val: `${totalQuestions}+`, label: 'Questions', Icon: Target, bg: 'bg-[#E9D5FF]' },
              { val: 'NCERT', label: 'Aligned', Icon: Zap, bg: 'bg-[#FFD831]' },
            ].map(({ val, label, Icon, bg }) => (
              <div
                key={label}
                className={`${bg} border-2 border-[#0A0A0A] rounded-xl p-3 sm:p-5 text-center shadow-[4px_4px_0px_#0A0A0A]`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0px_#0A0A0A]">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A0A0A]" strokeWidth={2.5} />
                </div>
                <p className="text-base sm:text-2xl font-bold text-[#0A0A0A]">{val}</p>
                <p className="text-[10px] sm:text-xs text-[#0A0A0A]/70 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ STEP BADGE ═══════ */}
        {chapters.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block bg-[#0A0A0A] text-[#FFD831] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full" style={{ fontFamily: FONT }}>
              · Step 3 ·
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: FONT }}>
              Choose a chapter
            </h2>
          </div>
        )}

        {/* ═══════ CHAPTERS — Vertical roadmap ═══════ */}
        {chapters.length > 0 && (
          <div className="space-y-4 sm:space-y-5" data-testid="chapters-list">
            {chapters.map((chapter, idx) => {
              const pastel = PASTEL_CYCLE[idx % PASTEL_CYCLE.length];
              const isExpanded = expandedChapters[idx];
              return (
                <motion.div
                  key={chapter.chapter_number || chapter.chapter_name || `ch-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="relative bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all overflow-hidden"
                  data-testid={`chapter-card-${chapter.chapter_number || idx}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Left: chapter number badge */}
                    <div className={`${pastel.bg} border-b-2 sm:border-b-0 sm:border-r-2 border-[#0A0A0A] p-4 sm:p-6 flex sm:flex-col items-center justify-center sm:w-[140px] gap-3 sm:gap-2 relative`}>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]/70">
                        Chapter
                      </span>
                      <span className="text-3xl sm:text-5xl font-bold text-[#0A0A0A] leading-none" style={{ fontFamily: FONT }}>
                        {chapter.chapter_number || idx + 1}
                      </span>
                      {chapter.attempted && (
                        <span className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-[#0A0A0A] text-[#A7F3D0] rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#0A0A0A]" data-testid={`chapter-done-${idx}`}>
                          <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </span>
                      )}
                    </div>

                    {/* Right: chapter content */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-base sm:text-xl font-bold text-[#0A0A0A] leading-tight" style={{ fontFamily: FONT }}>
                          {chapter.chapter_name}
                        </h3>
                        <button
                          onClick={() => setExpandedChapters((p) => ({ ...p, [idx]: !p[idx] }))}
                          className="flex-shrink-0 w-8 h-8 bg-white border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-y-0.5 hover:shadow-none transition-all"
                          aria-label="Toggle details"
                          data-testid={`chapter-expand-${idx}`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#0A0A0A]" strokeWidth={2.5} />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#0A0A0A]" strokeWidth={2.5} />
                          )}
                        </button>
                      </div>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 bg-white border-2 border-[#0A0A0A] rounded-full px-2.5 py-1 text-[11px] font-bold text-[#0A0A0A]">
                          <BookOpen className="w-3 h-3" strokeWidth={2.5} />
                          {chapter.total_questions} Qs
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white border-2 border-[#0A0A0A] rounded-full px-2.5 py-1 text-[11px] font-bold text-[#0A0A0A]">
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {chapter.duration}m
                        </span>
                        <span className={`inline-flex items-center gap-1 ${difficultyStyle(chapter.difficulty)} border-2 border-[#0A0A0A] rounded-full px-2.5 py-1 text-[11px] font-bold text-[#0A0A0A] capitalize`}>
                          <Flame className="w-3 h-3" strokeWidth={2.5} />
                          {chapter.difficulty || 'Medium'}
                        </span>
                        {chapter.last_score != null && (
                          <span className="inline-flex items-center gap-1 bg-[#0A0A0A] text-[#A7F3D0] rounded-full px-2.5 py-1 text-[11px] font-bold">
                            <Trophy className="w-3 h-3" strokeWidth={2.5} />
                            {chapter.last_score}%
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-4"
                          >
                            <div className="bg-gray-50 border-2 border-dashed border-[#0A0A0A]/30 rounded-xl p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-[#0A0A0A]" strokeWidth={2.5} />
                                <span className="text-[#0A0A0A]/80 font-medium">{chapter.total_questions} multiple choice questions</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-[#0A0A0A]" strokeWidth={2.5} />
                                <span className="text-[#0A0A0A]/80 font-medium">NCERT-based content</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-[#0A0A0A]" strokeWidth={2.5} />
                                <span className="text-[#0A0A0A]/80 font-medium">Instant results & detailed solutions</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleStartPractice(chapter)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-4 py-2.5 rounded-xl font-bold text-sm shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all"
                          data-testid={`solo-practice-btn-${idx}`}
                        >
                          <Play className="w-4 h-4 fill-[#0A0A0A]" strokeWidth={2.5} />
                          <span>Solo Practice</span>
                        </button>
                        <button
                          onClick={() => handleCreateRoom(chapter)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] px-4 py-2.5 rounded-xl font-bold text-sm shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all"
                          data-testid={`create-room-btn-${idx}`}
                        >
                          <Users className="w-4 h-4" strokeWidth={2.5} />
                          <span>Create Room</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══════ EMPTY CHAPTERS ═══════ */}
        {chapters.length === 0 && !loading && !error && (
          <div className="bg-white border-2 border-dashed border-[#0A0A0A] rounded-2xl p-10 text-center mt-4" data-testid="empty-chapters">
            <BookOpen className="w-14 h-14 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-bold text-[#0A0A0A] mb-1">No chapters available yet</p>
            <p className="text-sm text-gray-500 mb-4">Chapters will be added soon for {formattedSubject}!</p>
            <button
              onClick={handleBack}
              className="bg-[#FFD831] text-[#0A0A0A] border-2 border-[#0A0A0A] px-5 py-2.5 rounded-lg font-bold text-sm shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0px_#0A0A0A] transition-all"
            >
              Go Back to Subjects
            </button>
          </div>
        )}

        {/* ═══════ COMPREHENSIVE QUESTIONS (Capazoo) ═══════ */}
        {academicPosts.length > 0 && (
          <div className="mt-10 sm:mt-14 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden" data-testid="capazoo-section">
            <div className="bg-[#0A0A0A] px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD831] border-2 border-[#FFD831] rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#0A0A0A]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight" style={{ fontFamily: FONT }}>Comprehensive Questions</h2>
                  <p className="text-[#A7F3D0] text-[11px] sm:text-xs font-medium">From Capazoo · {formattedSubject}</p>
                </div>
              </div>
              <Link
                to="/capazoo"
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#FFD831] text-[#0A0A0A] border-2 border-[#FFD831] rounded-full px-3 py-1.5 text-xs font-bold hover:translate-y-0.5 transition-all"
              >
                Expert Q&A
                <ChevronRight className="w-3 h-3" strokeWidth={3} />
              </Link>
            </div>

            <div className="divide-y-2 divide-[#0A0A0A]/10">
              {academicPosts.slice(0, 5).map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-4 sm:p-5 hover:bg-[#FDFBF7] transition"
                  data-testid={`capazoo-post-${post.id}`}
                >
                  <div className="flex gap-3">
                    <UserAvatar
                      profilePicture={post.user_profile_picture || post.user_avatar}
                      name={post.user_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#0A0A0A] text-sm">{post.user_name}</span>
                        {post.is_verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#0A0A0A] fill-[#A7F3D0]" />
                        )}
                        <span className="text-gray-400 text-[11px]">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {post.academic_chapter && (
                        <span className="inline-flex items-center gap-1 bg-[#A7F3D0] border-2 border-[#0A0A0A] rounded-full px-2 py-0.5 text-[10px] font-bold text-[#0A0A0A] mb-2">
                          {post.academic_chapter}
                        </span>
                      )}

                      <div className="text-[#0A0A0A] text-sm mb-3 leading-relaxed">
                        <MathText text={post.content} />
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {post.likes_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {post.comments_count || 0}
                        </span>
                        <span className="ml-auto text-[#0A0A0A] font-bold">
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {academicPosts.length > 5 && (
              <div className="p-4 bg-[#FDFBF7] border-t-2 border-[#0A0A0A] text-center">
                <Link
                  to="/capazoo"
                  className="inline-flex items-center gap-1.5 text-[#0A0A0A] font-bold text-sm hover:gap-2 transition-all"
                >
                  View all {academicPosts.length} questions on Capazoo
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </Link>
              </div>
            )}
          </div>
        )}

        {loadingPosts && academicPosts.length === 0 && (
          <div className="mt-8 bg-white border-2 border-[#0A0A0A] rounded-2xl p-6 text-center shadow-[4px_4px_0px_#0A0A0A]">
            <Loader2 className="w-8 h-8 text-[#0A0A0A] mx-auto mb-2 animate-spin" strokeWidth={2.5} />
            <p className="text-xs font-bold text-[#0A0A0A]">Loading comprehensive questions...</p>
          </div>
        )}

        {/* ═══════ WHY CHAPTER-WISE PRACTICE ═══════ */}
        {chapters.length > 0 && (
          <div className="mt-10 sm:mt-14 bg-[#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl p-6 sm:p-10 shadow-[8px_8px_0px_#FFD831] relative overflow-hidden" data-testid="why-section">
            <div className="absolute top-4 left-4 w-16 h-16 bg-[#FFD831]/15 rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-4 w-20 h-20 bg-[#A7F3D0]/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8 leading-tight" style={{ fontFamily: FONT }}>
                Why <span className="text-[#FFD831]">chapter-wise</span> practice?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
                {[
                  { Icon: Target, title: 'Focused Learning', desc: 'Master one chapter at a time with targeted practice', bg: 'bg-[#A7F3D0]' },
                  { Icon: Zap, title: 'NCERT Aligned', desc: `All questions follow the latest ${boardLabel} curriculum`, bg: 'bg-[#FFD831]' },
                  { Icon: BarChart3, title: 'Track Progress', desc: 'Monitor your performance chapter by chapter', bg: 'bg-[#FFBDBE]' },
                ].map(({ Icon, title, desc, bg }) => (
                  <div
                    key={title}
                    className={`${bg} border-2 border-[#0A0A0A] rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#FFFFFF]/20`}
                  >
                    <div className="w-10 h-10 bg-white border-2 border-[#0A0A0A] rounded-lg flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0A0A0A]">
                      <Icon className="w-5 h-5 text-[#0A0A0A]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: FONT }}>{title}</h3>
                    <p className="text-xs sm:text-sm text-[#0A0A0A]/70 leading-relaxed">{desc}</p>
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

export default ChapterTestChapters;
