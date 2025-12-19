import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Clock, Users, Search, Play, CheckCircle, ArrowLeft,
  Target, Flame, BookOpen, TrendingUp, Calendar, Lightbulb,
  Star, Zap, Brain, ChevronRight, RefreshCw, Award
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Learner level colors
const LEVEL_COLORS = {
  'Beginner': 'from-gray-400 to-gray-500',
  'Learner': 'from-green-400 to-green-500',
  'Intermediate': 'from-blue-400 to-blue-500',
  'Advanced': 'from-purple-400 to-purple-500',
  'Expert': 'from-orange-400 to-orange-500',
  'Master': 'from-yellow-400 to-yellow-500'
};

const Board = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    tests_completed: 0,
    avg_score: 0,
    streak: 0,
    study_hours: 0
  });
  const [subjectMastery, setSubjectMastery] = useState([]);
  const [learnerLevel, setLearnerLevel] = useState('Beginner');
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [recommendedTests, setRecommendedTests] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  // Existing room state
  const [activeTab, setActiveTab] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, created: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('ceibaa_user');
    if (!userStr) {
      alert('Please login to view your Board');
      navigate('/login');
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    fetchRooms();
    fetchDashboardData(userData.id);
  }, []);

  useEffect(() => {
    filterRooms();
  }, [activeTab, searchQuery, rooms]);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch stats
      const statsRes = await axios.get(`${BACKEND_URL}/api/dashboard/stats/${userId}`);
      if (statsRes.data.success) {
        setDashboardStats(statsRes.data.stats);
        setSubjectMastery(statsRes.data.subject_mastery);
        setLearnerLevel(statsRes.data.learner_level);
      }
      setLoadingDashboard(false);

      // Fetch schedule
      const scheduleRes = await axios.get(`${BACKEND_URL}/api/dashboard/schedule/${userId}`);
      if (scheduleRes.data.success) {
        setWeeklySchedule(scheduleRes.data.schedule);
      }
      setLoadingSchedule(false);

      // Fetch insights
      const insightsRes = await axios.get(`${BACKEND_URL}/api/dashboard/insights/${userId}`);
      if (insightsRes.data.success) {
        setAiInsights(insightsRes.data.insights);
      }
      setLoadingInsights(false);

      // Fetch recommended tests
      const testsRes = await axios.get(`${BACKEND_URL}/api/dashboard/recommended-tests/${userId}`);
      if (testsRes.data.success) {
        setRecommendedTests(testsRes.data.tests);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadingDashboard(false);
      setLoadingSchedule(false);
      setLoadingInsights(false);
    }
  };

  const regenerateSchedule = async () => {
    if (!user) return;
    setLoadingSchedule(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/dashboard/regenerate-schedule/${user.id}`);
      if (res.data.success) {
        setWeeklySchedule(res.data.schedule);
      }
    } catch (error) {
      console.error('Error regenerating schedule:', error);
    }
    setLoadingSchedule(false);
  };

  const fetchRooms = async () => {
    try {
      const userStr = localStorage.getItem('ceibaa_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      const response = await axios.get(`${BACKEND_URL}/api/battle/async/user/${user.id}/rooms`);
      
      if (response.data.success) {
        const roomsData = response.data.rooms;
        setRooms(roomsData);
        
        const now = new Date();
        const active = roomsData.filter(r => new Date(r.expires_at) > now && r.is_active).length;
        const completed = roomsData.filter(r => new Date(r.expires_at) <= now || !r.is_active).length;
        const created = roomsData.filter(r => r.host_id === user.id).length;
        
        setStats({ total: roomsData.length, active, completed, created });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = rooms;
    const userStr = localStorage.getItem('ceibaa_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const now = new Date();

    if (activeTab === 'active') {
      filtered = filtered.filter(r => new Date(r.expires_at) > now && r.is_active);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(r => new Date(r.expires_at) <= now || !r.is_active);
    } else if (activeTab === 'created') {
      filtered = filtered.filter(r => user && r.host_id === user.id);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.pin.includes(searchQuery) ||
        r.host_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.exam_category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const rejoinRoom = (pin) => {
    const user = JSON.parse(localStorage.getItem('ceibaa_user'));
    navigate(`/live-battle/${pin}`, {
      state: {
        autoJoin: true,
        playerName: user.name
      }
    });
  };

  const viewRoomDetail = (pin) => {
    navigate(`/room/${pin}`);
  };

  const tabs = [
    { id: 'all', label: 'All Rooms', count: stats.total },
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'created', label: 'Rooms I Created', count: stats.created }
  ];

  const getTodaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return weeklySchedule.find(d => d.day === today) || weeklySchedule[0];
  };

  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Track your progress and performance</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full bg-gradient-to-r ${LEVEL_COLORS[learnerLevel]} text-white text-xs font-semibold shadow-md`}>
                {learnerLevel}
              </div>
            </div>
            
            {/* User Info */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Student'}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  📚 {dashboardStats.tests_completed} Tests
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  ⭐ {dashboardStats.avg_score}% Avg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{dashboardStats.tests_completed}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Tests Completed</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{dashboardStats.avg_score}%</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Average Score</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{dashboardStats.streak}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Day Streak 🔥</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{dashboardStats.study_hours}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Study Hours</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Mastery */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Subject Mastery
              </h3>
            </div>
            
            {subjectMastery.length > 0 ? (
              <div className="space-y-4">
                {subjectMastery.map((subject, index) => (
                  <div key={index} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{subject.subject}</span>
                      <span className={`font-bold ${subject.textColor}`}>{subject.mastery}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${subject.gradient} rounded-full transition-all duration-500 group-hover:shadow-md`}
                        style={{ width: `${subject.mastery}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{subject.tests_taken} tests taken</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete quizzes to see your subject mastery</p>
              </div>
            )}
          </div>

          {/* AI Weekly Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Today's Schedule
              </h3>
              <button 
                onClick={regenerateSchedule}
                disabled={loadingSchedule}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate Schedule"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loadingSchedule ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loadingSchedule ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : getTodaySchedule()?.sessions?.length > 0 ? (
              <div className="space-y-3">
                {getTodaySchedule().sessions.slice(0, 4).map((session, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      session.type === 'study' ? 'bg-emerald-500' :
                      session.type === 'practice' ? 'bg-blue-500' :
                      session.type === 'review' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}>
                      {session.subject?.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{session.topic}</div>
                      <div className="text-sm text-gray-500">{session.time} • {session.duration} mins</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.priority === 'high' ? 'bg-red-100 text-red-700' :
                        session.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.priority}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No schedule generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights & Recommended Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* AI Insights */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                AI Insights
              </h3>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">AI Powered</span>
            </div>
            
            {loadingInsights ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : aiInsights ? (
              <div className="space-y-4">
                {/* Strengths */}
                {aiInsights.strengths?.slice(0, 2).map((s, i) => (
                  <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">{s.area}</span>
                    </div>
                    <p className="text-sm text-emerald-700">{s.description}</p>
                  </div>
                ))}
                
                {/* Weaknesses */}
                {aiInsights.weaknesses?.slice(0, 1).map((w, i) => (
                  <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-amber-800">{w.area}</span>
                    </div>
                    <p className="text-sm text-amber-700">{w.description}</p>
                  </div>
                ))}
                
                {/* Best Study Time */}
                {aiInsights.best_study_time && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Best Study Time</span>
                    </div>
                    <p className="text-sm text-blue-700">{aiInsights.best_study_time.time}</p>
                  </div>
                )}
                
                {/* Tip */}
                {aiInsights.tip_of_the_day && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-800">Tip of the Day</span>
                    </div>
                    <p className="text-sm text-purple-700">{aiInsights.tip_of_the_day}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete more quizzes to get AI insights</p>
              </div>
            )}
          </div>

          {/* Recommended Tests */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Recommended for You
              </h3>
            </div>
            
            {recommendedTests.length > 0 ? (
              <div className="space-y-3">
                {recommendedTests.slice(0, 4).map((test, index) => (
                  <div 
                    key={index}
                    className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">{test.title}</h4>
                        <p className="text-sm text-gray-500">{test.description}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                        {test.match_percent}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{test.duration}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{test.questions} Q</span>
                        <span className={`px-2 py-1 rounded-full ${
                          test.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          test.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          test.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{test.difficulty}</span>
                      </div>
                      <button className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all">
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete quizzes to get personalized recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-gray-500 font-medium">Quiz Battles & Rooms</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* Existing Room Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.active}</span>
            </div>
            <div className="text-sm text-gray-600">Active Rooms</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.created}</span>
            </div>
            <div className="text-sm text-gray-600">Created by Me</div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-xs opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No rooms found</p>
                <p className="text-sm">Start creating or joining quiz battles!</p>
              </div>
            ) : (
              filteredRooms.map(room => {
                const isActive = new Date(room.expires_at) > new Date() && room.is_active;
                return (
                  <div
                    key={room.pin}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-2xl text-emerald-600">{room.pin}</span>
                          {isActive ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Completed</span>
                          )}
                        </div>
                        <div className="text-gray-700 font-semibold mb-1">{room.exam_category} - {room.subject}</div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.participant_count} / {room.max_participants} players
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {room.submission_count} submissions
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-4 h-4" />
                              {getTimeRemaining(room.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isActive && (
                          <button
                            onClick={() => rejoinRoom(room.pin)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Rejoin
                          </button>
                        )}
                        <button
                          onClick={() => viewRoomDetail(room.pin)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
