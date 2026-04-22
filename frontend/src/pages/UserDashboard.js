import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Trophy, Target, TrendingUp, Award, BookOpen, Clock,
  Flame, Star, Crown, Medal, Zap, Calendar, BarChart3,
  PieChart, Activity, CheckCircle, Lock, Play, Users,
  Brain, Sparkles, Gift, Settings, Bell, User, ChevronRight,
  ArrowUp, ArrowDown, Circle, TrendingDown, Shield, Hexagon
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = window.location.origin;

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExam, setSelectedExam] = useState('JEE');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('ceibaa_user');
    
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    // Load user from localStorage
    try {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  // User Data (will be fetched from backend later)
  const userData = {
    name: user?.name || 'Student',
    avatar: '👨‍🎓',
    level: 12,
    xp: 2450,
    xpToNextLevel: 3000,
    rank: 1247,
    rankChange: +23,
    totalBattles: 89,
    winRate: 68,
    currentStreak: 7,
    longestStreak: 15,
    coinsEarned: 8950,
    joinDate: 'Jan 2024',
    location: 'India'
  };

  // Progress by Exam
  const examProgress = {
    JEE: {
      subjects: {
        Physics: { completed: 145, total: 200, accuracy: 78, lastScore: 850, improvement: +5 },
        Chemistry: { completed: 132, total: 200, accuracy: 72, lastScore: 720, improvement: +3 },
        Mathematics: { completed: 167, total: 200, accuracy: 85, lastScore: 950, improvement: +8 }
      },
      overallProgress: 74,
      topicsStrong: ['Mechanics', 'Organic Chemistry', 'Calculus'],
      topicsWeak: ['Electromagnetism', 'Inorganic Chemistry', 'Probability'],
      estimatedScore: 245,
      targetScore: 300
    },
    NEET: {
      subjects: {
        Physics: { completed: 89, total: 200, accuracy: 71, lastScore: 710, improvement: +2 },
        Chemistry: { completed: 98, total: 200, accuracy: 75, lastScore: 750, improvement: +4 },
        Biology: { completed: 112, total: 200, accuracy: 82, lastScore: 820, improvement: +6 }
      },
      overallProgress: 50,
      topicsStrong: ['Human Physiology', 'Organic Chemistry'],
      topicsWeak: ['Genetics', 'Physical Chemistry'],
      estimatedScore: 420,
      targetScore: 600
    }
  };

  // Recent Activity
  const recentActivity = [
    { id: 1, type: 'battle', title: 'Won Physics Battle', points: 150, time: '2 hours ago', icon: '⚡', color: 'text-yellow-400' },
    { id: 2, type: 'achievement', title: 'Unlocked "Quiz Master" Badge', points: 100, time: '5 hours ago', icon: '🏆', color: 'text-purple-400' },
    { id: 3, type: 'milestone', title: 'Completed 100 Questions', points: 200, time: '1 day ago', icon: '🎯', color: 'text-green-400' },
    { id: 4, type: 'streak', title: '7 Day Streak Maintained', points: 50, time: '1 day ago', icon: '🔥', color: 'text-orange-400' }
  ];

  // Achievements
  const achievements = [
    { id: 1, name: 'First Victory', icon: '🏆', earned: true, date: 'Jan 15' },
    { id: 2, name: 'Quiz Master', icon: '👑', earned: true, date: 'Jan 20' },
    { id: 3, name: 'Speed Demon', icon: '⚡', earned: true, date: 'Jan 25' },
    { id: 4, name: 'Perfect Score', icon: '💯', earned: false, locked: true },
    { id: 5, name: 'Top 100', icon: '🌟', earned: false, locked: true },
    { id: 6, name: 'Battle Legend', icon: '👹', earned: false, locked: true }
  ];

  // Study Goals
  const studyGoals = [
    { id: 1, title: 'Complete 50 Physics Questions', current: 38, target: 50, deadline: '2 days', priority: 'high' },
    { id: 2, title: 'Maintain 7-day streak', current: 7, target: 7, deadline: 'Today', priority: 'medium' },
    { id: 3, title: 'Improve Chemistry by 10%', current: 72, target: 82, deadline: '1 week', priority: 'high' }
  ];

  // Weekly Performance
  const weeklyPerformance = [
    { day: 'Mon', battles: 3, score: 850 },
    { day: 'Tue', battles: 4, score: 920 },
    { day: 'Wed', battles: 2, score: 680 },
    { day: 'Thu', battles: 5, score: 1050 },
    { day: 'Fri', battles: 3, score: 890 },
    { day: 'Sat', battles: 6, score: 1150 },
    { day: 'Sun', battles: 4, score: 980 }
  ];

  const currentExam = examProgress[selectedExam];
  const maxScore = Math.max(...weeklyPerformance.map(d => d.score));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header Component */}
      <Header 
        isLoggedIn={true} 
        user={user} 
        onLogout={() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('ceibaa_user');
          navigate('/login');
        }}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with User Profile */}
        <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative">
                <div className="text-6xl">{userData.avatar}</div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Lv {userData.level}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {userData.name}! 👋</h1>
                <p className="text-purple-200">Keep up the great work! You're on fire! 🔥</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white">Rank #{userData.rank}</span>
                    <span className={`${userData.rankChange > 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                      {userData.rankChange > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(userData.rankChange)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white">{userData.currentStreak} day streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex space-x-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-4 text-center min-w-[100px]">
                <p className="text-3xl font-bold text-white">{userData.totalBattles}</p>
                <p className="text-yellow-100 text-sm">Battles</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-center min-w-[100px]">
                <p className="text-3xl font-bold text-white">{userData.winRate}%</p>
                <p className="text-green-100 text-sm">Win Rate</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-center min-w-[100px]">
                <p className="text-3xl font-bold text-white">{userData.coinsEarned}</p>
                <p className="text-purple-100 text-sm">Coins</p>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Level {userData.level} Progress</span>
              <span className="text-purple-200">{userData.xp} / {userData.xpToNextLevel} XP</span>
            </div>
            <div className="bg-white/20 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 h-full transition-all duration-1000"
                style={{ width: `${(userData.xp / userData.xpToNextLevel) * 100}%` }}
              >
                <div className="w-full h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Streak Card */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">🔥 Current Streak</h3>
                    <p className="text-orange-100">Keep the momentum going!</p>
                  </div>
                  <div className="text-6xl font-bold text-white">{userData.currentStreak}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Longest: {userData.longestStreak} days</span>
                  <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-semibold">
                    Keep Going →
                  </button>
                </div>
              </div>

              {/* Exam Progress Selector */}
              <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">📚 Exam Progress</h3>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="bg-white/10 text-white px-4 py-2 rounded-xl border border-white/20 font-semibold"
                  >
                    <option value="JEE">JEE Main & Advanced</option>
                    <option value="NEET">NEET UG</option>
                  </select>
                </div>

                {/* Overall Progress */}
                <div className="bg-white/10 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-semibold">Overall Completion</span>
                    <span className="text-white font-bold text-2xl">{currentExam.overallProgress}%</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-1000 flex items-center justify-end pr-2"
                      style={{ width: `${currentExam.overallProgress}%` }}
                    >
                      <span className="text-white text-xs font-bold">{currentExam.overallProgress}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-white/60 text-sm">Estimated Score</p>
                      <p className="text-2xl font-bold text-cyan-400">{currentExam.estimatedScore}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Target Score</p>
                      <p className="text-2xl font-bold text-purple-400">{currentExam.targetScore}</p>
                    </div>
                  </div>
                </div>

                {/* Subject-wise Progress */}
                <div className="space-y-4">
                  {Object.entries(currentExam.subjects).map(([subject, data]) => (
                    <div key={subject} className="bg-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {subject === 'Physics' ? '⚗️' : subject === 'Chemistry' ? '🧪' : subject === 'Biology' ? '🧬' : '📐'}
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{subject}</h4>
                            <p className="text-white/60 text-sm">{data.completed}/{data.total} Questions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-xl">{data.accuracy}%</p>
                          <p className={`text-sm flex items-center justify-end ${data.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {data.improvement > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(data.improvement)}%
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(data.completed / data.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/60 text-sm">Last Score: {data.lastScore}</span>
                        <button 
                          onClick={() => navigate('/')}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                        >
                          Practice →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-green-500/20 rounded-2xl p-4">
                    <h5 className="text-green-400 font-bold mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Strong Topics</span>
                    </h5>
                    <div className="space-y-2">
                      {currentExam.topicsStrong.map((topic, index) => (
                        <div key={`topic-${index}-${topic}`} className="text-white/80 text-sm">• {topic}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-red-500/20 rounded-2xl p-4">
                    <h5 className="text-red-400 font-bold mb-3 flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Need Practice</span>
                    </h5>
                    <div className="space-y-2">
                      {currentExam.topicsWeak.map((topic, index) => (
                        <div key={`topic-${index}-${topic}`} className="text-white/80 text-sm">• {topic}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Performance Chart */}
              <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">📊 Weekly Performance</h3>
                <div className="flex items-end justify-between space-x-2 h-64">
                  {weeklyPerformance.map((day, index) => (
                    <div key={`day-${day.day || index}`} className="flex-1 flex flex-col items-center">
                      <div className="relative w-full">
                        <div
                          className="bg-gradient-to-t from-purple-500 to-pink-600 rounded-t-lg transition-all duration-500 hover:scale-105"
                          style={{ height: `${(day.score / maxScore) * 200}px` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-xl text-white text-xs px-2 py-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                            {day.score}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-white/80 text-sm font-semibold">{day.day}</p>
                        <p className="text-white/60 text-xs">{day.battles} battles</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                    <span className="text-white/60 text-sm">Daily Score</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-white/60 text-sm">Improving Trend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Study Goals */}
              <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  <span>🎯 Study Goals</span>
                </h3>
                <div className="space-y-4">
                  {studyGoals.map((goal) => (
                    <div key={goal.id} className={`bg-white/10 rounded-2xl p-4 ${
                      goal.priority === 'high' ? 'border-2 border-red-500/50' : ''
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">{goal.title}</h4>
                        {goal.priority === 'high' && (
                          <span className="bg-red-500/30 text-red-300 text-xs px-2 py-1 rounded-full">High</span>
                        )}
                      </div>
                      <div className="bg-white/20 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{goal.current}/{goal.target}</span>
                        <span className="text-cyan-400">{goal.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-green-400" />
                  <span>⚡ Recent Activity</span>
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="bg-white/10 rounded-2xl p-4 hover:bg-white/20 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className={`text-2xl ${activity.color}`}>{activity.icon}</div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{activity.title}</p>
                          <p className="text-white/60 text-xs">{activity.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-bold">+{activity.points}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">🚀 Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/join-room')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white py-3 px-4 rounded-2xl transition-all flex items-center justify-between"
                  >
                    <span className="font-semibold">Start Battle</span>
                    <Play className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white py-3 px-4 rounded-2xl transition-all flex items-center justify-between"
                  >
                    <span className="font-semibold">Practice Mode</span>
                    <Brain className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate('/join-room')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white py-3 px-4 rounded-2xl transition-all flex items-center justify-between"
                  >
                    <span className="font-semibold">Join Room</span>
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">🏆 Your Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-3xl p-6 text-center transition-all hover:scale-105 ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-2xl'
                      : 'bg-white/10 opacity-50'
                  }`}
                >
                  {achievement.locked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <div className="text-6xl mb-3">{achievement.icon}</div>
                  <h3 className="text-white font-bold mb-1">{achievement.name}</h3>
                  {achievement.earned && (
                    <p className="text-white/80 text-sm">{achievement.date}</p>
                  )}
                  {achievement.locked && (
                    <p className="text-white/60 text-sm">Locked</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Total Questions</h3>
                  <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-5xl font-bold mb-2">444</p>
                <p className="text-blue-100">Across all subjects</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Avg Accuracy</h3>
                  <Target className="w-8 h-8" />
                </div>
                <p className="text-5xl font-bold mb-2">78%</p>
                <p className="text-green-100">+5% this week</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Study Time</h3>
                  <Clock className="w-8 h-8" />
                </div>
                <p className="text-5xl font-bold mb-2">47h</p>
                <p className="text-purple-100">This month</p>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">Detailed Progress Analysis</h3>
              <p className="text-white/70">Comprehensive analytics coming soon...</p>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8">Activity Timeline</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-white/10 rounded-2xl p-6 hover:bg-white/20 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl ${activity.color}`}>{activity.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{activity.title}</h3>
                      <p className="text-white/60">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-2xl">+{activity.points}</p>
                      <p className="text-white/60 text-sm">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
