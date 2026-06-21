import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
  Star,
  Trophy,
  Award,
  ArrowLeft,
  Settings,
  Lock,
  BookOpen,
  MapPin,
  Calendar,
  GraduationCap,
  Globe,
  Network,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * BoardFigmaHero — compact "Profile" hero for /board (Feb 15, 2026 redesign).
 *
 *  Layout strategy:
 *    [Purple hero  — height ≈ 38–40% of viewport, rounded bottom]
 *    [Avatar overlaps the seam (translateY 50%)]
 *    [White sheet — name + flag + Beginner pill + stats card + segmented tabs]
 *
 *  Stat strip:  POINTS (Star)  ·  WORLD RANK (Globe)  ·  LOCAL RANK (Network)
 *    points = tests_completed * 10 + (avg_score * streak)
 *    ranks  = "#—" placeholders for now (backend wiring later)
 */

const HEX_CLIP = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };

const BADGE_PALETTE = [
  { bg: 'bg-teal-400', icon: BookOpen },
  { bg: 'bg-amber-400', icon: Trophy },
  { bg: 'bg-sky-400', icon: Star },
  { bg: 'bg-rose-400', icon: Award },
  { bg: 'bg-indigo-400', icon: GraduationCap },
  { bg: 'bg-slate-500', icon: Lock },
];

// ─────────────────────────────────────────────────────────
// Helper: ISO-3166 alpha-2 → flag emoji (e.g. "IN" → 🇮🇳)
// Falls back to 🇮🇳 (India) when no country is set — Ceibaa's
// primary user base is India (JEE/NEET/UPSC/SSC).
// ─────────────────────────────────────────────────────────
const countryCodeToFlag = (code) => {
  if (!code || typeof code !== 'string') return '🇮🇳';
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2) return '🇮🇳';
  const A = 0x1f1e6;
  const flag = String.fromCodePoint(A + (cc.charCodeAt(0) - 65)) + String.fromCodePoint(A + (cc.charCodeAt(1) - 65));
  return flag;
};

// ─────────────────────────────────────────────────────────
// useCountUp — animate an integer from 0 to target over `duration`ms.
// Respects prefers-reduced-motion.
// ─────────────────────────────────────────────────────────
const useCountUp = (target, duration = 600) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const safeTarget = Number.isFinite(+target) ? +target : 0;
    if (typeof window === 'undefined') { setValue(safeTarget); return; }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setValue(safeTarget); return; }
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(safeTarget * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const BoardFigmaHero = ({
  user,
  stats,
  learnerLevel = 'Beginner',
  subjectMastery = [],
  roomsCreated = 0,
  goalInfo,
  onChangeGoal,
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('badges');
  const tabsRowRef = useRef(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const avatar = user?.profile_picture || user?.avatar;

  // ───────── Country flag (next to name) ─────────
  const flag = countryCodeToFlag(user?.country_code || user?.country || 'IN');

  // ───────── Stat values ─────────
  const tests = stats?.tests_completed ?? 0;
  const avg = stats?.avg_score ?? 0;
  const streak = stats?.streak ?? 0;
  const pointsTarget = useMemo(() => tests * 10 + Math.round(avg * streak), [tests, avg, streak]);
  const pointsValue = useCountUp(pointsTarget, 700);

  // Badges (Badges tab)
  const milestoneBadges = (stats?.milestone_tiers || []).slice(0, 5).map((tier, i) => ({
    label: tier.reward,
    sub: `${tier.days}d streak`,
    unlocked: tier.cleared,
    style: BADGE_PALETTE[i % (BADGE_PALETTE.length - 1)],
  }));
  const allBadges = [
    ...milestoneBadges,
    { label: 'Coming soon', sub: 'Stay tuned', unlocked: false, style: BADGE_PALETTE[5] },
  ];

  // Stats tab — progress ring
  const monthlyGoal = 50;
  const completed = Math.min(tests, monthlyGoal);
  const ringPct = (completed / monthlyGoal) * 100;
  const ringCircumference = 2 * Math.PI * 70;
  const ringDashOffset = ringCircumference * (1 - ringPct / 100);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  // ───────── Sliding tab underline ─────────
  const tabIds = ['badges', 'stats', 'details'];
  useLayoutEffect(() => {
    const row = tabsRowRef.current;
    if (!row) return;
    const idx = tabIds.indexOf(tab);
    const btn = row.querySelectorAll('[data-tab-btn]')[idx];
    if (btn) {
      setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [tab]);

  return (
    <section
      className="relative mb-8"
      data-testid="board-figma-hero"
      style={{ fontFamily: '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* ─────────────── PURPLE HERO (compact) ─────────────── */}
      <div
        className="relative overflow-hidden rounded-b-[28px] px-5 pt-4 pb-14"
        style={{
          background: 'linear-gradient(180deg, #6D5BFF 0%, #8B7BFF 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        {/* Decorative circles — small & tasteful */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <circle cx="60" cy="40" r="56" fill="white" opacity="0.10" />
          <circle cx="340" cy="60" r="34" fill="white" opacity="0.13" />
          <circle cx="200" cy="18" r="18" fill="white" opacity="0.08" />
          <circle cx="120" cy="150" r="22" fill="white" opacity="0.07" />
          <circle cx="320" cy="140" r="14" fill="white" opacity="0.05" />
        </svg>

        {/* Top row: back + settings */}
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)' }}
            data-testid="board-figma-back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)' }}
            data-testid="board-figma-settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar — absolutely positioned to overlap the seam */}
        <div className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 z-10 board-figma-avatar-in">
          {avatar ? (
            <img
              src={avatar}
              alt={user?.name || 'User'}
              className="w-24 h-24 rounded-full object-cover"
              style={{
                border: '4px solid #FFFFFF',
                boxShadow: '0 8px 24px rgba(76,46,196,0.35)',
              }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-semibold"
              style={{
                border: '4px solid #FFFFFF',
                boxShadow: '0 8px 24px rgba(76,46,196,0.35)',
                background: 'linear-gradient(135deg, #FF7A3D 0%, #FF5A28 100%)',
              }}
            >
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────── WHITE SHEET ─────────────── */}
      <div
        className="relative bg-white px-5 pb-6"
        style={{
          paddingTop: 56,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -24,
        }}
      >
        {/* Name + flag */}
        <h2
          className="text-center font-semibold text-slate-900"
          style={{ fontSize: (user?.name?.length || 0) > 14 ? 20 : 22, lineHeight: 1.15 }}
          data-testid="board-figma-name"
        >
          <span className="truncate inline-block max-w-[80%] align-middle">
            {user?.name || 'Student'}
          </span>
          <span
            className="ml-1.5 align-middle"
            style={{ fontSize: 18, lineHeight: 1 }}
            aria-label="Nationality"
            data-testid="board-figma-flag"
          >
            {flag}
          </span>
        </h2>

        {/* Beginner pill */}
        <div className="flex justify-center mt-2">
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-medium"
            style={{ backgroundColor: '#F4F0FF', color: '#6D5BFF' }}
            data-testid="board-figma-learner-level"
          >
            <Award className="w-3.5 h-3.5" strokeWidth={2.2} />
            {learnerLevel}
          </span>
        </div>

        {/* ─────────────── STATS CARD: POINTS · WORLD RANK · LOCAL RANK ─────────────── */}
        <div
          className="relative mt-5 mx-auto max-w-md rounded-[20px] bg-white grid grid-cols-3 divide-x divide-slate-100"
          style={{
            boxShadow: '0 10px 30px -10px rgba(76,46,196,0.18)',
            border: '1px solid #F1F5F9',
          }}
          data-testid="board-figma-stat-strip"
        >
          {/* POINTS */}
          <div className="px-2 py-[18px] text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: '#6D5BFF' }}>
              <Star className="w-6 h-6" strokeWidth={2.2} fill="currentColor" />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>
              Points
            </div>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums"
              style={{ color: '#0F172A' }}
              data-testid="board-figma-points"
            >
              {pointsValue.toLocaleString('en-IN')}
            </div>
          </div>

          {/* WORLD RANK */}
          <div className="px-2 py-[18px] text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: '#6D5BFF' }}>
              <Globe className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>
              World Rank
            </div>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums"
              style={{ color: '#0F172A' }}
              data-testid="board-figma-world-rank"
            >
              #—
            </div>
          </div>

          {/* LOCAL RANK */}
          <div className="px-2 py-[18px] text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: '#6D5BFF' }}>
              <Network className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>
              Local Rank
            </div>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums"
              style={{ color: '#0F172A' }}
              data-testid="board-figma-local-rank"
            >
              #—
            </div>
          </div>
        </div>

        {/* ─────────────── SEGMENTED TABS (with sliding underline) ─────────────── */}
        <div
          ref={tabsRowRef}
          className="relative mt-6 flex items-center"
          style={{ borderBottom: '1px solid #F1F5F9' }}
        >
          {tabIds.map((t) => (
            <button
              key={t}
              type="button"
              data-tab-btn
              onClick={() => setTab(t)}
              data-testid={`board-figma-tab-${t}`}
              className="flex-1 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors"
              style={{ color: tab === t ? '#6D5BFF' : '#94A3B8' }}
            >
              {t}
            </button>
          ))}
          {/* Sliding underline */}
          <span
            aria-hidden
            className="absolute -bottom-px rounded-full"
            style={{
              height: 3,
              left: underlineStyle.left,
              width: underlineStyle.width,
              background: '#6D5BFF',
              transition: 'left 250ms cubic-bezier(0.32,0.72,0,1), width 250ms cubic-bezier(0.32,0.72,0,1)',
            }}
          />
        </div>

        {/* Tab content */}
        <div className="mt-6 min-h-[260px]">
          {tab === 'badges' && (
            <div
              className="grid grid-cols-3 gap-y-6 gap-x-3 md:gap-x-6 py-4 place-items-center"
              data-testid="board-figma-badges"
            >
              {allBadges.map((b, idx) => {
                const Icon = b.style.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div
                      className={`relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-white shadow-md ${
                        b.unlocked ? b.style.bg : 'bg-slate-300'
                      }`}
                      style={HEX_CLIP}
                    >
                      <Icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2.2} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-700 leading-tight max-w-[110px] truncate">
                      {b.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{b.sub}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div data-testid="board-figma-stats">
              <p className="text-center text-sm text-slate-500">
                You have played a total{' '}
                <span className="font-semibold" style={{ color: '#6D5BFF' }}>
                  {tests} quizzes
                </span>{' '}
                so far!
              </p>

              <div className="flex justify-center my-6">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f0fb" strokeWidth="12" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="#6D5BFF"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                      className="transition-[stroke-dashoffset] duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-semibold text-slate-900 tabular-nums">
                      {completed}
                      <span className="text-slate-400 text-xl font-medium">/{monthlyGoal}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">quiz played</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                  <div className="text-2xl font-semibold text-slate-900 tabular-nums">{roomsCreated}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Rooms Created</div>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: '#F4F0FF', border: '1px solid #E9E0FF' }}>
                  <div className="text-2xl font-semibold tabular-nums" style={{ color: '#6D5BFF' }}>{streak}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#6D5BFF' }}>Day Streak</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #6D5BFF 0%, #8B7BFF 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold leading-tight">
                    Top performance<br />by category
                  </h4>
                  <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                {subjectMastery.length > 0 ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                      {subjectMastery.slice(0, 3).map((s, i) => (
                        <span key={s.subject} className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            i === 0 ? 'bg-rose-300' : i === 1 ? 'bg-sky-300' : 'bg-violet-200'
                          }`} />
                          <span className="font-medium">{s.subject}</span>
                        </span>
                      ))}
                    </div>
                    <div className="relative h-32 flex items-end gap-4 pl-10 pr-2 border-l border-b border-white/15">
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-medium text-white/60 pr-1">
                        <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                      </div>
                      {subjectMastery.slice(0, 3).map((s, i) => {
                        const barColor = i === 0 ? 'bg-rose-300' : i === 1 ? 'bg-sky-300' : 'bg-violet-200';
                        return (
                          <div key={s.subject} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[10px] font-semibold mb-1">{s.mastery}%</span>
                            <div
                              className={`w-full max-w-[40px] rounded-t-lg ${barColor} transition-all duration-700`}
                              style={{ height: `${Math.max(s.mastery, 4)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 pl-8 pr-2 mt-2 text-[10px] text-white/80 font-medium">
                      {subjectMastery.slice(0, 3).map((s) => (
                        <span key={s.subject} className="flex-1 text-center truncate">
                          {s.tests_taken} tests
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/70 text-center py-6">
                    Complete a quiz to see category breakdown.
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div className="space-y-4 py-2" data-testid="board-figma-details">
              <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Bio">
                {user?.bio || <span className="text-slate-400 italic">No bio yet</span>}
              </DetailRow>
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location">
                {user?.location || <span className="text-slate-400 italic">—</span>}
              </DetailRow>
              <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Exam Focus">
                {Array.isArray(user?.exam_focus) && user.exam_focus.length > 0
                  ? user.exam_focus.join(', ')
                  : <span className="text-slate-400 italic">Not set</span>}
              </DetailRow>
              <DetailRow icon={<Trophy className="w-4 h-4" />} label="Study Goal">
                {goalInfo ? (
                  <button
                    type="button"
                    onClick={onChangeGoal}
                    className="hover:underline font-semibold"
                    style={{ color: '#6D5BFF' }}
                    data-testid="board-figma-change-goal"
                  >
                    {goalInfo.category_name} · Change
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onChangeGoal}
                    className="hover:underline font-semibold"
                    style={{ color: '#6D5BFF' }}
                    data-testid="board-figma-set-goal"
                  >
                    Set a study goal
                  </button>
                )}
              </DetailRow>
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Member since">
                {memberSince}
              </DetailRow>
            </div>
          )}
        </div>
      </div>

      {/* Subtle motion: avatar fade+scale-in on mount. Respects reduced-motion. */}
      <style>{`
        @keyframes board-figma-avatar-in {
          from { opacity: 0; transform: translateY(50%) translateX(-50%) scale(0.85); }
          to   { opacity: 1; transform: translateY(50%) translateX(-50%) scale(1); }
        }
        .board-figma-avatar-in { animation: board-figma-avatar-in 600ms cubic-bezier(0.32,0.72,0,1); }
        @media (prefers-reduced-motion: reduce) { .board-figma-avatar-in { animation: none; } }
      `}</style>
    </section>
  );
};

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#F4F0FF', color: '#6D5BFF' }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#94A3B8' }}>{label}</div>
      <div className="text-sm font-medium text-slate-800 mt-0.5 break-words">{children}</div>
    </div>
  </div>
);

export default BoardFigmaHero;
