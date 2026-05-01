import React from 'react';
import { Lightbulb, Star, Zap, Clock, Brain, Award } from 'lucide-react';

/**
 * AI Insights + Recommended Tests section of the Board dashboard.
 * Extracted from Board.js for maintainability. Pure presentational.
 */
const BoardInsights = ({
  loadingInsights,
  aiInsights,
  recommendedTests,
  onStartRecommendedTest,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* AI Insights */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            AI Insights
          </h3>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium border border-amber-500/30">AI Powered</span>
        </div>

        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          </div>
        ) : aiInsights ? (
          <div className="space-y-3">
            {/* Strengths */}
            {aiInsights.strengths?.slice(0, 2).map((s, i) => (
              <div key={s.area || `strength-${i}`} className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">{s.area}</span>
                </div>
                <p className="text-sm text-emerald-200/70">{s.description}</p>
              </div>
            ))}

            {/* Weaknesses */}
            {aiInsights.weaknesses?.slice(0, 1).map((w, i) => (
              <div key={w.area || `weakness-${i}`} className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-amber-300">{w.area}</span>
                </div>
                <p className="text-sm text-amber-200/70">{w.description}</p>
              </div>
            ))}

            {/* Best Study Time */}
            {aiInsights.best_study_time && (
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-300">Best Study Time</span>
                </div>
                <p className="text-sm text-blue-200/70">{aiInsights.best_study_time.time}</p>
              </div>
            )}

            {/* Tip */}
            {aiInsights.tip_of_the_day && (
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-purple-300">Tip of the Day</span>
                </div>
                <p className="text-sm text-purple-200/70">{aiInsights.tip_of_the_day}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-emerald-200/50">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Complete more quizzes to get AI insights</p>
          </div>
        )}
      </div>

      {/* Recommended Tests */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Recommended for You
          </h3>
        </div>

        {recommendedTests.length > 0 ? (
          <div className="space-y-3">
            {recommendedTests.slice(0, 4).map((test, index) => (
              <div
                key={test.id || test.title || `rec-${index}`}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{test.title}</h4>
                    <p className="text-sm text-emerald-200/60">{test.description}</p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-500/30 ml-2">
                    {test.match_percent}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-white/10 text-white/70 rounded-full border border-white/10">{test.duration}</span>
                    <span className="px-2 py-1 bg-white/10 text-white/70 rounded-full border border-white/10">{test.questions} Q</span>
                    <span className={`px-2 py-1 rounded-full border ${
                      test.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      test.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      test.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-white/10 text-white/70 border-white/20'
                    }`}>{test.difficulty}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRecommendedTest(test);
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-emerald-200/50">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Complete quizzes to get personalized recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardInsights;
