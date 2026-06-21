import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw, Zap, BookOpen, TrendingUp, Users, Award, Clock,
  Activity, AlertCircle, CheckCircle, BarChart3, Target, Flame
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const RealtimeAnalyticsDashboard = () => {
  const [liveBattles, setLiveBattles] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [summary, setSummary] = useState({});
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [classActivity, setClassActivity] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [battles, attempts, perf, performers, classAct, daily, summaryRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/analytics/live-battles?limit=20`).catch(() => ({ data: { live_battles: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/quiz-attempts-today?limit=30`).catch(() => ({ data: { quiz_attempts: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/subject-performance?days=7`).catch(() => ({ data: { subject_performance: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/top-performers?days=7&limit=10`).catch(() => ({ data: { top_performers: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/class-activity?days=7`).catch(() => ({ data: { class_activity: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/daily-activity?days=7`).catch(() => ({ data: { daily_activity: [] } })),
        axios.get(`${BACKEND_URL}/api/admin/analytics/realtime-summary`).catch(() => ({ data: { summary: {} } }))
      ]);

      setLiveBattles(battles.data.live_battles || []);
      setQuizAttempts(attempts.data.quiz_attempts || []);
      setSubjectPerformance(perf.data.subject_performance || []);
      setTopPerformers(performers.data.top_performers || []);
      setClassActivity(classAct.data.class_activity || []);
      setDailyActivity(daily.data.daily_activity || []);
      setSummary(summaryRes.data.summary || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatBox = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? <span className="animate-pulse">--</span> : value}
          </p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: bgColor }}>
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚡ Real-Time Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">Live battle data, quiz attempts & user activity</p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox
          icon={Zap}
          label="Active Battles Now"
          value={summary.active_battles_now || 0}
          color="#EF4444"
          bgColor="#FEE2E2"
        />
        <StatBox
          icon={BookOpen}
          label="Quizzes Today"
          value={summary.today_quizzes || 0}
          color="#3B82F6"
          bgColor="#DBEAFE"
        />
        <StatBox
          icon={Activity}
          label="Battles Today"
          value={summary.today_battles || 0}
          color="#8B5CF6"
          bgColor="#EDE9FE"
        />
        <StatBox
          icon={Clock}
          label="Last Hour Activity"
          value={summary.last_hour_activity || 0}
          color="#10B981"
          bgColor="#D1FAE5"
        />
      </div>

      {/* Live Battles Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-white" />
          <h2 className="text-xl font-bold text-white">🔴 Live Battles Now ({liveBattles.length})</h2>
        </div>

        {liveBattles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Player 1</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">vs</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Player 2</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                </tr>
              </thead>
              <tbody>
                {liveBattles.map((battle, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{battle.player1}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        battle.player1_score > battle.player2_score
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {battle.player1_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-bold">⚔️</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        battle.player2_score > battle.player1_score
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {battle.player2_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{battle.player2}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{battle.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{battle.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No active battles at the moment</p>
          </div>
        )}
      </div>

      {/* Quiz Attempts Today */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-white" />
          <h2 className="text-xl font-bold text-white">📖 Quiz Attempts Today ({quizAttempts.length})</h2>
        </div>

        {quizAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Chapter</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">%</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Time (min)</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.slice(0, 15).map((attempt, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{attempt.user}</td>
                    <td className="px-4 py-3 text-gray-700">{attempt.class}</td>
                    <td className="px-4 py-3 text-gray-700">{attempt.subject}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{attempt.chapter || '-'}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {attempt.score}/{attempt.total_marks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        attempt.percentage >= 70
                          ? 'bg-green-100 text-green-700'
                          : attempt.percentage >= 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {attempt.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{attempt.time_taken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No quiz attempts yet today</p>
          </div>
        )}
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Subject Performance (7 days)</h2>
          </div>

          {subjectPerformance.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {subjectPerformance.slice(0, 8).map((perf, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{perf.subject}</p>
                    <p className="text-xs text-gray-500">{perf.total_attempts} attempts • {perf.unique_users} users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{perf.avg_score}</p>
                    <p className="text-xs text-gray-500">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">🏆 Top Performers (7 days)</h2>
          </div>

          {topPerformers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {topPerformers.slice(0, 10).map((performer, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{performer.username}</p>
                      <p className="text-xs text-gray-500">{performer.total_attempts} attempts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{performer.avg_score}</p>
                    <p className="text-xs text-gray-500">avg</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Class Activity */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white">Class-Wise Activity (7 days)</h2>
        </div>

        {classActivity.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {classActivity.map((cls, idx) => (
              <div key={idx} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{cls.class}</p>
                  <span className="text-sm font-bold text-gray-900">{cls.avg_score}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${Math.min((cls.avg_score / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{cls.total_attempts} attempts • {cls.unique_students} students</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">No data available</div>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 mt-6">
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
      </div>
    </div>
  );
};

export default RealtimeAnalyticsDashboard;
