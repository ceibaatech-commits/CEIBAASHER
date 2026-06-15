import React from 'react';
import { Lightbulb, Star, Zap, Clock, Brain, Award } from 'lucide-react';

/**
 * AI Insights + Recommended Tests — light Queezy aesthetic.
 * Two-column on desktop, stacked on mobile.
 */
const BoardInsights = ({
  loadingInsights,
  aiInsights,
  recommendedTests,
  onStartRecommendedTest,
}) => {
  const insightCard = (icon, label, body, accent) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${accent.bg} ${accent.border}`}>
      <div className={`shrink-0 w-9 h-9 rounded-lg ${accent.iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-bold ${accent.label}`}>{label}</div>
        <p className="text-sm text-slate-700 mt-0.5 leading-snug">{body}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6" data-testid="board-insights-section">
      {/* AI Insights */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI Insights
          </h3>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wide">AI Powered</span>
        </div>

        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : aiInsights ? (
          <div className="space-y-3">
            {aiInsights.strengths?.slice(0, 2).map((s, i) =>
              <div key={s.area || `strength-${i}`}>
                {insightCard(
                  <Star className="w-4 h-4 text-emerald-600" />,
                  s.area, s.description,
                  { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', label: 'text-emerald-700' }
                )}
              </div>
            )}
            {aiInsights.weaknesses?.slice(0, 1).map((w, i) =>
              <div key={w.area || `weakness-${i}`}>
                {insightCard(
                  <Zap className="w-4 h-4 text-amber-600" />,
                  w.area, w.description,
                  { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', label: 'text-amber-700' }
                )}
              </div>
            )}
            {aiInsights.best_study_time && insightCard(
              <Clock className="w-4 h-4 text-sky-600" />,
              'Best Study Time', aiInsights.best_study_time.time,
              { bg: 'bg-sky-50', border: 'border-sky-100', iconBg: 'bg-sky-100', label: 'text-sky-700' }
            )}
            {aiInsights.tip_of_the_day && insightCard(
              <Brain className="w-4 h-4 text-[#7c5cff]" />,
              'Tip of the Day', aiInsights.tip_of_the_day,
              { bg: 'bg-[#f4f0ff]', border: 'border-violet-100', iconBg: 'bg-violet-100', label: 'text-[#7c5cff]' }
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Complete more quizzes to get AI insights</p>
          </div>
        )}
      </div>

      {/* Recommended Tests */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7c5cff]" />
            Recommended for You
          </h3>
        </div>

        {recommendedTests.length > 0 ? (
          <div className="space-y-3">
            {recommendedTests.slice(0, 4).map((test, index) => (
              <div
                key={test.id || test.title || `rec-${index}`}
                className="p-4 bg-slate-50 hover:bg-[#f4f0ff] border border-slate-100 hover:border-violet-200 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 group-hover:text-[#7c5cff] transition-colors truncate">{test.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{test.description}</p>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 bg-[#7c5cff] text-white rounded-full text-xs font-bold">
                    {test.match_percent}%
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200">{test.duration}</span>
                    <span className="px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200">{test.questions} Q</span>
                    <span className={`px-2 py-0.5 rounded-full border ${
                      test.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      test.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      test.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-white text-slate-600 border-slate-200'
                    }`}>{test.difficulty}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRecommendedTest(test);
                    }}
                    className="px-4 py-1.5 bg-[#7c5cff] text-white text-xs font-bold rounded-lg hover:bg-[#6a4ce4] transition-colors shrink-0"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Complete quizzes to get personalized recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardInsights;
