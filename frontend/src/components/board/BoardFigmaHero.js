import React, { useState } from 'react';
import { Star, Trophy, Award, ArrowLeft, Settings, Lock, BookOpen, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * BoardFigmaHero — Queezy "Profile" frames 3 & 4 redesign for /board.
 *
 * Replaces the previous BoardProfileHeader. Renders:
 *  - Purple gradient header with blob/wave decoration
 *  - Centered avatar + name + level pill
 *  - White stat strip card (3 columns: Tests / Avg / Hours)
 *  - Tabs: Badges | Stats | Details
 *     - Badges  : hexagonal achievement grid driven by milestone_tiers + user.badges
 *     - Stats   : "X quizzes" ring progress, two mini cards, subject-mastery bars
 *     - Details : bio / location / exam focus / study goal / member-since
 *
 * Props:
 *   user             : { name, profile_picture, badges[], bio, location, exam_focus[], created_at }
 *   stats            : { tests_completed, avg_score, streak, study_hours, next_milestone,
 *                        days_to_milestone, milestone_tiers[] }
 *   learnerLevel     : string
 *   subjectMastery   : Array<{ subject, mastery, tests_taken, gradient, textColor }>
 *   roomsCreated     : number
 *   goalInfo         : { type, category_name } | null
 *   onChangeGoal     : fn
 */

// Hex shape (clip-path) — used for the badge tiles in the Badges tab.
const HEX_CLIP = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };

const BADGE_PALETTE = [
  { bg: 'bg-teal-400', icon: BookOpen },
  { bg: 'bg-amber-400', icon: Trophy },
  { bg: 'bg-sky-400', icon: Star },
  { bg: 'bg-rose-400', icon: Award },
  { bg: 'bg-indigo-400', icon: GraduationCap },
  { bg: 'bg-slate-500', icon: Lock }, // catch-all locked
];

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

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const avatar = user?.profile_picture || user?.avatar;

  // ───────── Build badges from milestones + user.badges ─────────
  const milestoneBadges = (stats?.milestone_tiers || []).slice(0, 5).map((tier, i) => ({
    label: tier.reward,
    sub: `${tier.days}d streak`,
    unlocked: tier.cleared,
    style: BADGE_PALETTE[i % (BADGE_PALETTE.length - 1)],
  }));
  // Append one locked "?" tile for visual symmetry (Figma uses 6 badges total)
  const allBadges = [
    ...milestoneBadges,
    { label: 'Coming soon', sub: 'Stay tuned', unlocked: false, style: BADGE_PALETTE[5] },
  ];

  // ───────── Stats tab progress ring (this-month tests vs goal of 50) ─────────
  const monthlyGoal = 50;
  const completed = Math.min(stats?.tests_completed || 0, monthlyGoal);
  const ringPct = (completed / monthlyGoal) * 100;
  const ringCircumference = 2 * Math.PI * 70;
  const ringDashOffset = ringCircumference * (1 - ringPct / 100);

  // ───────── Format member-since date ─────────
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <section
      className="relative mb-8 rounded-3xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(99,77,255,0.5)]"
      data-testid="board-figma-hero"
    >
      {/* ─────────── PURPLE HEADER ─────────── */}
      <div className="relative bg-gradient-to-b from-[#7c5cff] via-[#6a4ce4] to-[#5d3fd6] pt-6 pb-24 px-6 md:px-8">
        {/* Decorative blobs */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
          <circle cx="60" cy="50" r="80" fill="white" />
          <circle cx="330" cy="80" r="50" fill="white" />
          <circle cx="200" cy="20" r="30" fill="white" />
        </svg>

        {/* Top nav */}
        <div className="relative flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            data-testid="board-figma-back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            data-testid="board-figma-settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="relative flex flex-col items-center text-center">
          {avatar ? (
            <img
              src={avatar}
              alt={user?.name || 'User'}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-bold">
              {initial}
            </div>
          )}
          <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white" data-testid="board-figma-name">
            {user?.name || 'Student'}
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            {learnerLevel}
          </div>
        </div>
      </div>

      {/* ─────────── WHITE BODY ─────────── */}
      <div className="relative bg-white pt-0 pb-6 px-6 md:px-8 -mt-16 rounded-t-[2rem]">
        {/* 3-column stat strip — pulled up over the purple */}
        <div
          className="relative -mt-6 mx-auto max-w-md rounded-2xl bg-white shadow-[0_12px_30px_-12px_rgba(99,77,255,0.35)] border border-slate-100 grid grid-cols-3 divide-x divide-slate-100"
          data-testid="board-figma-stat-strip"
        >
          <div className="px-3 py-4 text-center">
            <div className="flex items-center justify-center mb-1.5 text-[#7c5cff]">
              <Star className="w-4 h-4" strokeWidth={2.5} fill="currentColor" />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Tests</div>
            <div className="mt-1 text-xl font-black text-slate-900" data-testid="board-figma-tests">
              {stats?.tests_completed ?? 0}
            </div>
          </div>
          <div className="px-3 py-4 text-center">
            <div className="flex items-center justify-center mb-1.5 text-[#7c5cff]">
              <Trophy className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Avg Score</div>
            <div className="mt-1 text-xl font-black text-slate-900" data-testid="board-figma-avg">
              {stats?.avg_score ?? 0}%
            </div>
          </div>
          <div className="px-3 py-4 text-center">
            <div className="flex items-center justify-center mb-1.5 text-[#7c5cff]">
              <Calendar className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Hours</div>
            <div className="mt-1 text-xl font-black text-slate-900" data-testid="board-figma-hours">
              {stats?.study_hours ?? 0}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-7 flex items-center justify-center gap-10 border-b border-slate-100">
          {['badges', 'stats', 'details'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              data-testid={`board-figma-tab-${t}`}
              className={`relative pb-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                tab === t ? 'text-[#7c5cff]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] w-1.5 h-1.5 rounded-full bg-[#7c5cff]" />
              )}
            </button>
          ))}
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
                    <p className="mt-2 text-xs font-bold text-slate-700 leading-tight max-w-[110px] truncate">
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
              {/* Monthly playthrough headline */}
              <p className="text-center text-sm text-slate-500">
                You have played a total{' '}
                <span className="font-bold text-[#7c5cff]">
                  {stats?.tests_completed || 0} quizzes
                </span>{' '}
                so far!
              </p>

              {/* Progress ring */}
              <div className="flex justify-center my-6">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f0fb" strokeWidth="12" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="#7c5cff"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                      className="transition-[stroke-dashoffset] duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-slate-900">
                      {completed}
                      <span className="text-slate-400 text-xl font-bold">/{monthlyGoal}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">quiz played</div>
                  </div>
                </div>
              </div>

              {/* Mini cards: rooms created + best streak */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                  <div className="text-2xl font-black text-slate-900">{roomsCreated}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Rooms Created</div>
                </div>
                <div className="rounded-2xl bg-[#f4f0ff] border border-violet-100 p-4 text-center">
                  <div className="text-2xl font-black text-[#7c5cff]">{stats?.streak || 0}</div>
                  <div className="text-xs text-violet-700/80 font-medium mt-1">Day Streak</div>
                </div>
              </div>

              {/* Top performance by category */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800">Top performance by category</h4>
                </div>
                {subjectMastery.length > 0 ? (
                  <div className="space-y-3">
                    {subjectMastery.slice(0, 4).map((s) => (
                      <div key={s.subject}>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-slate-700 truncate">{s.subject}</span>
                          <span className="font-bold text-slate-900">{s.mastery}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${s.gradient || 'from-violet-500 to-violet-600'} rounded-full transition-all duration-500`}
                            style={{ width: `${s.mastery}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
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
                    className="text-[#7c5cff] hover:underline font-semibold"
                    data-testid="board-figma-change-goal"
                  >
                    {goalInfo.category_name} · Change
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onChangeGoal}
                    className="text-[#7c5cff] hover:underline font-semibold"
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
    </section>
  );
};

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#f4f0ff] text-[#7c5cff] flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">{label}</div>
      <div className="text-sm font-medium text-slate-800 mt-0.5 break-words">{children}</div>
    </div>
  </div>
);

export default BoardFigmaHero;
