import React from 'react';
import { Flame, Check, Gift, Lock } from 'lucide-react';

/**
 * BoardStreakHero — Queezy-inspired streak card with milestone rewards.
 *
 * Props:
 *   streak             : number   (current consecutive-day count)
 *   nextMilestone      : number   (e.g. 7, 14, 30, …)
 *   daysToMilestone    : number   (nextMilestone - streak)
 *   weeklyActivity     : Array<{ date, day_label, active, is_today }>
 *   nextReward         : string   (e.g. "Study Planner")
 *   currentWingman     : 1..5     (mascot tier matching current streak progress)
 *   nextRewardWingman  : 1..5     (mascot of the next reward, shown on banner)
 *   milestoneTiers     : Array<{ days, reward, wingman, cleared }>
 */
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
      ? 'Start a streak today!'
      : `You're ${daysToMilestone} day${daysToMilestone === 1 ? '' : 's'} away!`;
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
      className="relative mb-8 rounded-3xl overflow-hidden bg-white/95 border border-white/40 shadow-[0_24px_60px_-30px_rgba(34,197,94,0.35)]"
    >
      {/* ──────────── HEADER: count + mascot ──────────── */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex items-start gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="relative inline-flex mb-3" data-testid="board-streak-flame">
            <span className="absolute inset-0 rounded-full bg-green-400/30 blur-xl" aria-hidden />
            <Flame
              className="relative w-10 h-10 text-green-500"
              strokeWidth={2.5}
              fill="rgb(34 197 94)"
            />
          </div>

          <h2
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none"
            data-testid="board-streak-count"
          >
            {padded} day streak
          </h2>
          <p className="mt-3 text-slate-500 text-base">{awayCopy}</p>
        </div>

        {/* Mascot — uses Emergent Wingman series, tier-driven */}
        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden">
          <img
            src={wingmanSrc(currentWingman)}
            alt="Streak mascot"
            data-testid="board-streak-mascot"
            className="w-20 h-20 md:w-28 md:h-28 object-contain select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* ──────────── 7-DAY CHECK STRIP ──────────── */}
      <div className="px-6 md:px-8 pb-4">
        <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-2 md:px-4 py-4">
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {week.map((d, idx) => (
              <div key={`${d.date || idx}`} className="flex flex-col items-center gap-2">
                <span
                  className={`text-[11px] md:text-xs font-semibold tracking-wide ${
                    d.is_today ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {d.day_label}
                </span>
                <span
                  data-testid={`board-streak-day-${d.day_label?.toLowerCase()}`}
                  className={`relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all ${
                    d.active
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-300'
                  } ${d.is_today && !d.active ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-slate-50/70' : ''}`}
                >
                  {d.active ? <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} /> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────── NEXT REWARD BANNER ──────────── */}
      <div
        className="px-6 md:px-8 py-4 bg-green-50 border-t border-green-100 flex items-center gap-4"
        data-testid="board-streak-reward-banner"
      >
        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white border border-green-100 flex items-center justify-center overflow-hidden">
          <img
            src={wingmanSrc(nextRewardWingman)}
            alt="Next reward"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider font-semibold text-green-700/70">Next reward</p>
          <p className="text-sm md:text-base font-bold text-green-800 truncate">{rewardCopy}</p>
        </div>
        <Gift className="w-6 h-6 md:w-7 md:h-7 text-green-600 shrink-0" strokeWidth={2.2} />
      </div>

      {/* ──────────── FULL MILESTONE LADDER ──────────── */}
      {milestoneTiers.length > 0 && (
        <div className="px-6 md:px-8 py-5 border-t border-slate-100" data-testid="board-streak-milestones">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Milestone Rewards</h3>
            <span className="text-xs text-slate-400">
              {milestoneTiers.filter((t) => t.cleared).length} / {milestoneTiers.length} unlocked
            </span>
          </div>
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {milestoneTiers.map((tier) => {
              const isCleared = tier.cleared;
              const isNext = !isCleared && tier.days === nextMilestone;
              return (
                <div
                  key={tier.days}
                  data-testid={`board-milestone-${tier.days}d`}
                  className={`relative shrink-0 snap-start w-[120px] md:w-[140px] rounded-2xl p-3 border transition-all ${
                    isCleared
                      ? 'bg-green-500/10 border-green-300/60'
                      : isNext
                      ? 'bg-white border-green-300 ring-2 ring-green-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isCleared
                        ? 'bg-green-500 text-white'
                        : isNext
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {tier.days}d
                    </span>
                    {isCleared ? (
                      <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <img
                    src={wingmanSrc(tier.wingman)}
                    alt={tier.reward}
                    className={`w-12 h-12 md:w-14 md:h-14 object-contain mx-auto ${
                      isCleared ? 'opacity-100' : 'opacity-50 grayscale'
                    }`}
                    draggable={false}
                  />
                  <p className={`mt-2 text-xs font-semibold leading-tight text-center ${
                    isCleared ? 'text-green-800' : isNext ? 'text-slate-800' : 'text-slate-500'
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
