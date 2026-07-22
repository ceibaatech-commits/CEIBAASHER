import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Star, Trophy, Award, ArrowLeft, Settings, Lock, BookOpen, MapPin,
  Calendar, GraduationCap, TrendingUp, Flame, Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BADGE_PALETTE = [
  { tone: 'emerald', icon: BookOpen },
  { tone: 'amber',   icon: Trophy },
  { tone: 'sky',     icon: Star },
  { tone: 'rose',    icon: Award },
  { tone: 'violet',  icon: GraduationCap },
  { tone: 'slate',   icon: Lock },
];

// Utility color tokens for badges (kept semantic, no gradient soup)
const TONE = {
  emerald: { bg: 'bg-emerald-500', soft: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-500',   soft: 'bg-amber-50',   ring: 'ring-amber-100',   text: 'text-amber-700'   },
  sky:     { bg: 'bg-sky-500',     soft: 'bg-sky-50',     ring: 'ring-sky-100',     text: 'text-sky-700'     },
  rose:    { bg: 'bg-rose-500',    soft: 'bg-rose-50',    ring: 'ring-rose-100',    text: 'text-rose-700'    },
  violet:  { bg: 'bg-violet-500',  soft: 'bg-violet-50',  ring: 'ring-violet-100',  text: 'text-violet-700'  },
  slate:   { bg: 'bg-slate-400',   soft: 'bg-slate-100',  ring: 'ring-slate-100',   text: 'text-slate-600'   },
};

const countryCodeToFlag = (code) => {
  if (!code || typeof code !== 'string') return '🇮🇳';
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2) return '🇮🇳';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65)) + String.fromCodePoint(A + (cc.charCodeAt(1) - 65));
};

const BoardFigmaHero = ({
  user, stats, learnerLevel = 'Beginner', subjectMastery = [],
  roomsCreated = 0, goalInfo, onChangeGoal,
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('badges');
  const tabsRowRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const avatar = user?.profile_picture || user?.avatar;
  const flag = countryCodeToFlag(user?.country_code || user?.country || 'IN');

  const tests = stats?.tests_completed ?? 0;
  const avg = stats?.avg_score ?? 0;
  const streak = stats?.streak ?? 0;
  const rank = stats?.rank ?? 0;

  const milestoneBadges = (stats?.milestone_tiers || []).slice(0, 5).map((tier, i) => ({
    label: tier.reward, sub: `${tier.days}d streak`, unlocked: tier.cleared,
    style: BADGE_PALETTE[i % (BADGE_PALETTE.length - 1)],
  }));
  const allBadges = [
    ...milestoneBadges,
    { label: 'Coming soon', sub: 'Stay tuned', unlocked: false, style: BADGE_PALETTE[5] },
  ];

  const monthlyGoal = 50;
  const completed = Math.min(tests, monthlyGoal);
  const ringPct = (completed / monthlyGoal) * 100;
  const ringCircumference = 2 * Math.PI * 70;
  const ringDashOffset = ringCircumference * (1 - ringPct / 100);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  const tabIds = ['badges', 'stats', 'details'];
  useLayoutEffect(() => {
    const row = tabsRowRef.current;
    if (!row) return;
    const idx = tabIds.indexOf(tab);
    const btn = row.querySelectorAll('[data-tab-btn]')[idx];
    if (btn) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [tab]);

  return (
    <section className="relative mb-4 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white border-y border-slate-200/70 md:border md:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_20px_50px_-24px_rgba(15,23,42,0.12)]">

      {/* ─────── Refined banner: solid violet w/ subtle radial highlight only ─────── */}
      <div className="relative h-40 md:h-44 bg-[#5b3fda] overflow-hidden">
        {/* Single soft radial highlight — replaces the multi-blob AI-slop palette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_-20%,_rgba(255,255,255,0.35)_0%,_transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_120%,_rgba(0,0,0,0.25)_0%,_transparent_50%)] pointer-events-none" />

        {/* Refined dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots-hero" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-hero)" />
        </svg>

        {/* Top toolbar */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-5">
          <IconButton onClick={() => navigate(-1)} label="Back">
            <ArrowLeft className="w-4.5 h-4.5" />
          </IconButton>
          <IconButton onClick={() => navigate('/settings')} label="Settings">
            <Settings className="w-4.5 h-4.5" />
          </IconButton>
        </div>

        {/* Level + goal pill */}
        <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3 bg-white/12 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[10px] uppercase tracking-[0.14em] font-medium">Level</p>
            <p className="text-white text-sm font-semibold leading-tight truncate">{learnerLevel}</p>
          </div>
          {goalInfo && (
            <>
              <div className="w-px h-7 bg-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[10px] uppercase tracking-[0.14em] font-medium">Goal</p>
                <p className="text-white text-sm font-semibold leading-tight truncate">{goalInfo.title || goalInfo.goal_type}</p>
              </div>
            </>
          )}
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
          </span>
        </div>
      </div>

      {/* Avatar + identity */}
      <div className="relative flex flex-col items-center px-4 pb-6 md:px-6 md:pb-8 -mt-14 z-10">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-white shadow-lg" />
          {avatar ? (
            <img
              src={avatar} alt={user?.name || 'User'}
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-full object-cover ring-4 ring-white shadow-md"
            />
          ) : (
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-white shadow-md bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-3xl font-semibold">
              {initial}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center mt-4">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center justify-center gap-2">
            <span className="truncate max-w-[240px]">{user?.name || 'Student'}</span>
            <span className="text-lg select-none" aria-label="Nationality">{flag}</span>
          </h2>
          <div className="flex justify-center mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700">
              <Award className="w-3 h-3" strokeWidth={2.5} />
              {learnerLevel}
            </span>
          </div>
        </div>

        {/* Stats widget */}
        <div className="w-full max-w-lg mt-5 md:mt-6 border border-slate-200/70 rounded-2xl bg-white grid grid-cols-3 divide-x divide-slate-100">
          <StatCol icon={<TrendingUp className="w-5 h-5" />} label="Avg Score" value={avg > 0 ? `${avg.toFixed(1)}%` : '—'} />
          <StatCol icon={<Flame className="w-5 h-5" />}      label="Day Streak" value={streak} />
          <StatCol icon={<Trophy className="w-5 h-5" />}     label="Rank"       value={rank > 0 ? `#${rank}` : '—'} />
        </div>

        {/* Segmented tabs (pill style) */}
        <div ref={tabsRowRef} className="relative mt-6 md:mt-8 inline-flex bg-slate-100/70 rounded-xl p-1 gap-1">
          {tabIds.map((t) => (
            <button
              key={t} type="button" data-tab-btn
              onClick={() => setTab(t)}
              className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                tab === t ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
          <span
            aria-hidden
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
            style={{
              left: pillStyle.left, width: pillStyle.width,
              transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Tab contents */}
        <div className="w-full max-w-3xl mt-6 min-h-[220px]">
          {tab === 'badges' && (
            <div className="grid grid-cols-3 gap-y-6 gap-x-4 py-2 place-items-center" data-testid="board-figma-badges">
              {allBadges.map((b, idx) => {
                const Icon = b.style.icon;
                const tone = TONE[b.style.tone] || TONE.slate;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div
                      className={`relative w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 ${
                        b.unlocked
                          ? `${tone.bg} text-white shadow-sm`
                          : 'bg-slate-50 border border-slate-200 text-slate-400'
                      }`}
                      style={{ width: 68, height: 68 }}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2} />
                      {!b.unlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-slate-400" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 text-xs font-medium text-slate-800 leading-tight max-w-[110px] truncate">{b.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{b.sub}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div>
              <p className="text-center text-sm text-slate-500">
                You've played <span className="font-semibold text-slate-900">{tests}</span> {tests === 1 ? 'quiz' : 'quizzes'} so far
              </p>

              <div className="flex justify-center my-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="80" cy="80" r="70" fill="none"
                      stroke="url(#board-ring)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={ringCircumference} strokeDashoffset={ringDashOffset}
                      className="transition-[stroke-dashoffset] duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="board-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c5cff" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-semibold text-slate-900 tabular-nums">
                      {completed}<span className="text-slate-400 text-lg">/{monthlyGoal}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">Monthly goal</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Rooms Created" value={roomsCreated} icon={<Target className="w-3.5 h-3.5" />} />
                <MiniStat label="Day Streak" value={streak} icon={<Flame className="w-3.5 h-3.5" />} tone="violet" />
              </div>

              {/* Category performance card */}
              <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">Top performance</p>
                    <h4 className="text-sm font-semibold text-slate-900 mt-0.5">By Category</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                {subjectMastery.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mb-4">
                      {subjectMastery.slice(0, 3).map((s, i) => (
                        <span key={s.subject} className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-sky-500' : 'bg-amber-500'
                          }`} />
                          <span className="text-slate-700 font-medium">{s.subject}</span>
                        </span>
                      ))}
                    </div>
                    <div className="relative h-28 flex items-end gap-5 pl-8 pr-2 border-l border-b border-slate-200/70">
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 pr-2 select-none">
                        <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                      </div>
                      {subjectMastery.slice(0, 3).map((s, i) => {
                        const bar = i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-sky-500' : 'bg-amber-500';
                        return (
                          <div key={s.subject} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[10px] font-semibold text-slate-700 mb-1 tabular-nums">{s.mastery}%</span>
                            <div
                              className={`w-full max-w-[32px] rounded-t-md ${bar} transition-[height] duration-1000 ease-out`}
                              style={{ height: `${Math.max(s.mastery, 4)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-5 pl-8 pr-2 mt-2 text-[10px] text-slate-400">
                      {subjectMastery.slice(0, 3).map((s) => (
                        <span key={s.subject} className="flex-1 text-center truncate">{s.tests_taken} tests</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Complete a quiz to see category breakdown.
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div className="space-y-2">
              <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Bio">
                {user?.bio || <span className="text-slate-400 italic">No bio written yet</span>}
              </DetailRow>
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location">
                {user?.location || <span className="text-slate-400 italic">Not specified</span>}
              </DetailRow>
              <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Exam focus">
                {Array.isArray(user?.exam_focus) && user.exam_focus.length > 0
                  ? user.exam_focus.join(', ')
                  : <span className="text-slate-400 italic">Not set</span>}
              </DetailRow>
              <DetailRow icon={<Trophy className="w-4 h-4" />} label="Study goal">
                <button
                  type="button" onClick={onChangeGoal}
                  className="text-violet-600 hover:text-violet-700 font-semibold hover:underline"
                >
                  {goalInfo ? `${goalInfo.category_name} · Adjust goal` : 'Set a study goal'}
                </button>
              </DetailRow>
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Member since">{memberSince}</DetailRow>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const IconButton = ({ children, onClick, label }) => (
  <button
    type="button" onClick={onClick} aria-label={label}
    className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-white/12 hover:bg-white/20 border border-white/20 transition backdrop-blur-sm active:scale-95"
  >
    {children}
  </button>
);

const StatCol = ({ icon, label, value }) => (
  <div className="py-4 px-3 text-center group">
    <div className="flex items-center justify-center text-violet-500 mb-1.5">{icon}</div>
    <div className="text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mt-0.5 font-medium">{label}</div>
  </div>
);

const MiniStat = ({ label, value, icon, tone = 'slate' }) => {
  const bg = tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-xl p-3.5 ${bg} border border-transparent`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-medium opacity-70">
        {icon}{label}
      </div>
      <div className="text-xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
};

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-slate-400">{label}</span>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{children}</div>
    </div>
  </div>
);

export default BoardFigmaHero;

