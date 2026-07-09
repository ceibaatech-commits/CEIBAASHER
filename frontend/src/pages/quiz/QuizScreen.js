import React, { useEffect, useRef, useState } from 'react';
import {
  Clock, ArrowLeft, ArrowRight, Trophy, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  ACTION_BAR_OFFSET, BOTTOM_SAFE, optionLetters, optionKey,
} from './constants';

const formatTime = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const NOISE_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")";

const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const RESIST_MAX = 44;

const QuizScreen = ({
  quiz, questions, currentIdx, selected, timeLeft, onSelect, onNext, totalQuestions, onBack,
  onPrev,
}) => {
  const q = questions[currentIdx];
  const headingRef = useRef(null);

  const answered = selected !== null;
  const timedOut = !answered && timeLeft <= 0;
  const locked = answered || timedOut;

  const isFirst = currentIdx === 0;
  const isLast = currentIdx + 1 >= totalQuestions;

  const canSwipeNext = locked && !isLast;
  const canSwipePrev = !isFirst && typeof onPrev === 'function';

  const [dragX, setDragX] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastT: 0, isHorizontal: null });

  const resolveDrag = (rawDx) => {
    if (rawDx > 0 && !canSwipeNext) return Math.min(rawDx * 0.3, RESIST_MAX);
    if (rawDx < 0 && !canSwipePrev) return -Math.min(Math.abs(rawDx) * 0.3, RESIST_MAX);
    return rawDx;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: Date.now(),
      isHorizontal: null,
    };
    setSnapping(false);
  };

  const handlePointerMove = (e) => {
    const ds = dragStateRef.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (ds.isHorizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      ds.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (ds.isHorizontal === false) return;

    ds.lastX = e.clientX;
    ds.lastT = Date.now();
    setDragX(resolveDrag(dx));
  };

  const finishDrag = (committedDir) => {
    const ds = dragStateRef.current;
    ds.active = false;
    if (!committedDir) {
      setSnapping(true);
      setDragX(0);
      return;
    }
    setSnapping(true);
    setDragX(committedDir === 'right' ? window.innerWidth : -window.innerWidth);
    window.setTimeout(() => {
      if (committedDir === 'right') onNext();
      else onPrev();
      setDragX(0);
      setSnapping(false);
    }, 220);
  };

  const handlePointerUp = (e) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.isHorizontal === false) {
      ds.active = false;
      return;
    }
    const dx = e.clientX - ds.startX;
    const elapsed = Math.max(1, Date.now() - ds.lastT);
    const velocity = Math.abs(dx) / elapsed;
    const met = Math.abs(dx) >= SWIPE_THRESHOLD || velocity >= SWIPE_VELOCITY_THRESHOLD;

    if (dx > 0 && met && canSwipeNext) finishDrag('right');
    else if (dx < 0 && met && canSwipePrev) finishDrag('left');
    else finishDrag(null);
  };

  useEffect(() => {
    if (q) headingRef.current?.focus();
  }, [currentIdx, q]);

  useEffect(() => {
    if (!q || locked) return undefined;
    const handleKeyDown = (e) => {
      const idx = optionLetters.indexOf(e.key.toUpperCase());
      const numIdx = Number(e.key) - 1;
      const letter =
        idx !== -1
          ? optionLetters[idx]
          : numIdx >= 0 && numIdx < optionLetters.length
          ? optionLetters[numIdx]
          : null;
      if (letter && q[optionKey(letter)]) onSelect(letter);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [q, locked, onSelect]);

  if (!q) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-violet-900 text-white px-4" style={{ fontFamily: "'Geist', sans-serif" }}>
        <p className="text-center text-slate-200 text-sm">
          We couldn&apos;t load this question. Please try going back and starting again.
        </p>
      </section>
    );
  }

  const isCorrectLetter = (letter) => letter === q.correct_answer?.toUpperCase();

  const optStyle = (letter) => {
    const isCorrect = isCorrectLetter(letter);
    if (!locked) {
      return 'border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50/40 text-slate-800 cursor-pointer';
    }
    if (letter === selected) {
      return isCorrect
        ? 'border-emerald-500 bg-emerald-50 text-slate-900'
        : 'border-rose-500 bg-rose-50 text-slate-900';
    }
    if (isCorrect) return 'border-emerald-400 bg-emerald-50/60 text-slate-900';
    return 'border-slate-100 bg-slate-50/40 text-slate-400';
  };

  const progressPct = ((currentIdx + 1) / totalQuestions) * 100;
  const timerLow = timeLeft <= 7;

  return (
    <section
      data-testid="quiz-question-screen"
      className="relative min-h-screen flex flex-col"
      style={{ paddingBottom: BOTTOM_SAFE, fontFamily: "'Geist', sans-serif" }}
    >
      <style>{`
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Fixed Background Layers */}
      <div aria-hidden className="fixed inset-0 -z-10" style={{ background: '#4c1d95' }} />
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #7c3aed 0%, #8b5cf6 55%, #a78bfa 100%)',
          clipPath: 'polygon(0 38%, 100% 26%, 100% 100%, 0 100%)',
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG }}
      />

      {/* Sticky Top Track Progress Bar */}
      <header className="sticky top-0 z-40">
        <div
          className="w-full h-1 bg-black/20 overflow-hidden relative"
          role="progressbar"
          aria-valuenow={currentIdx + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        >
          <div
            data-testid="quiz-progress-bar"
            className="h-full bg-emerald-400 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="pt-4 pb-2 px-3 sm:px-6 max-w-3xl mx-auto flex items-center">
          <button
            data-testid="quiz-back-btn"
            onClick={() => onBack && onBack()}
            aria-label="Go back"
            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      {/* Content Canvas Area */}
      <div className="relative flex-1 px-2.5 sm:px-6 pt-2 pb-40">
        <div className="relative max-w-3xl mx-auto">
          
          <div aria-hidden className="absolute left-1/2 -translate-x-1/2 w-[90%] h-16 -bottom-8 rounded-[24px] bg-white/25 backdrop-blur-sm shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]" />
          <div aria-hidden className="absolute left-1/2 -translate-x-1/2 w-[95%] h-16 -bottom-4 rounded-[24px] bg-white/55 backdrop-blur-md shadow-[0_18px_36px_-18px_rgba(0,0,0,0.3)]" />

          {/* Main Card */}
          <div
            key={currentIdx}
            data-testid="quiz-question-card"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative bg-white rounded-[24px] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.45)] px-4 sm:px-8 pt-5 sm:pt-8 pb-6 animate-[cardEnter_0.28s_ease-out] mb-8"
            style={{
              touchAction: 'pan-y',
              transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
              opacity: 1 - Math.min(Math.abs(dragX) / 420, 0.55),
              transition: snapping ? 'transform 220ms ease-out, opacity 220ms ease-out' : 'none',
            }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-slate-100 pb-3">
              <div className="flex flex-col text-left">
                <span className="text-slate-900 font-extrabold text-[14px] uppercase tracking-wide">
                  Question {currentIdx + 1} <span className="text-slate-400 font-normal">/ {totalQuestions}</span>
                </span>
                {quiz?.title && (
                  <span className="text-slate-400 text-[11px] font-semibold tracking-tight uppercase mt-0.5">
                    {quiz.title}
                  </span>
                )}
              </div>
              
              <div
                data-testid="quiz-timer"
                role="timer"
                aria-label={`${formatTime(timeLeft)} remaining`}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  timerLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${timerLow ? 'animate-pulse' : ''}`} />
                <span className="text-[13px] font-bold tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <h2
              ref={headingRef}
              tabIndex={-1}
              data-testid="quiz-question-text"
              className="text-slate-900 font-bold text-[20px] sm:text-[28px] leading-snug tracking-tight mb-5 sm:mb-8 whitespace-pre-line break-words outline-none"
            >
              {q.question}
            </h2>

            {/* Selector Modules */}
            <div className="space-y-2.5">
              {optionLetters.map((letter) => {
                const val = q[optionKey(letter)];
                if (!val) return null;
                const isCorrect = isCorrectLetter(letter);
                const isSelected = letter === selected;
                
                return (
                  <button
                    key={letter}
                    data-testid={`quiz-option-${letter}`}
                    onClick={() => !locked && onSelect(letter)}
                    disabled={locked}
                    className={`group w-full flex items-center justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all ${optStyle(letter)}`}
                  >
                    <span className="text-[14px] sm:text-base leading-relaxed font-medium flex-1 whitespace-pre-line break-words">
                      {String(val)}
                    </span>
                    {locked && isSelected && (
                      isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      )
                    )}
                    {locked && !isSelected && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/80 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanations Segment */}
            {locked && q.explanation && (
              <div className="mt-5 animate-[fadeIn_0.25s_ease-out]">
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-violet-700 font-bold mb-1.5">
                    Explanation
                  </p>
                  <div className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                    {String(q.explanation)}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Swiping Indicator Metadata */}
          {(canSwipeNext || canSwipePrev) && (
            <p aria-hidden className="mt-4 text-center text-[12px] font-medium text-white/70 select-none">
              {canSwipePrev && canSwipeNext && '← Swipe to review · Swipe to continue →'}
              {canSwipePrev && !canSwipeNext && '← Swipe to review the last question'}
              {!canSwipePrev && canSwipeNext && 'Swipe right to continue →'}
            </p>
          )}
        </div>
      </div>

      {/* Floating Dynamic Bottom Submission Track */}
      <div
        aria-hidden={!locked}
        className={`fixed left-4 right-4 z-50 flex justify-center transition-all duration-300 ease-out ${
          locked ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
        style={{ bottom: `calc(${ACTION_BAR_OFFSET || '32px'} + env(safe-area-inset-bottom))` }}
      >
        <button
          data-testid="quiz-next-btn"
          onClick={onNext}
          disabled={!locked}
          className="w-full max-w-sm flex items-center justify-center gap-3 rounded-full bg-emerald-500 text-white font-bold py-3.5 px-8 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
        >
          <span>{isLast ? 'Submit Quiz' : 'Next Question'}</span>
          {!isLast && <ArrowRight className="w-5 h-5" />}
          {isLast && <Trophy className="w-5 h-5" />}
        </button>
      </div>
    </section>
  );
};

export default QuizScreen;