import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  TrendingUp,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HEX_CLIP = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };

const BADGE_PALETTE = [
  { bg: 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/20', icon: BookOpen },
  { bg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20', icon: Trophy },
  { bg: 'bg-gradient-to-br from-sky-400 to-indigo-500 shadow-sky-500/20', icon: Star },
  { bg: 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-500/20', icon: Award },
  { bg: 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/20', icon: GraduationCap },
  { bg: 'bg-slate-400 to-slate-500', icon: Lock },
];

const countryCodeToFlag = (code) => {
  if (!code || typeof code !== 'string') return '🇮🇳';
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2) return '🇮🇳';
  const A = 0x1f1e6;
  const flag = String.fromCodePoint(A + (cc.charCodeAt(0) - 65)) + String.fromCodePoint(A + (cc.charCodeAt(1) - 65));
  return flag;
};

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
  const flag = countryCodeToFlag(user?.country_code || user?.country || 'IN');

  const tests = stats?.tests_completed ?? 0;
  const avg = stats?.avg_score ?? 0;
  const streak = stats?.streak ?? 0;
  const rank = stats?.rank ?? 0;

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
    if (btn) {
      setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [tab]);

  return (
    <section className="relative mb-4 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border-0 md:border md:border-white/60 shadow-none md:shadow-[0_20px_50px_rgba(124,92,255,0.06)] hover:md:shadow-[0_30px_70px_rgba(124,92,255,0.1)] transition-all duration-500">
      {/* ─────────────── GLASSMORPHIC HERO BANNER ─────────────── */}
      <div className="relative h-56 md:h-60 bg-gradient-to-br from-[#7c5cff] via-[#6a4ce4] to-[#4c2ec4] p-5 overflow-hidden">
        {/* Radial white glow — top-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,_rgba(255,255,255,0.22)_0%,_transparent_60%)] pointer-events-none" />
        {/* Animated ambient blobs */}
        <div className="absolute -top-8 -right-8 w-60 h-60 rounded-full bg-violet-300/35 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-12 left-[5%] w-72 h-72 rounded-full bg-pink-400/25 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-indigo-300/20 blur-2xl" />

        {/* Dot-grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Curved vector lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.5" />
          <path d="M0,70 Q30,40 60,70 T100,70" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Top actions toolbar */}
        <div className="relative flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Glassmorphic floating pill — bottom of banner */}
        <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-[9px] uppercase tracking-widest font-extrabold">Level</p>
            <p className="text-white text-sm font-black leading-tight truncate">{learnerLevel}</p>
          </div>
          {goalInfo && (
            <>
              <div className="w-px h-7 bg-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[9px] uppercase tracking-widest font-extrabold">Goal</p>
                <p className="text-white text-sm font-black leading-tight truncate">{goalInfo.title || goalInfo.goal_type}</p>
              </div>
            </>
          )}
          {/* Live indicator */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>

        {/* Frosted-glass bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#4c2ec4]/30 to-transparent backdrop-blur-[1px] pointer-events-none" />
      </div>

      {/* Profile avatar overlay */}
      <div className="relative flex flex-col items-center px-4 pb-4 md:px-6 md:pb-6 -mt-16 z-10">
        <div className="relative group">
          {/* Glowing Avatar border */}
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-pink-500 via-[#7c5cff] to-cyan-400 blur opacity-40 group-hover:opacity-85 transition duration-500" />
          
          {avatar ? (
            <img
              src={avatar}
              alt={user?.name || 'User'}
              className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl transition-all duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-extrabold border-4 border-white shadow-xl bg-gradient-to-br from-orange-400 to-rose-500 transition-all duration-300 group-hover:scale-[1.03]">
              {initial}
            </div>
          )}
        </div>

        {/* Name and Level */}
        <div className="text-center mt-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
            <span className="truncate max-w-[240px]">{user?.name || 'Student'}</span>
            <span className="text-xl filter drop-shadow-sm select-none" aria-label="Nationality">{flag}</span>
          </h2>
          
          {/* Level Pill with glowing badge */}
          <div className="flex justify-center mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold bg-violet-50 text-[#7c5cff] border border-violet-100/50 shadow-sm">
              <Award className="w-3.5 h-3.5 text-[#7c5cff]" strokeWidth={2.5} />
              {learnerLevel}
            </span>
          </div>
        </div>

        {/* ─────────────── PREMIUM STATS WIDGET ─────────────── */}
        <div className="w-full max-w-lg mt-4 md:mt-6 bg-white/80 border border-slate-100 rounded-2xl grid grid-cols-3 divide-x divide-slate-100 shadow-[0_12px_30px_-8px_rgba(124,92,255,0.08)]">
          {/* Avg Score */}
          <div className="py-4 text-center group hover:bg-[#fcfcff] rounded-l-2xl transition-all">
            <div className="flex items-center justify-center mb-1 text-[#7c5cff] group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Avg Score</span>
            <div className="mt-0.5 text-xl font-black text-slate-900 tabular-nums">
              {avg > 0 ? `${avg.toFixed(1)}%` : '—'}
            </div>
          </div>

          {/* Day Streak */}
          <div className="py-4 text-center group hover:bg-[#fcfcff] transition-all">
            <div className="flex items-center justify-center mb-1 text-[#7c5cff] group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Day Streak</span>
            <div className="mt-0.5 text-xl font-black text-slate-900 tabular-nums">{streak}</div>
          </div>

          {/* Rank */}
          <div className="py-4 text-center group hover:bg-[#fcfcff] rounded-r-2xl transition-all">
            <div className="flex items-center justify-center mb-1 text-[#7c5cff] group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Rank</span>
            <div className="mt-0.5 text-xl font-black text-slate-900 tabular-nums">
              {rank > 0 ? `#${rank}` : '—'}
            </div>
          </div>
        </div>

        {/* ─────────────── SEGMENTED UNDERLINE TABS ─────────────── */}
        <div ref={tabsRowRef} className="relative w-full mt-5 md:mt-8 flex items-center border-b border-slate-100">
          {tabIds.map((t) => (
            <button
              key={t}
              type="button"
              data-tab-btn
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors duration-200"
              style={{ color: tab === t ? '#7c5cff' : '#94a3b8' }}
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
              background: '#7c5cff',
              boxShadow: '0 -2px 10px rgba(124,92,255,0.4)',
              transition: 'left 300ms cubic-bezier(0.34, 1.56, 0.64, 1), width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>

        {/* Tab contents */}
        <div className="w-full mt-6 min-h-[220px]">
          {tab === 'badges' && (
            <div
              className="grid grid-cols-3 gap-y-6 gap-x-4 py-4 place-items-center"
              data-testid="board-figma-badges"
            >
              {allBadges.map((b, idx) => {
                const Icon = b.style.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className="relative">
                      {/* Ambient glowing backing for unlocked medals */}
                      {b.unlocked && (
                        <div className={`absolute inset-0 rounded-2xl blur-md opacity-25 group-hover:opacity-50 transition-opacity duration-300 ${b.style.bg}`} />
                      )}
                      
                      <div
                        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                          b.unlocked 
                            ? `${b.style.bg} border-white/25 text-white shadow-md shadow-violet-500/10` 
                            : 'bg-slate-50/70 border-slate-100 text-slate-350 shadow-inner'
                        } group-hover:-translate-y-1 group-hover:scale-105`}
                      >
                        <Icon className={`w-8 h-8 ${b.unlocked ? 'drop-shadow-sm' : 'text-slate-400 opacity-60'}`} strokeWidth={2.2} />
                        
                        {/* Lock details */}
                        {!b.unlocked && (
                          <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <Lock className="w-2.5 h-2.5" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                      {b.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">{b.sub}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div className="animate-fade-in">
              <p className="text-center text-sm text-slate-500 font-medium">
                You have played a total{' '}
                <span className="font-extrabold text-[#7c5cff]">{tests} quizzes</span> so far!
              </p>

              <div className="flex justify-center my-6">
                <div className="relative w-44 h-44 filter drop-shadow-md">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f8fafc" strokeWidth="12" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                      className="transition-[stroke-dashoffset] duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c5cff" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-slate-900 tabular-nums">
                      {completed}
                      <span className="text-slate-400 text-lg font-bold">/{monthlyGoal}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Quizzes Played</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-4 text-center hover:bg-slate-50 transition-colors">
                  <div className="text-2xl font-black text-slate-900 tabular-nums">{roomsCreated}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Rooms Created</div>
                </div>
                <div className="rounded-2xl p-4 text-center bg-violet-50/30 border border-violet-100/50 hover:bg-violet-50/50 transition-colors">
                  <div className="text-2xl font-black text-[#7c5cff] tabular-nums">{streak}</div>
                  <div className="text-[10px] uppercase font-bold text-[#7c5cff] tracking-wider mt-0.5">Day Streak</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl p-5 text-white bg-gradient-to-br from-[#7c5cff] to-[#ec4899] shadow-lg shadow-violet-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-extrabold leading-tight">Top Performance<br />By Category</h4>
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                </div>
                {subjectMastery.length > 0 ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider mb-4 text-white/90">
                      {subjectMastery.slice(0, 3).map((s, i) => (
                        <span key={s.subject} className="inline-flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            i === 0 ? 'bg-pink-300' : i === 1 ? 'bg-cyan-300' : 'bg-amber-300'
                          }`} />
                          <span>{s.subject}</span>
                        </span>
                      ))}
                    </div>
                    <div className="relative h-32 flex items-end gap-5 pl-10 pr-2 border-l border-b border-white/25">
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-white/60 pr-2 select-none">
                        <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                      </div>
                      {subjectMastery.slice(0, 3).map((s, i) => {
                        const barColor = i === 0 ? 'bg-pink-300' : i === 1 ? 'bg-cyan-300' : 'bg-amber-300';
                        return (
                          <div key={s.subject} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[10px] font-bold mb-1 tabular-nums">{s.mastery}%</span>
                            <div
                              className={`w-full max-w-[36px] rounded-t-lg ${barColor} shadow-md transition-all duration-1000 ease-out`}
                              style={{ height: `${Math.max(s.mastery, 4)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-5 pl-8 pr-2 mt-2 text-[10px] text-white/70 font-semibold uppercase tracking-wider">
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
            <div className="space-y-4 py-2">
              <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Bio">
                {user?.bio || <span className="text-slate-400 italic">No bio written yet</span>}
              </DetailRow>
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location">
                {user?.location || <span className="text-slate-400 italic">Not specified</span>}
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
                    className="hover:underline font-extrabold transition-all"
                    style={{ color: '#7c5cff' }}
                  >
                    {goalInfo.category_name} · Adjust Goal
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onChangeGoal}
                    className="hover:underline font-extrabold transition-all"
                    style={{ color: '#7c5cff' }}
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
  <div className="flex items-start gap-4 p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl hover:bg-slate-50 transition-colors">
    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50 text-[#7c5cff] border border-violet-100/30 shadow-sm">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
      <div className="text-sm font-bold text-slate-800 mt-0.5 break-words leading-tight">{children}</div>
    </div>
  </div>
);

export default BoardFigmaHero;