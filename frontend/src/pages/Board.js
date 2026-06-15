import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Clock, Users, Search, Play, CheckCircle,
  Target, BookOpen, TrendingUp, Calendar,
  ChevronRight, RefreshCw,
  X, Settings, BarChart3, GraduationCap, School
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TestHistoryTable from '../components/TestHistoryTable';
import { GoalSelectionModal } from '../components/GoalSelectionModal';
import { ParentsModePanel } from '../components/ParentsModePanel';
import BoardInsights from '../components/board/BoardInsights';
import BoardFigmaHero from '../components/board/BoardFigmaHero';
import BoardStreakHero from '../components/board/BoardStreakHero';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

// Learner level colors
const LEVEL_COLORS = {
  'Beginner': 'from-gray-400 to-gray-500',
  'Learner': 'from-green-400 to-green-500',
  'Intermediate': 'from-blue-400 to-blue-500',
  'Advanced': 'from-purple-400 to-purple-500',
  'Expert': 'from-orange-400 to-orange-500',
  'Master': 'from-yellow-400 to-yellow-500'
};

// GoalSelectionModal extracted to /components/GoalSelectionModal.js

const Board = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  
  // Goal state
  const [userGoal, setUserGoal] = useState(null);
  const [goalInfo, setGoalInfo] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    tests_completed: 0,
    avg_score: 0,
    streak: 0,
    study_hours: 0,
    weekly_activity: [],
    next_milestone: 7,
    days_to_milestone: 7,
    next_reward: 'Study Planner',
    next_reward_wingman: 1,
    current_wingman: 1,
    milestone_tiers: [],
  });
  const [subjectMastery, setSubjectMastery] = useState([]);
  const [learnerLevel, setLearnerLevel] = useState('Beginner');
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [recommendedTests, setRecommendedTests] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  // Test History state
  const [testHistory, setTestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Existing room state
  const [activeTab, setActiveTab] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, created: 0 });

  // Fetch user goal
  const fetchUserGoal = async (userId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/dashboard/user-goal/${userId}`);
      if (res.data.success) {
        if (res.data.has_goal) {
          setUserGoal(res.data.goal);
          setGoalInfo(res.data.goal_info);
        } else {
          // Show goal selection modal for new users
          setShowGoalModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching user goal:', error);
    }
  };

  const handleSelectGoal = async (goalType, goalCategory) => {
    if (!user) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/api/dashboard/set-goal/${user.id}`, {
        goal_type: goalType,
        goal_category: goalCategory
      });
      if (res.data.success) {
        setGoalInfo(res.data.goal_info);
        setUserGoal({ goal_type: goalType, goal_category: goalCategory });
        
        // Set ALL loading states to show refresh is happening
        setLoadingDashboard(true);
        setLoadingSchedule(true);
        setLoadingInsights(true);
        
        // Clear existing data to show fresh content
        setWeeklySchedule([]);
        setAiInsights(null);
        setRecommendedTests([]);
        setSubjectMastery([]);
        
        // Force regenerate schedule for new goal and refresh all dashboard data
        try {
          await axios.post(`${BACKEND_URL}/api/dashboard/regenerate-schedule/${user.id}`);
        } catch (scheduleError) {
          console.error('Error regenerating schedule:', scheduleError);
        }
        
        // Fetch all fresh data for new goal
        fetchDashboardData(user.id);
      }
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  };

  // Fetch test history
  const fetchTestHistory = async (userId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/test-history/${userId}`);
      if (response.data.success) {
        setTestHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching test history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const startRecommendedTest = (test) => {
    // Navigate based on goal type
    if (test.exam_type === 'competitive') {
      // For competitive exams, navigate to exam selection page
      const examMap = {
        'jee': 'JEE',
        'neet': 'NEET',
        'upsc': 'UPSC',
        'defence': 'NDA',
        'banking': 'SSC',
        'gate': 'GATE',
        'cat': 'CAT'
      };
      const examName = examMap[test.exam_category] || 'JEE';
      // Navigate to exam page where user can select topic
      navigate(`/exam/${examName}`, {
        state: {
          highlightSubject: test.subject
        }
      });
    } else if (test.exam_type === 'cbse') {
      // For CBSE classes, navigate to class subject page
      const classMatch = test.exam_category?.match(/class_(\d+)/);
      const classNum = classMatch ? classMatch[1] : '10';
      
      // Convert subject name to URL slug
      // "Mathematics - Ganita Prakash" -> "mathematics---ganita-prakash"
      // " - " (space-dash-space) becomes "---" (triple dash)
      // Regular spaces become "-" (single dash)
      const subjectSlug = test.subject
        .toLowerCase()
        .replace(/ - /g, '---')  // Space-dash-space becomes triple dash
        .replace(/: /g, ':')     // Keep colon but remove space after
        .replace(/\s+/g, '-');   // Regular spaces become dashes
      
      // Class 11 and 12 require stream in URL
      if (classNum === '11' || classNum === '12') {
        // Determine stream from goal_category (class_11_science, class_11_commerce, etc.)
        const streamMatch = test.exam_category?.match(/class_\d+_(\w+)/);
        const stream = streamMatch ? streamMatch[1] : 'science';
        navigate(`/chapter-tests/class-${classNum}/${stream}/${subjectSlug}`);
      } else {
        // Class 6-10 don't need stream
        navigate(`/chapter-tests/class-${classNum}/${subjectSlug}`);
      }
    } else {
      // Default: navigate to chapter tests
      navigate(`/chapter-tests`);
    }
  };

  // Sync user from AuthContext (updates when profile picture changes)
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      // Fallback to localStorage if authUser not available
      const userStr = localStorage.getItem('ceibaa_user');
      if (!userStr) {
        alert('Please login to view your Board');
        navigate('/login');
        return;
      }
      setUser(JSON.parse(userStr));
    }
  }, [authUser, navigate]);

  // Fetch dashboard data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserGoal(user.id);
      fetchRooms();
      fetchDashboardData(user.id);
      fetchTestHistory(user.id);
    }
  }, [user?.id]);

  // Filter rooms when filters change
  useEffect(() => {
    filterRooms();
  // eslint-disable-next-line
  }, [activeTab, searchQuery, rooms]);

  // Check if user is logged in for Header
  const isLoggedIn = !!user;

  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.08),_transparent_55%)]">
      {/* Header */}
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={() => {
          localStorage.removeItem('ceibaa_user');
          navigate('/login');
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Board</h1>
          <p className="text-slate-300/70">Track your progress and achieve your goals</p>
        </div>

        {/* Goal Selection Modal */}
        <GoalSelectionModal 
          isOpen={showGoalModal} 
          onClose={() => setShowGoalModal(false)}
          onSelectGoal={handleSelectGoal}
          currentGoal={userGoal}
        />

        {/* Parents Mode Panel — extracted component */}
        <ParentsModePanel />

        {/* Figma-inspired purple profile hero (replaces BoardProfileHeader + the 3-card stat grid) */}
        <BoardFigmaHero
          user={user}
          stats={dashboardStats}
          learnerLevel={learnerLevel}
          subjectMastery={subjectMastery}
          roomsCreated={stats.created}
          goalInfo={goalInfo}
          onChangeGoal={() => setShowGoalModal(true)}
        />

        {/* Figma-inspired streak hero with milestone rewards */}
        <BoardStreakHero
          streak={dashboardStats.streak}
          nextMilestone={dashboardStats.next_milestone}
          daysToMilestone={dashboardStats.days_to_milestone}
          weeklyActivity={dashboardStats.weekly_activity}
          nextReward={dashboardStats.next_reward}
          currentWingman={dashboardStats.current_wingman}
          nextRewardWingman={dashboardStats.next_reward_wingman}
          milestoneTiers={dashboardStats.milestone_tiers}
        />

        {/* Stats are now surfaced inside <BoardFigmaHero/> — no duplication here. */}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Mastery */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Subject Mastery
              </h3>
            </div>
            
            {subjectMastery.length > 0 ? (
              <div className="space-y-4">
                {subjectMastery.map((subject, index) => (
                  <div key={subject.subject || `subj-${index}`} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white/90">{subject.subject}</span>
                      <span className="font-bold text-emerald-400">{subject.mastery}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${subject.gradient} rounded-full transition-all duration-500 group-hover:shadow-lg`}
                        style={{ width: `${subject.mastery}%` }}
                      />
                    </div>
                    <div className="text-xs text-emerald-200/50 mt-1">{subject.tests_taken} tests taken</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-emerald-200/50">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete quizzes to see your subject mastery</p>
              </div>
            )}
          </div>

          {/* AI Weekly Schedule */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                {"Today's Schedule"}
              </h3>
              <button 
                onClick={regenerateSchedule}
                disabled={loadingSchedule}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate Schedule"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${loadingSchedule ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loadingSchedule ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
              </div>
            ) : getTodaySchedule()?.sessions?.length > 0 ? (
              <div className="space-y-3">
                {getTodaySchedule().sessions.slice(0, 4).map((session, index) => (
                  <div 
                    key={`${session.time || ''}-${session.topic || index}`} 
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group border border-white/10"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      session.type === 'study' ? 'bg-emerald-500/80' :
                      session.type === 'practice' ? 'bg-blue-500/80' :
                      session.type === 'review' ? 'bg-purple-500/80' : 'bg-orange-500/80'
                    }`}>
                      {session.subject?.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{session.topic}</div>
                      <div className="text-sm text-emerald-200/60">{session.time} • {session.duration} mins</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        session.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-white/10 text-white/70 border border-white/20'
                      }`}>
                        {session.priority}
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-emerald-200/50">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No schedule generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights & Recommended Tests */}
        <BoardInsights
          loadingInsights={loadingInsights}
          aiInsights={aiInsights}
          recommendedTests={recommendedTests}
          onStartRecommendedTest={startRecommendedTest}
        />

        {/* Divider - Test History */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
          <span className="text-violet-300/70 font-medium px-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Test Performance History
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        </div>

        {/* Test History Table */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 mb-8" data-testid="board-test-history-section">
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <TestHistoryTable data={testHistory} loading={historyLoading} />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
          <span className="text-emerald-300/70 font-medium px-4">Quiz Battles & Rooms</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        </div>

        {/* Existing Room Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold text-white">{stats.total}</span>
            </div>
            <div className="text-sm text-yellow-200/70">Total Rooms</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">{stats.active}</span>
            </div>
            <div className="text-sm text-green-200/70">Active Rooms</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.completed}</span>
            </div>
            <div className="text-sm text-blue-200/70">Completed</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">{stats.created}</span>
            </div>
            <div className="text-sm text-purple-200/70">Created by Me</div>
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Board;
