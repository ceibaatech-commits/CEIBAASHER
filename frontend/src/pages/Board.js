import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const BACKEND_URL = window.location.origin;

const Board = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  
  const [userGoal, setUserGoal] = useState(null);
  const [goalInfo, setGoalInfo] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
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
  
  const [testHistory, setTestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, created: 0 });
  const selectedBoard = new URLSearchParams(location.search).get('board') || 'cbse';
  const boardQuery = `?board=${selectedBoard}`;

  const fetchUserGoal = async (userId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/dashboard/user-goal/${userId}`);
      if (res.data.success) {
        if (res.data.has_goal) {
          setUserGoal(res.data.goal);
          setGoalInfo(res.data.goal_info);
        } else {
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
        
        setLoadingDashboard(true);
        setLoadingSchedule(true);
        setLoadingInsights(true);
        
        setWeeklySchedule([]);
        setAiInsights(null);
        setRecommendedTests([]);
        setSubjectMastery([]);
        
        try {
          await axios.post(`${BACKEND_URL}/api/dashboard/regenerate-schedule/${user.id}`);
        } catch (scheduleError) {
          console.error('Error regenerating schedule:', scheduleError);
        }
        
        fetchDashboardData(user.id);
      }
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  };

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
      const statsRes = await axios.get(`${BACKEND_URL}/api/dashboard/stats/${userId}`);
      if (statsRes.data.success) {
        setDashboardStats(statsRes.data.stats);
        setSubjectMastery(statsRes.data.subject_mastery);
        setLearnerLevel(statsRes.data.learner_level);
      }
      setLoadingDashboard(false);

      const scheduleRes = await axios.get(`${BACKEND_URL}/api/dashboard/schedule/${userId}`);
      if (scheduleRes.data.success) {
        setWeeklySchedule(scheduleRes.data.schedule);
      }
      setLoadingSchedule(false);

      const insightsRes = await axios.get(`${BACKEND_URL}/api/dashboard/insights/${userId}`);
      if (insightsRes.data.success) {
        setAiInsights(insightsRes.data.insights);
      }
      setLoadingInsights(false);

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
      const userObj = JSON.parse(userStr);
      
      const response = await axios.get(`${BACKEND_URL}/api/battle/async/user/${userObj.id}/rooms`);
      
      if (response.data.success) {
        const roomsData = response.data.rooms;
        setRooms(roomsData);
        
        const now = new Date();
        const active = roomsData.filter(r => new Date(r.expires_at) > now && r.is_active).length;
        const completed = roomsData.filter(r => new Date(r.expires_at) <= now || !r.is_active).length;
        const created = roomsData.filter(r => r.host_id === userObj.id).length;
        
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
    const userObj = userStr ? JSON.parse(userStr) : null;
    const now = new Date();

    if (activeTab === 'active') {
      filtered = filtered.filter(r => new Date(r.expires_at) > now && r.is_active);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(r => new Date(r.expires_at) <= now || !r.is_active);
    } else if (activeTab === 'created') {
      filtered = filtered.filter(r => userObj && r.host_id === userObj.id);
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
    const userObj = JSON.parse(localStorage.getItem('ceibaa_user'));
    navigate(`/live-battle/${pin}`, {
      state: {
        autoJoin: true,
        playerName: userObj.name
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
    { id: 'created', label: 'Created by Me', count: stats.created }
  ];

  const getTodaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return weeklySchedule.find(d => d.day === today) || weeklySchedule[0];
  };

  const startRecommendedTest = (test) => {
    if (test.exam_type === 'competitive') {
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
      navigate(`/exam/${examName}`, {
        state: {
          highlightSubject: test.subject
        }
      });
    } else if (test.exam_type === 'cbse') {
      const classMatch = test.exam_category?.match(/class_(\d+)/);
      const classNum = classMatch ? classMatch[1] : '10';
      
      const subjectSlug = test.subject
        .toLowerCase()
        .replace(/ - /g, '---')
        .replace(/: /g, ':')
        .replace(/\s+/g, '-');
      
      if (classNum === '11' || classNum === '12') {
        const streamMatch = test.exam_category?.match(/class_\d+_(\w+)/);
        const stream = streamMatch ? streamMatch[1] : 'science';
        navigate(`/chapter-tests/class-${classNum}/${stream}/${subjectSlug}${boardQuery}`);
      } else {
        navigate(`/chapter-tests/class-${classNum}/${subjectSlug}${boardQuery}`);
      }
    } else {
      navigate(`/chapter-tests${boardQuery}`);
    }
  };

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      const userStr = localStorage.getItem('ceibaa_user');
      if (!userStr) {
        alert('Please login to view your Board');
        navigate('/login');
        return;
      }
      setUser(JSON.parse(userStr));
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchUserGoal(user.id);
      fetchRooms();
      fetchDashboardData(user.id);
      fetchTestHistory(user.id);
    }
  // eslint-disable-next-line
  }, [user?.id]);

  useEffect(() => {
    filterRooms();
  // eslint-disable-next-line
  }, [activeTab, searchQuery, rooms]);

  const isLoggedIn = !!user;

  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-100 border-b-violet-500"></div>
          <div className="absolute w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">🎓</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-[#f7f5ff] to-[#f0f4ff]">
      {/* Dynamic light gradient nodes */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#e3ddff]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-100px] w-96 h-96 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] left-[-150px] w-[500px] h-[500px] rounded-full bg-violet-400/5 blur-3xl pointer-events-none" />

      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={() => {
          localStorage.removeItem('ceibaa_user');
          navigate('/login');
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        <GoalSelectionModal 
          isOpen={showGoalModal} 
          onClose={() => setShowGoalModal(false)}
          onSelectGoal={handleSelectGoal}
          currentGoal={userGoal}
        />

        {/* 1. Premium profile hero */}
        <BoardFigmaHero
          user={user}
          stats={dashboardStats}
          learnerLevel={learnerLevel}
          subjectMastery={subjectMastery}
          roomsCreated={stats.created}
          goalInfo={goalInfo}
          onChangeGoal={() => setShowGoalModal(true)}
        />

        {/* 2. Parents Mode Panel */}
        <ParentsModePanel />

        {/* 3. Streak hero */}
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

        {/* 4. Subject Mastery + Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mb-8">
          {/* Subject Mastery */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(124,92,255,0.04)] border border-white/60 hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7c5cff] flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                Subject Mastery
              </h3>
            </div>

            {subjectMastery.length > 0 ? (
              <div className="space-y-5">
                {subjectMastery.map((subject, index) => (
                  <div key={subject.subject || `subj-${index}`} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-extrabold text-slate-800 text-sm">{subject.subject}</span>
                      <span className="font-black text-[#7c5cff] text-sm">{subject.mastery}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                      <div
                        className={`h-full bg-gradient-to-r ${subject.gradient || 'from-[#7c5cff] to-[#ec4899]'} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${subject.mastery}%` }}
                      />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">{subject.tests_taken} tests completed</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Complete quizzes to see subject mastery</p>
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(124,92,255,0.04)] border border-white/60 hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7c5cff] flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                Today's Schedule
              </h3>
              <button
                onClick={regenerateSchedule}
                disabled={loadingSchedule}
                className="p-2 hover:bg-slate-100/60 rounded-xl transition-all disabled:opacity-50 active:scale-90 border border-slate-200/20"
                title="Regenerate Schedule"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loadingSchedule ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSchedule ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-100 border-b-[#7c5cff]"></div>
              </div>
            ) : getTodaySchedule()?.sessions?.length > 0 ? (
              <div className="space-y-3.5">
                {getTodaySchedule().sessions.slice(0, 4).map((session, index) => (
                  <div
                    key={`${session.time || ''}-${session.topic || index}`}
                    className="flex items-center gap-4 p-3.5 bg-slate-50/50 hover:bg-violet-50/30 border border-slate-100 hover:border-violet-200/50 rounded-2xl transition-all cursor-pointer group hover:-translate-y-0.5"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md ${
                      session.type === 'study' ? 'bg-emerald-500 shadow-emerald-500/10' :
                      session.type === 'practice' ? 'bg-sky-500 shadow-sky-500/10' :
                      session.type === 'review' ? 'bg-[#7c5cff] shadow-violet-500/10' : 'bg-amber-500 shadow-amber-500/10'
                    }`}>
                      {session.subject?.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 text-sm truncate">{session.topic}</div>
                      <div className="text-xs text-slate-400 font-bold mt-0.5">{session.time} • {session.duration} mins</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0 ${
                      session.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100/50' :
                      session.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {session.priority}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#7c5cff] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No schedule generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. AI Insights & Recommended Tests */}
        <BoardInsights
          loadingInsights={loadingInsights}
          aiInsights={aiInsights}
          recommendedTests={recommendedTests}
          onStartRecommendedTest={startRecommendedTest}
        />

        {/* 6. Test Performance History */}
        <SectionHeader icon={<BarChart3 className="w-4 h-4" />} label="Test Performance History" />
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-[0_20px_50px_rgba(124,92,255,0.04)] border border-white/60 hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)] transition-all mb-8" data-testid="board-test-history-section">
          <TestHistoryTable data={testHistory} loading={historyLoading} />
        </div>

        {/* 7. Quiz Battles & Rooms */}
        <SectionHeader icon={<Trophy className="w-4 h-4" />} label="Quiz Battles & Rooms" />

        {/* Room stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Rooms', value: stats.total, icon: <Trophy className="w-5 h-5 text-amber-500" />, accent: 'bg-amber-50/50 border-amber-100/40 text-amber-500' },
            { label: 'Active Rooms', value: stats.active, icon: <Play className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />, accent: 'bg-emerald-50/50 border-emerald-100/40 text-emerald-500' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle className="w-5 h-5 text-sky-500" />, accent: 'bg-sky-50/50 border-sky-100/40 text-sky-500' },
            { label: 'Created by Me', value: stats.created, icon: <Users className="w-5 h-5 text-[#7c5cff]" />, accent: 'bg-[#f4f0ff]/50 border-violet-100/40 text-[#7c5cff]' },
          ].map((c) => (
            <div key={c.label} className="bg-white/75 backdrop-blur-md rounded-2xl p-4.5 border border-white/60 shadow-[0_12px_30px_-10px_rgba(124,92,255,0.05)] hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${c.accent.split(' ')[0]} ${c.accent.split(' ')[1]} flex items-center justify-center border`}>
                  {c.icon}
                </div>
                <span className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{c.value}</span>
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Rooms List */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(124,92,255,0.04)] border border-white/60 hover:shadow-[0_30px_70px_rgba(124,92,255,0.08)] transition-all">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
            <div className="flex flex-wrap gap-2.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    activeTab === tab.id
                      ? 'bg-[#7c5cff] text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] font-bold opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by PIN or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#7c5cff] focus:ring-4 focus:ring-violet-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-base font-extrabold text-slate-700">No battle rooms found</p>
                <p className="text-sm text-slate-400 mt-1">Start creating or joining quiz battles!</p>
              </div>
            ) : (
              filteredRooms.map(room => {
                const isActive = new Date(room.expires_at) > new Date() && room.is_active;
                return (
                  <div
                    key={room.pin}
                    className="bg-white/50 hover:bg-violet-50/20 border border-slate-100 hover:border-violet-200/50 rounded-2xl p-4 md:p-5 transition-all shadow-[0_8px_20px_-8px_rgba(124,92,255,0.03)] hover:shadow-[0_12px_24px_-8px_rgba(124,92,255,0.06)] hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="font-mono font-black text-2xl text-[#7c5cff] select-all tracking-wider">{room.pin}</span>
                          {isActive ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-full text-[9px] font-extrabold uppercase tracking-wider">Active</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-extrabold uppercase tracking-wider">Completed</span>
                          )}
                        </div>
                        <div className="text-slate-800 font-extrabold text-sm mb-1.5 truncate">{room.exam_category} · {room.subject}</div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Users className="w-4 h-4 text-slate-400" />
                            {room.participant_count} / {room.max_participants}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Trophy className="w-4 h-4 text-slate-400" />
                            {room.submission_count} submissions
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1.5 text-amber-600 font-black normal-case">
                              <Clock className="w-4 h-4 text-amber-500" />
                              {getTimeRemaining(room.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2.5 w-full md:w-auto mt-2 md:mt-0">
                        {isActive && (
                          <button
                            onClick={() => rejoinRoom(room.pin)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-4 h-4 fill-white/10" strokeWidth={2.5} />
                            Rejoin
                          </button>
                        )}
                        <button
                          onClick={() => viewRoomDetail(room.pin)}
                          className="flex-1 md:flex-none px-4 py-2.5 bg-[#7c5cff] hover:bg-[#6a4ce4] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-violet-500/10 transition-all"
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
      
      <Footer />
    </div>
  );
};

const SectionHeader = ({ icon, label }) => (
  <div className="flex items-center gap-3.5 mb-5 mt-6">
    <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7c5cff] flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <h2 className="text-base md:text-lg font-black text-slate-900">{label}</h2>
    <div className="flex-1 h-0.5 bg-gradient-to-r from-violet-100 to-transparent" />
  </div>
);

export default Board;
