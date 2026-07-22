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
  streak = 0, nextMilestone = 7, daysToMilestone = 7,
  weeklyActivity = [], nextReward = 'Study Planner',
  currentWingman = 1, nextRewardWingman = 1, milestoneTiers = [],
}) => {
  const padded = String(streak).padStart(2, '0');
  const awayCopy =
    streak === 0
      ? 'Start your study streak today!'
      : `You're just ${daysToMilestone} day${daysToMilestone === 1 ? '' : 's'} away from your next goal.`;
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
      className="relative mb-0 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white border-y border-slate-200/70 md:border md:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_20px_50px_-24px_rgba(15,23,42,0.1)]"
    >
      {/* ── Header ── */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 flex items-start gap-4 md:gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative inline-flex mb-3" data-testid="board-streak-flame">
            <div className="relative w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/70 flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-600" strokeWidth={2.4} />
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium mb-1">Momentum</p>
          <h2
            className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-none"
            data-testid="board-streak-count"
          >
            {padded} <span className="text-slate-400 font-medium">day streak</span>
          </h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">{awayCopy}</p>
        </div>

        {/* Mascot */}
        <div className="shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden group">
          <img
            src={wingmanSrc(currentWingman)}
            alt="Streak mascot"
            data-testid="board-streak-mascot"
            className="w-16 h-16 md:w-24 md:h-24 object-contain select-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3"
            draggable={false}
          />
        </div>
      </div>

      {/* ── 7-day strip ── */}
      <div className="px-6 md:px-8 pb-5">
        <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-3 md:px-5 py-4">
          <div className="grid grid-cols-7 gap-1.5 md:gap-3">
            {week.map((d, idx) => (
              <div key={`${d.date || idx}`} className="flex flex-col items-center gap-2">
                <span
                  className={`text-[10px] md:text-xs uppercase tracking-[0.14em] ${
                    d.is_today ? 'text-violet-600 font-semibold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {d.day_label}
                </span>
                <span
                  data-testid={`board-streak-day-${d.day_label?.toLowerCase()}`}
                  className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-300 ${
                    d.active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : d.is_today
                      ? 'bg-white border-2 border-violet-500 text-violet-600'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  {d.active
                    ? <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                    : <span className="text-[11px] md:text-xs font-medium tabular-nums leading-none">
                        {d.date ? new Date(d.date).getDate() : '·'}
                      </span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Next reward banner ── */}
      <div
        className="px-6 md:px-8 py-4 bg-emerald-50/50 border-t border-emerald-100/60 flex items-center gap-4"
        data-testid="board-streak-reward-banner"
      >
        <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white border border-emerald-100 flex items-center justify-center overflow-hidden">
          <img
            src={wingmanSrc(nextRewardWingman)}
            alt="Next reward"
            className="w-9 h-9 md:w-10 md:h-10 object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] font-medium text-emerald-700">Next reward</p>
          <p className="text-sm md:text-[15px] font-semibold text-slate-800 truncate mt-0.5">{rewardCopy}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
          <Gift className="w-4 h-4" strokeWidth={2.2} />
        </div>
      </div>

      {/* ── Milestone ladder ── */}
      {milestoneTiers.length > 0 && (
        <div className="px-6 md:px-8 py-6 border-t border-slate-100" data-testid="board-streak-milestones">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium">Milestone ladder</p>
              <h3 className="text-sm font-semibold text-slate-900 mt-0.5">Rewards path</h3>
            </div>
            <span className="text-[11px] font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
              {milestoneTiers.filter((t) => t.cleared).length} / {milestoneTiers.length} unlocked
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x no-scrollbar">
            {milestoneTiers.map((tier) => {
              const isCleared = tier.cleared;
              const isNext = !isCleared && tier.days === nextMilestone;
              return (
                <div
                  key={tier.days}
                  data-testid={`board-milestone-${tier.days}d`}
                  className={`relative shrink-0 snap-start w-[125px] md:w-[145px] rounded-2xl p-3 border transition-all duration-200 hover:-translate-y-0.5 ${
                    isCleared
                      ? 'bg-emerald-50/60 border-emerald-200/70'
                      : isNext
                      ? 'bg-white border-violet-400 ring-4 ring-violet-100'
                      : 'bg-slate-50/60 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isCleared
                        ? 'bg-emerald-500 text-white'
                        : isNext
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-200/60 text-slate-500'
                    }`}>
                      {tier.days}d
                    </span>
                    {isCleared
                      ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                      : <Lock className="w-3.5 h-3.5 text-slate-300" />}
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 mx-auto my-2 flex items-center justify-center">
                    <img
                      src={wingmanSrc(tier.wingman)}
                      alt={tier.reward}
                      className={`max-w-full max-h-full object-contain ${
                        isCleared ? 'opacity-100' : 'opacity-40 grayscale scale-95'
                      }`}
                      draggable={false}
                    />
                  </div>
                  <p className={`text-[11px] leading-snug text-center truncate ${
                    isCleared
                      ? 'text-emerald-800 font-semibold'
                      : isNext
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-500 font-medium'
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

