import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy, Clock, Users, Search, Play, CheckCircle,
  BookOpen, Calendar, ChevronRight, RefreshCw, BarChart3,
  Sparkles, Flame, Target,
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

/* ─────────────────────────────────────────────────────────────────
 * Defensive score clamp — any percent displayed is 0-100.
 * ───────────────────────────────────────────────────────────────── */
const clampPct = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(100, v);
};

/* ─────────────────────────────────────────────────────────────────
 * Refined card wrapper. Edge-to-edge on mobile, framed on desktop.
 * Softer shadows, cleaner border, no busy backdrop blur.
 * ───────────────────────────────────────────────────────────────── */
const Card = ({ children, className = '', innerClassName = '', ...props }) => (
  <section
    className={`relative w-full overflow-hidden bg-white border-y border-slate-100
                md:border md:border-slate-200/70 md:rounded-2xl
                md:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.06)]
                transition-shadow ${className}`}
    style={{ padding: 0 }}
    {...props}
  >
    <div className={`p-5 md:p-6 ${innerClassName}`}>
      {children}
    </div>
  </section>
);

/* Small pill for meta info (counts, statuses). */
const Pill = ({ children, tone = 'slate', className = '' }) => {
  const tones = {
    slate:  'bg-slate-100  text-slate-600',
    violet: 'bg-violet-50  text-violet-700',
    emerald:'bg-emerald-50 text-emerald-700',
    amber:  'bg-amber-50   text-amber-700',
    rose:   'bg-rose-50    text-rose-700',
    sky:    'bg-sky-50     text-sky-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
};

const Board = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);

  const [userGoal, setUserGoal] = useState(null);
  const [goalInfo, setGoalInfo] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    tests_completed: 0, avg_score: 0, streak: 0, study_hours: 0,
    weekly_activity: [], next_milestone: 7, days_to_milestone: 7,
    next_reward: 'Study Planner', next_reward_wingman: 1,
    current_wingman: 1, milestone_tiers: [],
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
    } catch (error) { console.error('Error fetching user goal:', error); }
  };

  const handleSelectGoal = async (goalType, goalCategory) => {
    if (!user) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/api/dashboard/set-goal/${user.id}`, {
        goal_type: goalType, goal_category: goalCategory,
      });
      if (res.data.success) {
        setGoalInfo(res.data.goal_info);
        setUserGoal({ goal_type: goalType, goal_category: goalCategory });
        setLoadingDashboard(true); setLoadingSchedule(true); setLoadingInsights(true);
        setWeeklySchedule([]); setAiInsights(null); setRecommendedTests([]); setSubjectMastery([]);
        try { await axios.post(`${BACKEND_URL}/api/dashboard/regenerate-schedule/${user.id}`); }
        catch (scheduleError) { console.error('Error regenerating schedule:', scheduleError); }
        fetchDashboardData(user.id);
      }
    } catch (error) { console.error('Error setting goal:', error); }
  };

  const fetchTestHistory = async (userId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/test-history/${userId}`);
      if (response.data.success) setTestHistory(response.data.history || []);
    } catch (error) { console.error('Error fetching test history:', error); }
    finally { setHistoryLoading(false); }
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
      if (scheduleRes.data.success) setWeeklySchedule(scheduleRes.data.schedule);
      setLoadingSchedule(false);

      const insightsRes = await axios.get(`${BACKEND_URL}/api/dashboard/insights/${userId}`);
      if (insightsRes.data.success) setAiInsights(insightsRes.data.insights);
      setLoadingInsights(false);

      const testsRes = await axios.get(`${BACKEND_URL}/api/dashboard/recommended-tests/${userId}`);
      if (testsRes.data.success) setRecommendedTests(testsRes.data.tests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadingDashboard(false); setLoadingSchedule(false); setLoadingInsights(false);
    }
  };

  const regenerateSchedule = async () => {
    if (!user) return;
    setLoadingSchedule(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/dashboard/regenerate-schedule/${user.id}`);
      if (res.data.success) setWeeklySchedule(res.data.schedule);
    } catch (error) { console.error('Error regenerating schedule:', error); }
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
    } catch (error) { console.error('Failed to fetch rooms:', error); setLoading(false); }
  };

  const filterRooms = () => {
    let filtered = rooms;
    const userStr = localStorage.getItem('ceibaa_user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const now = new Date();
    if (activeTab === 'active')    filtered = filtered.filter(r => new Date(r.expires_at) > now && r.is_active);
    else if (activeTab === 'completed') filtered = filtered.filter(r => new Date(r.expires_at) <= now || !r.is_active);
    else if (activeTab === 'created')   filtered = filtered.filter(r => userObj && r.host_id === userObj.id);
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
    return `${hours}h ${minutes}m`;
  };

  const rejoinRoom = (pin) => {
    const userObj = JSON.parse(localStorage.getItem('ceibaa_user'));
    navigate(`/live-battle/${pin}`, { state: { autoJoin: true, playerName: userObj.name } });
  };
  const viewRoomDetail = (pin) => navigate(`/room/${pin}`);

  const tabs = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'created', label: 'Created', count: stats.created },
  ];

  const getTodaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return weeklySchedule.find(d => d.day === today) || weeklySchedule[0];
  };

  const startRecommendedTest = (test) => {
    if (test.exam_type === 'competitive') {
      const examMap = { 'jee':'JEE','neet':'NEET','upsc':'UPSC','defence':'NDA','banking':'SSC','gate':'GATE','cat':'CAT' };
      const examName = examMap[test.exam_category] || 'JEE';
      navigate(`/exam/${examName}`, { state: { highlightSubject: test.subject } });
    } else if (test.exam_type === 'cbse') {
      const classMatch = test.exam_category?.match(/class_(\d+)/);
      const classNum = classMatch ? classMatch[1] : '10';
      const subjectSlug = test.subject.toLowerCase()
        .replace(/ - /g, '---').replace(/: /g, ':').replace(/\s+/g, '-');
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
    if (authUser) { setUser(authUser); }
    else {
      const userStr = localStorage.getItem('ceibaa_user');
      if (!userStr) { alert('Please login to view your Board'); navigate('/login'); return; }
      setUser(JSON.parse(userStr));
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchUserGoal(user.id); fetchRooms();
      fetchDashboardData(user.id); fetchTestHistory(user.id);
    }
    // eslint-disable-next-line
  }, [user?.id]);

  useEffect(() => { filterRooms(); /* eslint-disable-next-line */ }, [activeTab, searchQuery, rooms]);

  const isLoggedIn = !!user;

  if (loading || loadingDashboard) {
    return <BoardSkeleton isLoggedIn={!!user} user={user} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Subtle top gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-violet-50/60 via-white/40 to-transparent" />

      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={() => { localStorage.removeItem('ceibaa_user'); navigate('/login'); }}
      />

      <GoalSelectionModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSelectGoal={handleSelectGoal}
        currentGoal={userGoal}
      />

      {/* 1. Profile hero */}
      <BoardFigmaHero
        user={user}
        stats={{ ...dashboardStats, avg_score: clampPct(dashboardStats.avg_score) }}
        learnerLevel={learnerLevel}
        subjectMastery={(subjectMastery || []).map(s => ({
          ...s, mastery: clampPct(s.mastery), accuracy: clampPct(s.accuracy),
        }))}
        roomsCreated={stats.created}
        goalInfo={goalInfo}
        onChangeGoal={() => setShowGoalModal(true)}
      />

      <ParentsModePanel />

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

      {/* Main content */}
      <div className="relative z-10 space-y-6 md:space-y-8 py-6 md:py-10 md:mx-auto md:max-w-6xl md:px-6">

        {/* Subject Mastery + Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* ── Subject Mastery ── */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium mb-1">Progress</p>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-violet-500" />
                  Subject Mastery
                </h3>
              </div>
              {subjectMastery.length > 0 && (
                <Pill tone="violet">{subjectMastery.length} subjects</Pill>
              )}
            </div>

            {subjectMastery.length > 0 ? (
              <div className="space-y-5">
                {subjectMastery.map((subject, index) => (
                  <div key={subject.subject || `subj-${index}`} className="group">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-medium text-slate-800 text-sm">{subject.subject}</span>
                      <span className="text-slate-900 text-sm font-semibold tabular-nums">
                        {subject.mastery}<span className="text-slate-400 text-xs font-normal">%</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${subject.gradient || 'from-violet-500 to-pink-500'} rounded-full transition-[width] duration-1000 ease-out`}
                        style={{ width: `${subject.mastery}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">{subject.tests_taken} tests completed</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<BookOpen className="w-8 h-8" />} label="Complete quizzes to see subject mastery" />
            )}
          </Card>

          {/* ── Today's Schedule ── */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium mb-1">Today</p>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-violet-500" />
                  Study Schedule
                </h3>
              </div>
              <button
                onClick={regenerateSchedule}
                disabled={loadingSchedule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
                title="Regenerate Schedule"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSchedule ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingSchedule ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-violet-500" />
              </div>
            ) : getTodaySchedule()?.sessions?.length > 0 ? (
              <ul className="space-y-2.5">
                {getTodaySchedule().sessions.slice(0, 4).map((session, index) => {
                  const typeColor = {
                    study: 'bg-emerald-500', practice: 'bg-sky-500',
                    review: 'bg-violet-500', default: 'bg-amber-500',
                  }[session.type] || 'bg-amber-500';
                  const priTone = session.priority === 'high' ? 'rose'
                    : session.priority === 'medium' ? 'amber' : 'slate';
                  return (
                    <li
                      key={`${session.time || ''}-${session.topic || index}`}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/40 transition cursor-pointer group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${typeColor} flex items-center justify-center text-white text-[10px] font-semibold tracking-wider shrink-0`}>
                        {session.subject?.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate">{session.topic}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{session.time} · {session.duration} mins</div>
                      </div>
                      <Pill tone={priTone} className="capitalize">{session.priority}</Pill>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-transform" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<Calendar className="w-8 h-8" />} label="No schedule generated yet" />
            )}
          </Card>
        </div>

        {/* AI Insights */}
        <BoardInsights
          loadingInsights={loadingInsights}
          aiInsights={aiInsights}
          recommendedTests={recommendedTests}
          onStartRecommendedTest={startRecommendedTest}
        />

        {/* Test Performance History */}
        <div className="space-y-4">
          <SectionHeader eyebrow="Analytics" title="Test Performance History" icon={<BarChart3 className="w-4 h-4" />} />
          <Card data-testid="board-test-history-section">
            <TestHistoryTable data={testHistory} loading={historyLoading} />
          </Card>
        </div>

        {/* Quiz Battles & Rooms */}
        <div className="space-y-4">
          <SectionHeader eyebrow="Compete" title="Quiz Battles & Rooms" icon={<Trophy className="w-4 h-4" />} />

          {/* Room stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Rooms',    value: stats.total,     icon: <Trophy className="w-4 h-4" />,       tone: 'amber' },
              { label: 'Active',         value: stats.active,    icon: <Play className="w-4 h-4" />,          tone: 'emerald' },
              { label: 'Completed',      value: stats.completed, icon: <CheckCircle className="w-4 h-4" />,   tone: 'sky' },
              { label: 'Created by Me',  value: stats.created,   icon: <Users className="w-4 h-4" />,         tone: 'violet' },
            ].map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Rooms List */}
          <Card>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
              {/* Segmented tabs */}
              <div className="inline-flex bg-slate-100/70 rounded-xl p-1 gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold ${
                      activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search PIN, host or exam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No battle rooms yet</p>
                  <p className="text-xs text-slate-500 mt-1">Start creating or joining quiz battles to see them here.</p>
                </div>
              ) : (
                filteredRooms.map(room => {
                  const isActive = new Date(room.expires_at) > new Date() && room.is_active;
                  return (
                    <div
                      key={room.pin}
                      className="group flex flex-col md:flex-row gap-3 md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xl font-bold text-slate-900 tracking-widest select-all">
                            {room.pin}
                          </span>
                          {isActive
                            ? <Pill tone="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</Pill>
                            : <Pill tone="slate">Completed</Pill>}
                        </div>
                        <div className="text-slate-800 text-sm font-medium mb-1.5 truncate">
                          {room.exam_category} · {room.subject}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" />{room.participant_count} / {room.max_participants}</span>
                          <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5 text-slate-400" />{room.submission_count} submissions</span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <Clock className="w-3.5 h-3.5" />{getTimeRemaining(room.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        {isActive && (
                          <button
                            onClick={() => rejoinRoom(room.pin)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" strokeWidth={2.5} />
                            Rejoin
                          </button>
                        )}
                        <button
                          onClick={() => viewRoomDetail(room.pin)}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* Compact empty state */
const EmptyState = ({ icon, label }) => (
  <div className="text-center py-10">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
      {icon}
    </div>
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);

/* Modern section header with eyebrow + rule */
const SectionHeader = ({ eyebrow, title, icon }) => (
  <div className="flex items-end gap-3 px-4 md:px-0">
    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm text-violet-600 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium">{eyebrow}</p>}
      <h2 className="text-base md:text-lg font-semibold text-slate-900 leading-tight">{title}</h2>
    </div>
  </div>
);

/* Modern stat card — no rainbow, uses tone system */
const StatCard = ({ label, value, icon, tone = 'slate' }) => {
  const tones = {
    amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600'   },
    emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    sky:     { bg: 'bg-sky-50',     fg: 'text-sky-600'     },
    violet:  { bg: 'bg-violet-50',  fg: 'text-violet-600'  },
    slate:   { bg: 'bg-slate-100',  fg: 'text-slate-600'   },
  }[tone];
  return (
    <div className="bg-white border border-slate-200/70 md:rounded-2xl p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_-14px_rgba(15,23,42,0.1)] transition rounded-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-8 h-8 rounded-lg ${tones.bg} ${tones.fg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums leading-none">{value}</span>
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
};

export default Board;

/* ─────────────────────────────────────────────────────────────────
 * BoardSkeleton — mirrors the real Board layout so the loading state
 * feels like a soft placeholder of what's coming, not a spinner.
 * Uses only `animate-pulse` + slate-200 blocks (no custom keyframes).
 * ───────────────────────────────────────────────────────────────── */
const Sk = ({ className = '', rounded = 'rounded-md' }) => (
  <div className={`bg-slate-200/70 ${rounded} ${className}`} />
);

const BoardSkeleton = ({ isLoggedIn, user, navigate }) => (
  <div className="min-h-screen bg-slate-50 overflow-x-hidden animate-pulse">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-violet-50/60 via-white/40 to-transparent" />

    <Header
      isLoggedIn={isLoggedIn}
      user={user}
      onLogout={() => { localStorage.removeItem('ceibaa_user'); navigate('/login'); }}
    />

    {/* 1. Profile hero skeleton */}
    <section className="relative mb-4 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white border-y border-slate-200/70 md:border md:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_20px_50px_-24px_rgba(15,23,42,0.12)]">
      {/* violet banner shell */}
      <div className="relative h-40 md:h-44 bg-[#5b3fda]/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_-20%,_rgba(255,255,255,0.35)_0%,_transparent_55%)] pointer-events-none" />
        <div className="absolute top-5 left-5 w-9 h-9 rounded-lg bg-white/20" />
        <div className="absolute top-5 right-5 w-9 h-9 rounded-lg bg-white/20" />
        <div className="absolute bottom-4 left-5 right-5 h-14 rounded-xl bg-white/15" />
      </div>

      <div className="relative flex flex-col items-center px-4 pb-6 md:px-6 md:pb-8 -mt-14">
        {/* avatar */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-white shadow-lg" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-white bg-slate-200" />
        </div>

        {/* name + level pill */}
        <Sk className="w-40 h-6 mt-4" rounded="rounded-lg" />
        <Sk className="w-24 h-6 mt-2" rounded="rounded-full" />

        {/* stats widget */}
        <div className="w-full max-w-lg mt-5 md:mt-6 border border-slate-200/70 rounded-2xl bg-white grid grid-cols-3 divide-x divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-4 px-3 flex flex-col items-center">
              <Sk className="w-5 h-5 mb-2" rounded="rounded" />
              <Sk className="w-14 h-5" rounded="rounded" />
              <Sk className="w-16 h-2.5 mt-2" rounded="rounded-full" />
            </div>
          ))}
        </div>

        {/* segmented tabs */}
        <div className="mt-6 md:mt-8 inline-flex bg-slate-100/70 rounded-xl p-1 gap-1">
          <Sk className="w-16 h-7" rounded="rounded-lg" />
          <Sk className="w-14 h-7 opacity-60" rounded="rounded-lg" />
          <Sk className="w-16 h-7 opacity-60" rounded="rounded-lg" />
        </div>

        {/* badges grid */}
        <div className="w-full max-w-3xl mt-6 grid grid-cols-3 gap-y-6 gap-x-4 py-2 place-items-center">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Sk className="w-16 h-16 md:w-[68px] md:h-[68px]" rounded="rounded-2xl" />
              <Sk className="w-20 h-3 mt-3" rounded="rounded-full" />
              <Sk className="w-12 h-2.5 mt-1.5" rounded="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* 2. Parents-mode bar skeleton */}
    <section className="relative bg-white border-y border-slate-200/70 md:border md:rounded-3xl md:mx-auto md:max-w-6xl md:mb-8 px-4 md:px-6 py-4 flex items-center gap-4">
      <Sk className="w-9 h-9" rounded="rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Sk className="w-32 h-3.5" rounded="rounded" />
        <Sk className="w-56 h-2.5" rounded="rounded" />
      </div>
      <Sk className="w-32 h-9" rounded="rounded-lg" />
    </section>

    {/* 3. Streak hero skeleton */}
    <section className="relative mb-0 md:mb-8 rounded-none md:rounded-3xl overflow-hidden bg-white border-y border-slate-200/70 md:border md:shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 flex items-start gap-4 md:gap-8">
        <div className="flex-1 min-w-0 space-y-3">
          <Sk className="w-10 h-10" rounded="rounded-xl" />
          <Sk className="w-24 h-2.5" rounded="rounded" />
          <Sk className="w-52 h-9" rounded="rounded-lg" />
          <Sk className="w-72 h-3" rounded="rounded" />
        </div>
        <Sk className="shrink-0 w-20 h-20 md:w-28 md:h-28" rounded="rounded-2xl" />
      </div>

      {/* 7-day strip */}
      <div className="px-6 md:px-8 pb-5">
        <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-3 md:px-5 py-4">
          <div className="grid grid-cols-7 gap-1.5 md:gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Sk className="w-5 h-2.5" rounded="rounded" />
                <Sk className="w-9 h-9 md:w-11 md:h-11" rounded="rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* next reward banner */}
      <div className="px-6 md:px-8 py-4 bg-emerald-50/40 border-t border-emerald-100/40 flex items-center gap-4">
        <Sk className="w-11 h-11 md:w-12 md:h-12" rounded="rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Sk className="w-20 h-2.5" rounded="rounded" />
          <Sk className="w-52 h-3.5" rounded="rounded" />
        </div>
        <Sk className="w-9 h-9" rounded="rounded-lg" />
      </div>

      {/* milestone ladder */}
      <div className="px-6 md:px-8 py-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <Sk className="w-24 h-2.5" rounded="rounded" />
            <Sk className="w-28 h-3.5" rounded="rounded" />
          </div>
          <Sk className="w-24 h-6" rounded="rounded-full" />
        </div>
        <div className="flex gap-3 overflow-hidden pb-2 -mx-1 px-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[125px] md:w-[145px] rounded-2xl p-3 bg-slate-50/60 border border-slate-200/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Sk className="w-8 h-4" rounded="rounded-full" />
                <Sk className="w-3.5 h-3.5" rounded="rounded" />
              </div>
              <Sk className="w-14 h-14 mx-auto" rounded="rounded" />
              <Sk className="w-full h-3 mt-2" rounded="rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* 4. Main content skeleton */}
    <div className="relative z-10 space-y-6 md:space-y-8 py-6 md:py-10 md:mx-auto md:max-w-6xl md:px-6">
      {/* two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SkCard>
          <div className="mb-5 space-y-2">
            <Sk className="w-16 h-2.5" rounded="rounded" />
            <Sk className="w-40 h-5" rounded="rounded" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-4 last:mb-0 space-y-2">
              <div className="flex justify-between">
                <Sk className="w-24 h-3" rounded="rounded" />
                <Sk className="w-10 h-3" rounded="rounded" />
              </div>
              <Sk className="w-full h-2" rounded="rounded-full" />
              <Sk className="w-16 h-2.5" rounded="rounded" />
            </div>
          ))}
        </SkCard>

        <SkCard>
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-2">
              <Sk className="w-10 h-2.5" rounded="rounded" />
              <Sk className="w-36 h-5" rounded="rounded" />
            </div>
            <Sk className="w-20 h-8" rounded="rounded-lg" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0 p-3 rounded-xl border border-slate-100">
              <Sk className="w-10 h-10" rounded="rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Sk className="w-32 h-3" rounded="rounded" />
                <Sk className="w-20 h-2.5" rounded="rounded" />
              </div>
              <Sk className="w-14 h-5" rounded="rounded-full" />
            </div>
          ))}
        </SkCard>
      </div>

      {/* AI insights + recommended */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SkCard>
          <div className="mb-4 space-y-2">
            <Sk className="w-24 h-2.5" rounded="rounded" />
            <Sk className="w-40 h-5" rounded="rounded" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-3 last:mb-0 p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1.5">
              <Sk className="w-24 h-2.5" rounded="rounded" />
              <Sk className="w-full h-3" rounded="rounded" />
            </div>
          ))}
        </SkCard>
        <SkCard>
          <div className="mb-4 space-y-2">
            <Sk className="w-24 h-2.5" rounded="rounded" />
            <Sk className="w-44 h-5" rounded="rounded" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="mb-4 last:mb-0 space-y-2">
              <div className="flex items-center justify-between">
                <Sk className="w-32 h-4" rounded="rounded" />
                <Sk className="w-12 h-5" rounded="rounded-full" />
              </div>
              <Sk className="w-56 h-3" rounded="rounded" />
              <div className="flex gap-2 mt-1.5">
                <Sk className="w-16 h-6" rounded="rounded-md" />
                <Sk className="w-12 h-6" rounded="rounded-md" />
                <Sk className="w-14 h-6" rounded="rounded-md" />
                <Sk className="w-16 h-6 ml-auto" rounded="rounded-md" />
              </div>
            </div>
          ))}
        </SkCard>
      </div>

      {/* Test history */}
      <div className="space-y-4">
        <div className="flex items-end gap-3 px-4 md:px-0">
          <Sk className="w-9 h-9" rounded="rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Sk className="w-20 h-2.5" rounded="rounded" />
            <Sk className="w-56 h-4" rounded="rounded" />
          </div>
        </div>
        <SkCard>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-3 py-3 border-b border-slate-100 last:border-b-0">
              <Sk className="col-span-2 h-3" rounded="rounded" />
              <Sk className="h-3" rounded="rounded" />
              <Sk className="h-3" rounded="rounded" />
            </div>
          ))}
        </SkCard>
      </div>

      {/* Rooms stats */}
      <div className="space-y-4">
        <div className="flex items-end gap-3 px-4 md:px-0">
          <Sk className="w-9 h-9" rounded="rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Sk className="w-16 h-2.5" rounded="rounded" />
            <Sk className="w-52 h-4" rounded="rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-2.5">
                <Sk className="w-8 h-8" rounded="rounded-lg" />
                <Sk className="w-10 h-7" rounded="rounded" />
              </div>
              <Sk className="w-20 h-3" rounded="rounded" />
            </div>
          ))}
        </div>

        <SkCard>
          {/* tabs + search row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div className="inline-flex bg-slate-100/70 rounded-xl p-1 gap-1">
              <Sk className="w-14 h-7" rounded="rounded-lg" />
              <Sk className="w-16 h-7 opacity-60" rounded="rounded-lg" />
              <Sk className="w-20 h-7 opacity-60" rounded="rounded-lg" />
              <Sk className="w-16 h-7 opacity-60" rounded="rounded-lg" />
            </div>
            <Sk className="w-full md:w-64 h-9" rounded="rounded-lg" />
          </div>
          {/* rows */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 mb-3 last:mb-0 rounded-xl border border-slate-100">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Sk className="w-24 h-6" rounded="rounded" />
                  <Sk className="w-16 h-5" rounded="rounded-full" />
                </div>
                <Sk className="w-56 h-3" rounded="rounded" />
                <div className="flex gap-4">
                  <Sk className="w-16 h-2.5" rounded="rounded" />
                  <Sk className="w-20 h-2.5" rounded="rounded" />
                  <Sk className="w-14 h-2.5" rounded="rounded" />
                </div>
              </div>
              <Sk className="w-20 h-9" rounded="rounded-lg" />
            </div>
          ))}
        </SkCard>
      </div>
    </div>

    <Footer />
  </div>
);

const SkCard = ({ children }) => (
  <section className="relative w-full overflow-hidden bg-white border-y border-slate-100 md:border md:border-slate-200/70 md:rounded-2xl md:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.06)] p-5 md:p-6">
    {children}
  </section>
);
