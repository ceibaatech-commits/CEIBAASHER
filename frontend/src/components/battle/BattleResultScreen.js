/**
 * BattleResultScreen.js
 *
 * Full post-match summary screen for 1v1 battles.  All data comes in as props
 * so the parent (Matchmaking1v1) keeps only logic/state and this file handles
 * nothing but rendering — keeping it React.memo-friendly.
 */
import React from 'react';
import {
  Crown, Sparkles, ShieldAlert, Award, Users, Shield,
  RefreshCcw, ArrowRight, ExternalLink, Loader2,
} from 'lucide-react';
import Header from '../Header';
import FollowButton from '../FollowButton';

const OUTCOME_UI = {
  win: {
    title: 'Victory 🏆',
    subtitle: 'Sharp answers, solid pace, clean finish.',
    icon: Crown,
    accent: 'from-amber-400 via-orange-500 to-rose-500',
    badge: 'Winner Mode',
  },
  draw: {
    title: 'Draw 🤝',
    subtitle: 'Perfectly balanced duel. Great fight from both sides.',
    icon: Sparkles,
    accent: 'from-sky-500 via-indigo-500 to-violet-500',
    badge: 'Even Match',
  },
  loss: {
    title: 'You Lost 😵',
    subtitle: 'No stress. Queue again and bounce back stronger.',
    icon: ShieldAlert,
    accent: 'from-slate-700 via-slate-800 to-slate-950',
    badge: 'Comeback Time',
  },
};

const FALLBACK_TALLY = {
  correct: 0,
  wrong: 0,
  skipped: 0,
  timeBonus: 0,
};

function safeDecode(value, fallback) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {{
 *   playerName: string,
 *   opponent: object|null,
 *   myScore: number,
 *   opponentScore: number,
 *   questions: any[],
 *   examId: string,
 *   subject: string,
 *   tally: { correct: number, wrong: number, skipped: number, timeBonus: number },
 *   rematchState: 'idle'|'pending'|'requested',
 *   rematchRequesterName: string,
 *   rematchCountdown: number,
 *   rematchMuteBehavior?: 'auto_decline'|'ignore'|'passive_badge',
 *   setRematchMuteBehavior?: (value: 'auto_decline'|'ignore'|'passive_badge') => void,
 *   notificationsMuted?: boolean,
 *   passiveRematchRequest?: { roomId: string, requesterName: string, expiresAt: number } | null,
 *   requestRematch: () => void,
 *   acceptRematch: () => void,
 *   declineRematch: () => void,
 *   onPlayAgain?: () => void,
 *   onFindNewOpponent?: () => void,
 *   navigate: (path: string) => void,
 *   openProfileNewTab: (target: string) => void,
 *   isUserAuth: boolean,
 *   user: object|null,
 *   SCORE: { MAX_PER_QUESTION: number },
 * }} props
 */
const BattleResultScreen = React.memo(function BattleResultScreen({
  playerName,
  opponent,
  myScore,
  opponentScore,
  questions = [],
  examId,
  subject,
  tally = FALLBACK_TALLY,
  rematchState,
  rematchRequesterName,
  rematchCountdown,
  rematchMuteBehavior = 'auto_decline',
  setRematchMuteBehavior,
  notificationsMuted = false,
  passiveRematchRequest = null,
  requestRematch,
  acceptRematch,
  declineRematch,
  onPlayAgain,
  onFindNewOpponent,
  navigate,
  openProfileNewTab,
  isUserAuth,
  user,
  SCORE,
  resultNotice,
}) {
  const isWinner = myScore > opponentScore;
  const isTie    = myScore === opponentScore;
  const oppName  = opponent?.playerName || 'Opponent';
  const outcome  = isWinner ? 'win' : isTie ? 'draw' : 'loss';
  const outcomeUI = OUTCOME_UI[outcome];
  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  const scoreMaxPerQuestion = SCORE?.MAX_PER_QUESTION ?? 0;
  const safeTally = {
    correct: tally?.correct ?? 0,
    wrong: tally?.wrong ?? 0,
    skipped: tally?.skipped ?? 0,
    timeBonus: tally?.timeBonus ?? 0,
  };
  const decodedExamId = safeDecode(examId, 'Unknown Exam');
  const decodedSubject = safeDecode(subject, 'Unknown Subject');

  const handlePlayAgain = () => {
    if (typeof onPlayAgain === 'function') {
      onPlayAgain();
    }
  };

  const handleFindNewOpponent = () => {
    if (typeof onFindNewOpponent === 'function') {
      onFindNewOpponent();
    }
  };

  const OutcomeIcon = outcomeUI.icon;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(248,250,252,0.98)_38%,_rgba(241,245,249,1)_100%)]">
      <Header isLoggedIn={isUserAuth} user={user} />

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur">

            {/* ── Hero header ─────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${outcomeUI.accent} px-6 py-8 sm:px-8 sm:py-10 text-white`}>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute -left-12 -bottom-10 h-44 w-44 rounded-full bg-black/10 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl animate-pulse" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20 shadow-lg animate-bounce" aria-hidden="true">
                    <OutcomeIcon className="h-10 w-10" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/95">
                    <Award className="h-3.5 w-3.5" aria-hidden="true" />
                    {outcomeUI.badge}
                  </div>
                  <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{outcomeUI.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">{outcomeUI.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-white/90">
                  <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{totalQuestions} questions</span>
                  <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{decodedExamId}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{decodedSubject}</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              {resultNotice && (
                <div
                  className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                  data-testid="results-notice"
                >
                  {resultNotice}
                </div>
              )}

              {/* ── Player cards ────────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] items-stretch mb-6">

                {/* YOU */}
                <div className="min-h-[220px] rounded-[1.5rem] border border-red-100 bg-gradient-to-b from-red-50 to-white p-5 text-center shadow-sm flex flex-col items-center justify-between">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-500">You</p>
                      <p className="mt-1 max-w-[12rem] truncate text-base font-semibold text-slate-900">{playerName}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight text-slate-950">{myScore}</span>
                    <span className="pb-1 text-sm font-semibold text-slate-500">pts</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    <Shield className="h-3.5 w-3.5 text-red-500" />
                    {outcome === 'win' ? 'Strong finish' : outcome === 'draw' ? 'Stayed in it' : 'Reset and run it back'}
                  </div>
                </div>

                {/* VS */}
                <div className="flex items-center justify-center lg:px-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                    <span className="text-xs font-black tracking-[0.26em]">VS</span>
                  </div>
                </div>

                {/* OPPONENT */}
                <div className="min-h-[220px] rounded-[1.5rem] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5 text-center shadow-sm flex flex-col items-center justify-between">
                  <div className="flex flex-col items-center gap-3">
                    {opponent?.userId ? (
                      <button
                        type="button"
                        onClick={() => openProfileNewTab(opponent.username || opponent.userId)}
                        data-testid="results-opponent-name-link"
                        className="group flex flex-col items-center gap-2 focus:outline-none"
                        aria-label={`View ${oppName}'s profile`}
                      >
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-2 transition-all">
                          <Users className="h-6 w-6" />
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-blue-100 shadow">
                            <ExternalLink className="h-3 w-3 text-blue-500" />
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">Opponent</p>
                          <p className="mt-0.5 max-w-[12rem] truncate text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors underline-offset-2 group-hover:underline">{oppName}</p>
                        </div>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">Opponent</p>
                          <p className="mt-0.5 max-w-[12rem] truncate text-base font-semibold text-slate-900">{oppName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight text-slate-950">{opponentScore}</span>
                    <span className="pb-1 text-sm font-semibold text-slate-500">pts</span>
                  </div>
                  <div className="flex min-h-[40px] items-center justify-center" data-testid="results-opponent-follow">
                    {opponent?.userId ? (
                      <FollowButton
                        targetUserId={opponent.userId}
                        targetUsername={opponent.username || opponent.playerName}
                        compact
                      />
                    ) : (
                      <div className="h-10" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>

              {/* ── Match meta ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Questions</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{totalQuestions}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Exam</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{decodedExamId}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Subject</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{decodedSubject}</p>
                </div>
              </div>

              {/* ── Score breakdown ──────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm" data-testid="score-breakdown">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Score Breakdown</p>
                  <p className="text-xs text-slate-400">out of {totalQuestions * scoreMaxPerQuestion}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="rounded-xl bg-emerald-50 p-2">
                    <p className="text-emerald-700 font-bold text-lg" data-testid="tally-correct">{safeTally.correct}</p>
                    <p className="text-emerald-600">Correct</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-2">
                    <p className="text-rose-700 font-bold text-lg" data-testid="tally-wrong">{safeTally.wrong}</p>
                    <p className="text-rose-600">Wrong</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2">
                    <p className="text-amber-700 font-bold text-lg" data-testid="tally-skipped">{safeTally.skipped}</p>
                    <p className="text-amber-600">Skipped</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-2">
                  <span>Time bonus earned</span>
                  <span className="font-bold text-slate-700" data-testid="tally-time-bonus">+{safeTally.timeBonus} pts</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Accuracy</span>
                  <span className="font-bold text-slate-700">
                    {totalQuestions > 0 ? Math.round((safeTally.correct / totalQuestions) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* ── Action buttons ───────────────────────────────────────── */}
              {notificationsMuted && typeof setRematchMuteBehavior === 'function' && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="rematch-mute-behavior">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Muted Rematch Behavior</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setRematchMuteBehavior('auto_decline')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${rematchMuteBehavior === 'auto_decline' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      Auto-decline
                    </button>
                    <button
                      onClick={() => setRematchMuteBehavior('ignore')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${rematchMuteBehavior === 'ignore' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      Ignore silently
                    </button>
                    <button
                      onClick={() => setRematchMuteBehavior('passive_badge')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${rematchMuteBehavior === 'passive_badge' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      Passive badge
                    </button>
                  </div>
                </div>
              )}

              {passiveRematchRequest && rematchState !== 'requested' && (
                <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4" data-testid="rematch-passive-badge">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        {passiveRematchRequest.requesterName || 'Opponent'} requested a rematch
                      </p>
                      <p className="text-xs text-blue-700">Expires in {rematchCountdown}s</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => declineRematch(passiveRematchRequest.roomId)}
                        className="rounded-xl bg-white border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => acceptRematch(passiveRematchRequest.roomId)}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {opponent?.userId ? (
                  <button
                    onClick={requestRematch}
                    disabled={rematchState === 'pending'}
                    data-testid="rematch-btn"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rematchState === 'pending' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for {oppName}…</>
                    ) : (
                      <><RefreshCcw className="w-5 h-5" /> Battle Again</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePlayAgain}
                    disabled={typeof onPlayAgain !== 'function'}
                    data-testid="battle-again-btn"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw className="w-5 h-5" /> Battle Again
                  </button>
                )}

                <button
                  onClick={handleFindNewOpponent}
                  disabled={typeof onFindNewOpponent !== 'function'}
                  data-testid="battle-again-other"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowRight className="w-5 h-5" /> Find new opponent
                </button>

                <button
                  onClick={() => navigate('/capazoo')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:col-span-2"
                >
                  <Award className="w-4 h-4 text-amber-500" /> Capazoo
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 sm:col-span-2"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Incoming rematch challenge modal ─────────────────────────── */}
      {rematchState === 'requested' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-[0_20px_60px_rgba(2,6,23,0.35)] border border-slate-200 overflow-hidden"
            data-testid="rematch-incoming-modal"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white text-center">
              <p className="text-sm font-semibold opacity-90">Rematch Challenge</p>
              <p className="text-lg font-black mt-0.5 truncate">{rematchRequesterName} challenged you</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 text-center mb-4">
                {rematchRequesterName} has challenged you to a rematch!
              </p>
              <div className="flex items-center justify-center mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  Expires in {rematchCountdown}s
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={declineRematch}
                  data-testid="rematch-decline-btn"
                  className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptRematch}
                  data-testid="rematch-accept-btn"
                  className="py-2.5 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BattleResultScreen;
