/**
 * LiveScoreboard.js
 *
 * Floating score strip shown during a live 1v1 battle. Extracted from
 * Matchmaking1v1 so it can be memoised independently — it re-renders only
 * when score / progress data actually changes, not on every keypress or
 * chat update in the parent.
 *
 * Mobile design: inline accordion fixed at the bottom.
 * - No backdrop/overlay — quiz content stays fully visible and interactive.
 * - Toggle bar always visible; tapping slides the detail panel open/shut
 *   like an accordion growing upward above the nav bar.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Crown, Wifi } from 'lucide-react';

/**
 * @param {{
 *   desktop: boolean,
 *   opponentLabel: string,
 *   displayMyScore: number,
 *   displayOpponentScore: number,
 *   totalQuestions: number,
 *   currentQuestionIndex: number,
 *   opponentQuestionIndex: number,
 *   battleState: string,
 *   scorePulse: { me: boolean, opp: boolean },
 *   myScoreDeltas: Array<{ id: string, delta: number }>,
 *   oppScoreDeltas: Array<{ id: string, delta: number }>,
 *   isReconnecting: boolean,
 * }} props
 */
const LiveScoreboard = React.memo(function LiveScoreboard({
  desktop = false,
  opponentLabel = 'Opponent',
  displayMyScore = 0,
  displayOpponentScore = 0,
  totalQuestions = 0,
  currentQuestionIndex = 0,
  opponentQuestionIndex = 1,
  battleState,
  scorePulse = { me: false, opp: false },
  myScoreDeltas = [],
  oppScoreDeltas = [],
  isReconnecting = false,
}) {
  const [open, setOpen] = useState(false);
  // Auto-peek briefly when score or progress changes
  const autoCloseRef = useRef(null);

  useEffect(() => {
    if (desktop || battleState !== 'playing') return;
    setOpen(true);
    clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => setOpen(false), 2200);
    return () => clearTimeout(autoCloseRef.current);
  }, [desktop, battleState, displayMyScore, displayOpponentScore, currentQuestionIndex, opponentQuestionIndex]);

  const leader =
    displayMyScore - displayOpponentScore >= 5 ? 'me'
    : displayOpponentScore - displayMyScore >= 5 ? 'opp'
    : null;

  const myQ   = totalQuestions ? Math.min(currentQuestionIndex + 1, totalQuestions) : 1;
  const oppQ  = totalQuestions ? Math.min(opponentQuestionIndex, totalQuestions) : 1;
  const myPct  = totalQuestions ? Math.round((myQ  / totalQuestions) * 100) : 0;
  const oppPct = totalQuestions ? Math.round((oppQ / totalQuestions) * 100) : 0;

  const oppFinished =
    battleState === 'playing' && totalQuestions > 0 &&
    opponentQuestionIndex > totalQuestions && currentQuestionIndex < totalQuestions;

  // ── DESKTOP: unchanged floating strip ─────────────────────────────────────
  if (desktop) {
    return (
      <div
        data-testid="live-scoreboard"
        className="hidden md:block fixed left-0 right-0 z-30"
        style={{ bottom: '1.5rem' }}
      >
        <div className="mx-auto max-w-[640px] px-4">
          <div className="rounded-2xl bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.12)] border border-slate-200">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              {/* You */}
              <div className={`relative flex-1 min-w-0 rounded-2xl p-3 bg-[#F8FAFF] ${scorePulse.me ? 'ring-2 ring-blue-300' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">Y</div>
                  <div>
                    <p className="text-xs font-semibold text-blue-500">You</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-2xl font-bold text-slate-900">{displayMyScore}</p>
                      {leader === 'me' && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>Q{myQ}/{totalQuestions || 10}</span><span>{myPct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${myPct}%` }} />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-400 tracking-widest">VS</div>
              {/* Opponent */}
              <div className={`relative flex-1 min-w-0 rounded-2xl p-3 bg-[#FFF3F2] ${scorePulse.opp ? 'ring-2 ring-red-300' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#F25C54] truncate max-w-[100px]">{opponentLabel}</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-2xl font-bold text-slate-900">{displayOpponentScore}</p>
                      {leader === 'opp' && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#FEE8E6] flex items-center justify-center text-[#F25C54] text-xs font-bold">
                    {opponentLabel.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>Q{oppQ}/{totalQuestions || 10}</span><span>{oppPct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-[#F25C54] transition-all duration-300" style={{ width: `${oppPct}%` }} />
                </div>
              </div>
            </div>
            {oppFinished && (
              <p className="px-4 pb-2 text-xs text-amber-600 font-semibold">⚡ Opponent finished — keep going!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MOBILE: inline accordion, no backdrop ─────────────────────────────────
  return (
    <div
      data-testid="live-scoreboard"
      className="md:hidden fixed left-0 right-0 z-30"
      style={{ bottom: 0 }}
    >
      {/* Accordion detail panel — slides up/down above the toggle bar */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
            style={{ overflow: 'hidden', background: '#fff', borderTop: '1px solid #e2e8f0' }}
          >
            {/* Score cards */}
            <div className="flex items-stretch gap-2 px-3 pt-3 pb-2">
              {/* You */}
              <div className={`flex-1 rounded-2xl p-3 ${scorePulse.me ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">Y</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-blue-500 leading-none">You</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[22px] font-bold text-slate-900 leading-none">{displayMyScore}</span>
                      {leader === 'me' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Q{myQ}/{totalQuestions || 10}</span><span>{myPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-500"
                    animate={{ width: `${myPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                {/* Score delta popups */}
                <AnimatePresence>
                  {myScoreDeltas.map((item) => (
                    <motion.span
                      key={item.id}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.7 }}
                      className="absolute top-0 right-2 text-[11px] font-bold text-blue-600 pointer-events-none"
                    >
                      {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* VS divider */}
              <div className="flex flex-col items-center justify-center gap-1 px-1">
                <span className="text-[10px] font-black text-slate-300 tracking-widest">VS</span>
                <div className="w-px flex-1 bg-slate-200" />
              </div>

              {/* Opponent */}
              <div className={`flex-1 rounded-2xl p-3 ${scorePulse.opp ? 'bg-red-50 ring-1 ring-red-200' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#F25C54] truncate leading-none">{opponentLabel}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[22px] font-bold text-slate-900 leading-none">{displayOpponentScore}</span>
                      {leader === 'opp' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-[#F25C54] text-xs font-bold flex-shrink-0">
                    {opponentLabel.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Q{oppQ}/{totalQuestions || 10}</span><span>{oppPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#F25C54]"
                    animate={{ width: `${oppPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <AnimatePresence>
                  {oppScoreDeltas.map((item) => (
                    <motion.span
                      key={item.id}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.7 }}
                      className="absolute top-0 right-2 text-[11px] font-bold text-[#F25C54] pointer-events-none"
                    >
                      {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {oppFinished && (
              <p className="px-3 pb-1 text-[11px] text-amber-600 font-semibold text-center">⚡ Opponent finished — keep going!</p>
            )}
            {isReconnecting && (
              <div className="flex items-center justify-center gap-1.5 pb-2 text-[11px] font-semibold text-amber-700">
                <Wifi className="w-3 h-3 animate-pulse" />Reconnecting…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Always-visible toggle bar ── */}
      <button
        type="button"
        data-testid="scoreboard-peek-toggle"
        onClick={() => {
          clearTimeout(autoCloseRef.current);
          setOpen((v) => !v);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          cursor: 'pointer',
          gap: 12,
        }}
      >
        {/* Left: chevron + label */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', color: '#64748b' }}
          >
            <ChevronUp size={16} />
          </motion.span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', letterSpacing: '0.01em' }}>
            {open ? 'Hide score' : 'Score'}
          </span>
        </span>

        {/* Center: live scores */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 17, color: '#1e293b', letterSpacing: '-0.5px' }}>
              {displayMyScore}
            </span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.08em' }}>VS</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 17, color: '#1e293b', letterSpacing: '-0.5px' }}>
              {displayOpponentScore}
            </span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F25C54', flexShrink: 0 }} />
          </span>
        </span>

        {/* Right: question progress */}
        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
          Q{Math.min(currentQuestionIndex + 1, totalQuestions || 1)}/{totalQuestions || 10}
        </span>
      </button>
    </div>
  );
});

export default LiveScoreboard;
