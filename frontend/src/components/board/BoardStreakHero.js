import React from 'react';
import { Flame, Check, Gift, Lock } from 'lucide-react';

const WINGMAN_URLS = {
  1: 'https://app.emergent.sh/assets/wingman-1-DuAAA5cf.png',
  3: 'https://app.emergent.sh/assets/wingman-3-FVwopPLo.png',
  4: 'https://app.emergent.sh/assets/wingman-4-CyxEgrUG.png',
  5: 'https://app.emergent.sh/assets/wingman-5-DmKoQGjz.png',
};
const wingmanSrc = (n) => WINGMAN_URLS[n] || WINGMAN_URLS[1];

const BoardStreakHero = ({
  streak = 0,
  nextMilestone = 7,
  daysToMilestone = 7,
  weeklyActivity = [],
  nextReward = 'Study Planner',
  currentWingman = 1,
  nextRewardWingman = 1,
  milestoneTiers = [],
}) => {
  const padded = String(streak).padStart(2, '0');
  const awayCopy =
    streak === 0
      ? 'Start your study streak today!'
      : `You're just ${daysToMilestone} day${daysToMilestone === 1 ? '' : 's'} away from your next goal!`;
  const rewardCopy =
    daysToMilestone <= 0
      ? `${nextReward} unlocked!`
      : `Unlock ${nextReward} in ${daysToMilestone} day${daysToMilestone === 1 ? '' : 's'}`;

  const week = weeklyActivity.length === 7
    ? weeklyActivity
    : Array.from({ length: 7 }, () => ({ day_label: '·', active: false, is_today: false, date: '' }));

  return (
    <section
      data-testid="board-streak-hero"
      className="relative mb-0 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border-0 md:border md:border-white/60 shadow-none md:shadow-[0_20px_50px_rgba(34,197,94,0.06)] hover:md:shadow-[0_30px_70px_rgba(34,197,94,0.12)] transition-all duration-500"
    >
      {/* ──────────── HEADER: count + mascot ──────────── */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 flex items-start gap-4 md:gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative inline-flex mb-3.5" data-testid="board-streak-flame">
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 blur-xl animate-pulse" aria-hidden />
            <div className="relative w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Flame
                className="w-6 h-6 text-emerald-500 fill-emerald-500/10"
                strokeWidth={2.5}
              />
            </div>
          </div>

          <h2
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none"
            data-testid="board-streak-count"
          >
            {padded} day streak
          </h2>
          <p className="mt-3.5 text-slate-500 text-sm font-medium leading-relaxed">{awayCopy}</p>
        </div>

        {/* Mascot Mascot Box */}
        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-slate-50/50 to-slate-100/50 border border-slate-100/30 flex items-center justify-center overflow-hidden shadow-inner group">
          <img
            src={wingmanSrc(currentWingman)}
            alt="Streak mascot"
            data-testid="board-streak-mascot"
            className="w-20 h-20 md:w-28 md:h-28 object-contain select-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3"
            draggable={false}
          />
        </div>
      </div>

      {/* ──────────── 7-DAY CHECK STRIP ──────────── */}
      <div className="px-6 md:px-8 pb-5">
        <div className="rounded-2xl bg-slate-50/40 border border-slate-100/30 px-3 md:px-5 py-4">
          <div className="grid grid-cols-7 gap-1.5 md:gap-3">
            {week.map((d, idx) => (
              <div key={`${d.date || idx}`} className="flex flex-col items-center gap-2.5">
                <span
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                    d.is_today ? 'text-[#7c5cff]' : 'text-slate-400'
                  }`}
                >
                  {d.day_label}
                </span>
              <span
                  data-testid={`board-streak-day-${d.day_label?.toLowerCase()}`}
                  className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-300 ${
                    d.active
                      ? 'bg-slate-800 text-white shadow-md shadow-slate-900/10 scale-105 border border-slate-700'
                      : d.is_today
                      ? 'bg-white border-2 border-[#7c5cff] text-[#7c5cff]'
                      : 'bg-slate-50 border border-slate-200 text-slate-400'
                  }`}
                >
                  {d.active
                    ? <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3.5} />
                    : <span className="text-[11px] md:text-xs font-bold tabular-nums leading-none">
                        {d.date ? new Date(d.date).getDate() : '·'}
                      </span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────── NEXT REWARD BANNER ──────────── */}
      <div
        className="px-6 md:px-8 py-4.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-t border-emerald-500/10 flex items-center gap-4.5"
        data-testid="board-streak-reward-banner"
      >
        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white border border-emerald-100 flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={wingmanSrc(nextRewardWingman)}
            alt="Next reward"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700">Next Reward</p>
          <p className="text-sm md:text-base font-black text-slate-800 truncate mt-0.5">{rewardCopy}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
          <Gift className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>

      {/* ──────────── FULL MILESTONE LADDER ──────────── */}
      {milestoneTiers.length > 0 && (
        <div className="px-6 md:px-8 py-6 border-t border-slate-100" data-testid="board-streak-milestones">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Milestone Ladder</h3>
            <span className="text-xs font-bold text-[#7c5cff] bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100/50">
              {milestoneTiers.filter((t) => t.cleared).length} / {milestoneTiers.length} Unlocked
            </span>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-thin scrollbar-thumb-slate-200">
            {milestoneTiers.map((tier) => {
              const isCleared = tier.cleared;
              const isNext = !isCleared && tier.days === nextMilestone;
              return (
                <div
                  key={tier.days}
                  data-testid={`board-milestone-${tier.days}d`}
                  className={`relative shrink-0 snap-start w-[125px] md:w-[145px] rounded-2xl p-3 border transition-all duration-300 hover:-translate-y-0.5 ${
                    isCleared
                      ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-300/40 shadow-sm'
                      : isNext
                      ? 'bg-white border-[#7c5cff] shadow-md shadow-violet-500/5 ring-4 ring-violet-50'
                      : 'bg-slate-50/50 border-slate-200/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isCleared
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isNext
                        ? 'bg-violet-100 text-[#7c5cff] border border-violet-200/30'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {tier.days}d
                    </span>
                    {isCleared ? (
                      <Check className="w-4 h-4 text-emerald-600" strokeWidth={3.5} />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 mx-auto my-3 flex items-center justify-center">
                    <img
                      src={wingmanSrc(tier.wingman)}
                      alt={tier.reward}
                      className={`max-w-full max-h-full object-contain ${
                        isCleared ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-95'
                      }`}
                      draggable={false}
                    />
                  </div>
                  <p className={`text-[11px] font-bold leading-snug text-center truncate ${
                    isCleared ? 'text-emerald-800' : isNext ? 'text-slate-800 font-extrabold' : 'text-slate-500'
                  }`}>
                    {tier.reward}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default BoardStreakHero;
