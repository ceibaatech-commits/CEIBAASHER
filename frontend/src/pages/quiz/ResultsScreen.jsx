import React, { useState } from "react";
import {
  Clock,
  Trophy,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Medal,
  Award,
  Share2,
  Zap,
} from "lucide-react";
const POINTS_PER_CORRECT = 100;
const ACTION_BAR_OFFSET = "calc(16px + env(safe-area-inset-bottom))";
const BOTTOM_SAFE = "calc(112px + env(safe-area-inset-bottom))";

const MEDAL_PALETTES = {
  gold: {
    light: "#fff3c4",
    mid: "#f6c445",
    dark: "#b8791a",
    ring: "#e8a530",
    text: "#7c4a03",
  },
  silver: {
    light: "#f5f7fa",
    mid: "#c3cbd4",
    dark: "#7c8793",
    ring: "#a9b3bd",
    text: "#3b4550",
  },
  bronze: {
    light: "#f3c89a",
    mid: "#c97f3f",
    dark: "#7a4a1e",
    ring: "#b06a2e",
    text: "#4a2a0c",
  },
  default: {
    light: "#e6ddff",
    mid: "#a689f0",
    dark: "#6d3fc4",
    ring: "#8c5fe0",
    text: "#3a1d70",
  },
};

const RESULT_TABS = [
  { id: "standings", label: "Standings" },
  { id: "summary", label: "Summary" },
];

async function shareResults(score, quizTitle) {
  const text = `🎯 I scored ${score} points on "${quizTitle}" — try beating me on Ceibaa!`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "My quiz score", text });
      return "shared";
    } catch (err) {
      if (err && err.name === "AbortError") {
        // User intentionally cancelled the native share sheet — don't fall through to clipboard.
        return "canceled";
      }
      // Any other share failure: continue to clipboard copy as a fallback.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (err) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        return "copied";
      }
    } catch (e) {
      console.error("Clipboard fallback failed:", e);
    }
    return "failed";
  }
}

const CONFETTI_COLORS = [
  "#fbbf24",
  "#f87171",
  "#34d399",
  "#818cf8",
  "#f472b6",
  "#facc15",
];

function makeConfettiPieces() {
  return Array.from({ length: 36 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 2.6 + Math.random() * 1.4,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 120,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: i % 3 === 0 ? "50%" : "2px",
  }));
}

const Confetti = () => {
  // Generated fresh per mount so every "Flawless" result gets its own scatter pattern
  // instead of the same layout replaying for every user/session.
  const [pieces] = useState(makeConfettiPieces);

  return (
    <div
      aria-hidden
      data-testid="results-confetti"
      className="fixed inset-0 z-40 overflow-hidden pointer-events-none"
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, -10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--drift), 110vh) rotate(720deg);
            opacity: 0.9;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: p.shape,
            // @ts-expect-error -- custom property consumed by the keyframes above
            "--drift": `${p.drift}px`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.35,0,0.65,1) ${p.delay}s 1 both`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const MedalGraphic = ({ variant = "gold" }) => {
  const palette = MEDAL_PALETTES[variant] || MEDAL_PALETTES.default;
  const arcId = `medal-arc-${variant}`;
  const gradId = `medal-grad-${variant}`;
  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg
        viewBox="0 0 80 80"
        width="80"
        height="80"
        className="absolute inset-0 drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="26%" r="75%">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="55%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.dark} />
          </radialGradient>
          <path id={arcId} d="M 16 22 A 24 24 0 0 1 64 22" fill="none" />
        </defs>

        {/* Coin */}
        <circle cx="40" cy="40" r="34" fill={`url(#${gradId})`} stroke={palette.ring} strokeWidth="3" />
        <circle cx="40" cy="40" r="28.5" fill="none" stroke={palette.dark} strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

        {/* Brand lettering along the inner arc */}
        <text
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="1.5"
          fill={palette.text}
          style={{ fontFamily: "'Geist','Inter',sans-serif" }}
        >
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            CEIBAA
          </textPath>
        </text>
      </svg>
      <Trophy
        className="absolute w-7 h-7 text-white drop-shadow-sm"
        style={{ left: "40px", top: "46px", transform: "translate(-50%, -50%)" }}
        aria-hidden
      />
    </div>
  );
};

const StatChip = ({
  icon,
  label,
  value,
  testid,
}) => (
  <div className="bg-white rounded-2xl px-2 py-3 text-center shadow-[0_10px_30px_-15px_rgba(0,0,0,0.35)] min-w-0">
    <div className="flex items-center justify-center mb-1">{icon}</div>
    <p
      data-testid={testid}
      className="text-slate-900 text-[16px] font-bold tracking-tight tabular-nums leading-none truncate"
    >
      {value}
    </p>
    <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-slate-400 font-semibold truncate">
      {label}
    </p>
  </div>
);

const StandingsPanel = ({
  leaderboard,
  loading,
  user,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    );
  }
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No attempts yet — you're first.
      </p>
    );
  }
  const medalColors = ["text-amber-500", "text-slate-400", "text-orange-600"];
  const isMe = (e) =>
    (user && e.user_id === user.id) || e.user_name === user?.name;

  return (
    <ul className="space-y-1.5">
      {leaderboard.slice(0, 10).map((entry, i) => (
        <li
          key={entry.id || i}
          data-testid={`leaderboard-row-${i}`}
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors ${
            isMe(entry)
              ? "bg-violet-50 ring-1 ring-violet-200"
              : i < 3
                ? "bg-slate-50"
                : "active:bg-slate-50"
          }`}
        >
          <span className="w-7 flex items-center justify-center flex-shrink-0">
            {i < 3 ? (
              <Medal className={`w-5 h-5 ${medalColors[i]}`} />
            ) : (
              <span className="text-slate-400 text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
            )}
          </span>
          <span className="flex-1 min-w-0 text-slate-900 text-[13.5px] font-medium truncate">
            {entry.user_name}
            {isMe(entry) && (
              <span className="ml-1.5 text-[9.5px] uppercase tracking-[0.1em] text-violet-600 font-semibold">
                You
              </span>
            )}
          </span>
          <span className="text-slate-900 text-[13.5px] font-bold tabular-nums flex-shrink-0">
            {entry.score}
            <span className="text-slate-400 font-normal ml-1">pts</span>
          </span>
          <span className="text-slate-400 text-[11px] w-9 text-right tabular-nums flex-shrink-0">
            {entry.percentage}%
          </span>
        </li>
      ))}
    </ul>
  );
};

const SummaryPanel = ({
  questions,
  answers,
}) => {
  if (!questions || questions.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No question data available.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5" data-testid="results-summary-list">
      {questions.map((q, i) => {
        const a = answers[i];
        const selected = a?.selected_answer?.toUpperCase() || null;
        const correctLetter = q.correct_answer?.toUpperCase();
        const isCorrect = Boolean(selected) && selected === correctLetter;
        const isTimeout = !selected || selected === "";
        return (
          <li
            key={q.id || i}
            data-testid={`results-summary-row-${i}`}
            className="rounded-2xl border border-slate-100 bg-white px-3.5 py-3"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  isCorrect
                    ? "bg-emerald-100 text-emerald-600"
                    : isTimeout
                      ? "bg-slate-100 text-slate-400"
                      : "bg-rose-100 text-rose-600"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isTimeout ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5">
                  Q{i + 1}
                </p>
                <p className="text-slate-900 text-[13.5px] font-medium leading-snug">
                  {(q.question || "").split("\n")[0]}
                </p>
                <p className="mt-1.5 text-[11.5px] text-slate-500 leading-relaxed">
                  {isTimeout ? (
                    <>
                      Time's up · answer was{" "}
                      <span className="text-emerald-600 font-semibold">
                        {correctLetter}
                      </span>
                    </>
                  ) : isCorrect ? (
                    <>
                      You chose{" "}
                      <span className="text-emerald-600 font-semibold">
                        {selected}
                      </span>
                    </>
                  ) : (
                    <>
                      You chose{" "}
                      <span className="text-rose-600 font-semibold">
                        {selected}
                      </span>{" "}
                      · correct was{" "}
                      <span className="text-emerald-600 font-semibold">
                        {correctLetter}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="self-center flex flex-col items-end gap-0.5 flex-shrink-0">
                <span
                  className={`text-[11.5px] font-bold tabular-nums ${
                    isCorrect ? "text-emerald-600" : "text-slate-300"
                  }`}
                >
                  {isCorrect ? `+${POINTS_PER_CORRECT}` : "0"}
                </span>
                {isCorrect && (a?.time_bonus || 0) > 0 && (
                  <span
                    data-testid={`results-summary-bonus-${i}`}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 tabular-nums"
                  >
                    <Zap className="w-2.5 h-2.5" />+{a?.time_bonus}
                  </span>
                )}
              </div>
            </div>

            {q.explanation && (
              <div
                data-testid={`results-summary-explanation-${i}`}
                className="mt-2.5 pt-2.5 border-t border-slate-100"
              >
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-violet-700 font-semibold mb-1">
                  Explanation
                </p>
                <p className="text-slate-600 text-[12.5px] leading-relaxed whitespace-pre-line break-words">
                  {q.explanation}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export { POINTS_PER_CORRECT };

const ORDINALS = ["1st", "2nd", "3rd"];

// ─── Main ResultsScreen component ───────────────────────────────────────────
// All data comes from real API props — no mocks, no static fallbacks.
export const ResultsScreen = ({
  quiz,
  score,
  correct,
  total,
  leaderboard,
  onHome,
  loadingLB,
  questions,
  answers,
  user,
  onRetry,
  timeBonus = 0,
  /** Height (px) of any fixed bottom nav bar the host app renders on top of this screen. Defaults to 96. */
  bottomNavHeight = 96,
}) => {
  const [tab, setTab] = useState("standings");
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState(null);
  const shareMsgTimeoutRef = React.useRef(null);

  const safeLeaderboard = leaderboard || [];

  const pct = total ? Math.round((correct / total) * 100) : 0;
  const maxScore = total * POINTS_PER_CORRECT;
  const scorePct = maxScore ? Math.min(100, (score / maxScore) * 100) : 0;

  const myRank = safeLeaderboard.findIndex(
    (e) =>
      (user && e.user_id === user.id) || e.user_name === user?.name,
  );
  const displayRank = myRank >= 0 ? myRank + 1 : null;
  const isTopThree = Boolean(displayRank && displayRank <= 3);

  const medalVariant =
    displayRank === 1
      ? "gold"
      : displayRank === 2
        ? "silver"
        : displayRank === 3
          ? "bronze"
          : "default";

  // Rank-aware phrasing applies whenever the user placed top 3, regardless of score band,
  // so a high scorer who also ranked 2nd sees that reflected rather than just a generic line.
  const headline =
    pct === 100
      ? "Flawless — you nailed it!"
      : isTopThree
        ? `Nice! You're in ${ORDINALS[displayRank - 1]} place`
        : pct >= 80
          ? "Great job!"
          : pct >= 50
            ? "Nice effort!"
            : "Keep practicing — you'll get there.";

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setShareMsg(null);
    try {
      const result = await shareResults(score, quiz?.title || "Ceibaa Quiz");
      if (result === "shared") setShareMsg("Shared!");
      else if (result === "copied") setShareMsg("Link copied to clipboard!");
      else if (result === "failed") setShareMsg("Could not copy link automatically.");
      else if (result === "canceled") setShareMsg(null);
    } finally {
      setSharing(false);
      if (shareMsgTimeoutRef.current) clearTimeout(shareMsgTimeoutRef.current);
      shareMsgTimeoutRef.current = setTimeout(() => setShareMsg(null), 2500);
    }
  };

  React.useEffect(() => {
    return () => {
      if (shareMsgTimeoutRef.current) clearTimeout(shareMsgTimeoutRef.current);
    };
  }, []);

  return (
    <section
      data-testid="quiz-results-screen"
      className="relative flex flex-col overflow-x-hidden overscroll-none"
      style={{
        minHeight: "100dvh",
        paddingBottom: `calc(${BOTTOM_SAFE} + ${bottomNavHeight}px)`,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
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
      {pct === 100 && <Confetti />}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "#4c1d95" }} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, #7c3aed 0%, #8b5cf6 55%, #a78bfa 100%)",
          clipPath: "polygon(0 42%, 100% 30%, 100% 100%, 0 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      {/* Top bar: title / Share */}
      <div
        className="relative px-3.5"
        style={{ paddingTop: "calc(14px + env(safe-area-inset-top))" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <span
            className="text-white/90 font-semibold text-[14px] tracking-tight"
            style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
          >
            Results
          </span>
          <button
            data-testid="results-share-btn"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share your score"
            className="w-11 h-11 shrink-0 rounded-2xl bg-white/15 active:bg-white/25 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors disabled:opacity-60 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            {sharing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Share2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p
          data-testid="results-share-msg"
          role="status"
          aria-live="polite"
          className="mt-2 text-center text-white/80 text-[11.5px] min-h-[1.2em]"
        >
          {shareMsg || ""}
        </p>
      </div>

      {/* Hero: medal + friendly headline */}
      <div className="relative px-4 mt-5 text-center">
        <MedalGraphic variant={medalVariant} />
        <h1
          className="mt-4 text-white text-[24px] leading-[1.25] font-bold tracking-tight px-1"
          style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
          data-testid="results-headline"
        >
          {headline}
        </h1>
        <p data-testid="results-quiz-title" className="mt-1.5 text-white/80 text-[13px]">
          {quiz?.title}
        </p>
      </div>

      {/* Stat chips — all from real API data */}
      <div className="relative px-3.5 mt-5">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2.5">
          <StatChip
            testid="results-score"
            icon={<Trophy className="w-4 h-4 text-amber-500" />}
            label="Score"
            value={score}
          />
          <StatChip
            testid="results-accuracy"
            icon={<Award className="w-4 h-4 text-emerald-500" />}
            label="Accuracy"
            value={`${pct}%`}
          />
          <StatChip
            testid="results-correct"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            label="Correct"
            value={`${correct}/${total}`}
          />
        </div>
      </div>

      {/* Segmented tabs + panel card */}
      <div className="relative px-3.5 mt-5">
        <div className="relative max-w-2xl mx-auto">
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 w-[90%] h-16 -bottom-8 rounded-[24px] bg-white/25 backdrop-blur-sm shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]"
          />
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 w-[95%] h-16 -bottom-4 rounded-[24px] bg-white/55 backdrop-blur-md shadow-[0_18px_36px_-18px_rgba(0,0,0,0.3)]"
          />
          <div className="relative bg-white rounded-[24px] shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.45)] overflow-hidden animate-[cardEnter_0.28s_ease-out]">
          <div className="p-2 border-b border-slate-100" data-testid="results-tabs">
            <div className="grid grid-cols-2 gap-1 bg-slate-100/70 rounded-2xl p-1">
              {RESULT_TABS.map((t) => (
                <button
                  key={t.id}
                  data-testid={`results-tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`min-h-[42px] rounded-xl text-[13.5px] font-semibold transition-colors touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2 ${
                    tab === t.id
                      ? "bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]"
                      : "text-slate-500 active:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-5">
            {tab === "standings" && (
              <StandingsPanel leaderboard={safeLeaderboard} loading={loadingLB} user={user} />
            )}
            {tab === "summary" && (
              <SummaryPanel questions={questions} answers={answers} />
            )}
          </div>

          <div className="px-4 pb-5">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-1000"
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <p className="mt-2 text-[11.5px] text-slate-500 tabular-nums">
              {score} <span className="text-slate-400">/ {maxScore} points</span>
            </p>
            {timeBonus > 0 && (
              <p
                data-testid="results-time-bonus"
                className="mt-1 text-[11px] text-amber-600 font-semibold flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Includes +{timeBonus} speed bonus for fast answers
              </p>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Floating action row — offset clears any fixed host-app bottom nav via bottomNavHeight */}
      <div
        className="fixed left-0 right-0 z-30 flex justify-center gap-2.5 px-4"
        style={{ bottom: `calc(${ACTION_BAR_OFFSET} + ${bottomNavHeight}px)` }}
      >
        <button
          data-testid="results-home-btn"
          onClick={onHome}
          className="flex-1 max-w-[160px] inline-flex items-center justify-center gap-1.5 rounded-full bg-white/95 active:bg-white text-violet-700 font-semibold text-[14px] py-3.5 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.35)] active:translate-y-[1px] transition-[transform] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          <span>Home</span>
        </button>
        <button
          data-testid="results-retry-btn"
          onClick={onRetry}
          className="flex-1 max-w-[220px] inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 active:bg-emerald-400 text-white font-semibold text-[14px] py-3.5 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.65)] active:translate-y-[1px] transition-[background-color,transform] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play again</span>
        </button>
      </div>
    </section>
  );
};

// ─── Default export = the real component (NOT a mock wrapper) ────────────────
// SponsoredQuizPage should import this default and pass real API props to it.
export default ResultsScreen;