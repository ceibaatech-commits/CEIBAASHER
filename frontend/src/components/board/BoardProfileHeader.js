import React from 'react';
import { Target, Settings, GraduationCap, School } from 'lucide-react';

// Learner level → gradient mapping (mirror of LEVEL_COLORS in Board.js).
const LEVEL_COLORS = {
  Beginner: 'from-gray-400 to-gray-500',
  Learner: 'from-green-400 to-green-500',
  Intermediate: 'from-blue-400 to-blue-500',
  Advanced: 'from-purple-400 to-purple-500',
  Expert: 'from-orange-400 to-orange-500',
  Master: 'from-yellow-400 to-yellow-500',
};

/**
 * Glassmorphism profile header for /board.
 * Shows avatar / level pill, name + email, quick stats, and the active study-goal
 * pill (or a "Set Study Goal" CTA if none).
 *
 * Extracted from Board.js (Feb 25, 2026) to keep the parent file under ~700 lines.
 */
const BoardProfileHeader = ({
  user,
  learnerLevel = 'Beginner',
  dashboardStats = { tests_completed: 0, avg_score: 0, streak: 0 },
  goalInfo,
  onChangeGoal,
}) => {
  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const avatarSrc = user?.profile_picture || user?.avatar;
  const levelGradient = LEVEL_COLORS[learnerLevel] || LEVEL_COLORS.Beginner;

  return (
    <div
      className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 mb-8 border border-white/20 shadow-2xl"
      data-testid="board-profile-header"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.name || 'User'}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-emerald-400/50 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-xl border-4 border-emerald-400/50">
              {initial}
            </div>
          )}
          <div
            className={`absolute -bottom-2 -right-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${levelGradient} text-white text-xs font-bold shadow-lg border-2 border-white/30`}
          >
            {learnerLevel}
          </div>
        </div>

        {/* User info + quick stats */}
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1" data-testid="board-user-name">
            {user?.name || 'Student'}
          </h2>
          <p className="text-emerald-200/70 mb-3">{user?.email}</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="px-4 py-1.5 backdrop-blur-md bg-emerald-500/20 text-emerald-200 rounded-full text-sm font-medium border border-emerald-400/30">
              📚 {dashboardStats.tests_completed} Tests
            </span>
            <span className="px-4 py-1.5 backdrop-blur-md bg-blue-500/20 text-blue-200 rounded-full text-sm font-medium border border-blue-400/30">
              ⭐ {dashboardStats.avg_score}% Avg
            </span>
            <span className="px-4 py-1.5 backdrop-blur-md bg-orange-500/20 text-orange-200 rounded-full text-sm font-medium border border-orange-400/30">
              🔥 {dashboardStats.streak} Day Streak
            </span>
          </div>
        </div>

        {/* Study-goal badge */}
        <div className="text-center md:text-right">
          {goalInfo ? (
            <div className="inline-flex flex-col items-center md:items-end">
              <span className="text-xs text-emerald-200/60 mb-1.5">Preparing for</span>
              <div
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${
                  goalInfo.type === 'competitive'
                    ? 'from-purple-500 to-indigo-600'
                    : 'from-emerald-500 to-teal-600'
                } text-white font-semibold shadow-lg flex items-center gap-2 border border-white/20`}
              >
                {goalInfo.type === 'competitive' ? (
                  <GraduationCap className="w-5 h-5" />
                ) : (
                  <School className="w-5 h-5" />
                )}
                {goalInfo.category_name}
              </div>
              <button
                onClick={onChangeGoal}
                data-testid="board-change-goal-btn"
                className="text-xs text-emerald-300/70 hover:text-emerald-200 mt-2 flex items-center gap-1 transition-colors"
              >
                <Settings className="w-3 h-3" /> Change Goal
              </button>
            </div>
          ) : (
            <button
              onClick={onChangeGoal}
              data-testid="board-set-goal-btn"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 border border-white/20"
            >
              <Target className="w-5 h-5" />
              Set Study Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardProfileHeader;
