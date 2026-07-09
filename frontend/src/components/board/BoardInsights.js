import React from 'react';
import { Lightbulb, Star, Zap, Clock, Brain, Award } from 'lucide-react';

/**
 * BoardInsights — edge-to-edge on mobile
 * ──────────────────────────────────────
 * Both cards now use the SAME edge-to-edge pattern as BoardFigmaHero /
 * BoardStreakHero: no border, no shadow, no rounded corners on mobile.
 * The `match_percent` value is defensively clamped so it can never > 100.
 */

// Defensive clamp for any percentage — never exceeds 100
const clampPct = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(100, v);
};

const BoardInsights = ({
  loadingInsights,
  aiInsights,
  recommendedTests,
  onStartRecommendedTest,
}) => {
  const insightCard = (icon, label, body, accent) => (
    <div className={`flex items-start gap-4.5 p-4.5 rounded-2xl border transition-all duration-300 hover:shadow-md ${accent.bg} ${accent.border}`}>
      <div className={`shrink-0 w-10 h-10 rounded-xl ${accent.iconBg} flex items-center justify-center border ${accent.border}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className={`text-[10px] uppercase font-bold tracking-wider ${accent.label}`}>{label}</span>
        <p className="text-sm font-bold text-slate-800 mt-1 leading-snug">{body}</p>
      </div>
    </div>
  );

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-6 mb-0 md:mb-6"
      data-testid="board-insights-section"
    >
      {/* ═══════ AI Insights ═══════ */}
      <section
        className="relative w-full overflow-hidden bg-white/70 backdrop-blur-xl
                   border-0 md:border md:border-white/60
                   shadow-none md:shadow-[0_20px_50px_rgba(124,92,255,0.04)]
                   md:hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)]
                   md:rounded-3xl transition-all duration-500"
        style={{ padding: 0 }}
      >
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7c5cff] flex items-center justify-center shadow-sm">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              AI Insights
            </h3>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
              AI Powered
            </span>
          </div>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-100 border-b-amber-500"></div>
            </div>
          ) : aiInsights ? (
            <div className="space-y-4">
              {aiInsights.strengths?.slice(0, 2).map((s, i) =>
                <div key={s.area || `strength-${i}`}>
                  {insightCard(
                    <Star className="w-5 h-5 text-emerald-600 fill-emerald-500/10" strokeWidth={2.2} />,
                    s.area, s.description,
                    { bg: 'bg-emerald-50/50', border: 'border-emerald-100/50', iconBg: 'bg-emerald-100/30', label: 'text-emerald-700 font-extrabold' }
                  )}
                </div>
              )}
              {aiInsights.weaknesses?.slice(0, 1).map((w, i) =>
                <div key={w.area || `weakness-${i}`}>
                  {insightCard(
                    <Zap className="w-5 h-5 text-amber-600 fill-amber-500/10" strokeWidth={2.2} />,
                    w.area, w.description,
                    { bg: 'bg-amber-50/50', border: 'border-amber-100/50', iconBg: 'bg-amber-100/30', label: 'text-amber-700 font-extrabold' }
                  )}
                </div>
              )}
              {aiInsights.best_study_time && insightCard(
                <Clock className="w-5 h-5 text-sky-600" strokeWidth={2.2} />,
                'Best Study Time', aiInsights.best_study_time.time,
                { bg: 'bg-sky-50/50', border: 'border-sky-100/50', iconBg: 'bg-sky-100/30', label: 'text-sky-700 font-extrabold' }
              )}
              {aiInsights.tip_of_the_day && insightCard(
                <Brain className="w-5 h-5 text-[#7c5cff]" strokeWidth={2.2} />,
                'Tip of the Day', aiInsights.tip_of_the_day,
                { bg: 'bg-violet-50/50', border: 'border-violet-100/50', iconBg: 'bg-violet-100/30', label: 'text-[#7c5cff] font-extrabold' }
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">Complete more quizzes to get AI insights</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ Recommended Tests ═══════ */}
      <section
        className="relative w-full overflow-hidden bg-white/70 backdrop-blur-xl
                   border-0 md:border md:border-white/60
                   shadow-none md:shadow-[0_20px_50px_rgba(124,92,255,0.04)]
                   md:hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)]
                   md:rounded-3xl transition-all duration-500"
        style={{ padding: 0 }}
      >
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7c5cff] flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-[#7c5cff]" />
              </div>
              Recommended for You
            </h3>
          </div>

          {recommendedTests.length > 0 ? (
            <div className="space-y-4">
              {recommendedTests.slice(0, 4).map((test, index) => {
                const matchPct = clampPct(test.match_percent);
                return (
                  <div
                    key={test.id || test.title || `rec-${index}`}
                    className="p-4.5 bg-slate-50/50 hover:bg-violet-50/30 border border-slate-100 hover:border-violet-200/50 rounded-2xl transition-all cursor-pointer group hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 group-hover:text-[#7c5cff] transition-colors truncate">{test.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{test.description}</p>
                      </div>
                      <div className="shrink-0 px-2.5 py-1 bg-gradient-to-r from-[#7c5cff] to-[#ec4899] text-white rounded-full text-xs font-black shadow-md shadow-violet-500/10">
                        {matchPct.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-4">
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="px-2.5 py-1 bg-white text-slate-500 rounded-lg border border-slate-200/50">{test.duration}</span>
                        <span className="px-2.5 py-1 bg-white text-slate-500 rounded-lg border border-slate-200/50">{test.questions} Q</span>
                        <span className={`px-2.5 py-1 rounded-lg border ${
                          test.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                          test.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                          test.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-150' :
                          'bg-white text-slate-500 border-slate-200/50'
                        }`}>{test.difficulty}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRecommendedTest(test);
                        }}
                        className="px-4 py-2 bg-[#7c5cff] text-white text-xs font-bold rounded-xl hover:bg-[#6a4ce4] transition-colors shrink-0 shadow-md shadow-violet-500/10 active:scale-95"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">Complete quizzes to get recommendations</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BoardInsights;
