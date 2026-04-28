import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('ceibaa_admin_token');

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export function useLiveBattles() {
  const [liveBattles, setLiveBattles] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page] = useState(1);

  const filteredReports = useMemo(
    () => reports.filter(r => filterStatus === 'all' || r.status === filterStatus),
    [reports, filterStatus]
  );

  // ---- Fetchers ----
  const fetchLiveBattles = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/battles/live`, { headers: authHeader() });
      if (res.data.success) setLiveBattles(res.data.live_battles || []);
    } catch (err) {
      console.error('Error fetching live battles:', err);
      if (err.response?.status === 403) toast.error('Super Admin access required');
    }
  }, []);

  const fetchBattleHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/battles/history`, {
        headers: authHeader(),
        params: { page, limit: 50, status: filterStatus !== 'all' ? filterStatus : undefined },
      });
      if (res.data.success) setBattleHistory(res.data.battles || []);
    } catch (err) {
      console.error('Error fetching battle history:', err);
    }
  }, [page, filterStatus]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/battles/reports`, {
        headers: authHeader(), params: { page: 1, limit: 50 },
      });
      if (res.data.success) setReports(res.data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/battles/stats`, { headers: authHeader() });
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // ---- Socket for real-time updates ----
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const newSocket = io(`${API_URL}/api/battlews`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    newSocket.on('connect', () => newSocket.emit('admin_join_monitor', { token }));
    newSocket.on('admin_joined', () => toast.success('Connected to live battle monitor'));
    newSocket.on('admin_battle_started', (data) => {
      setLiveBattles(prev => [data.battle, ...prev]);
      toast.info(`New battle started: ${data.room_id}`);
    });
    newSocket.on('admin_battle_ended', (data) => {
      setLiveBattles(prev => prev.filter(b => b.room_id !== data.room_id));
      fetchStats();
    });
    newSocket.on('admin_new_report', (data) => {
      setReports(prev => [data.report, ...prev]);
      toast.warning('New battle report submitted');
    });
    newSocket.on('admin_error', (data) => toast.error(data.error));

    return () => {
      newSocket.emit('admin_leave_monitor');
      newSocket.disconnect();
    };
  }, [fetchStats]);

  // ---- Initial load + auto-refresh ----
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLiveBattles(), fetchStats(), fetchReports()]);
      setLoading(false);
    };
    load();
    const interval = setInterval(() => { fetchLiveBattles(); fetchStats(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveBattles, fetchStats, fetchReports]);

  // ---- History fetched on tab switch ----
  useEffect(() => {
    if (activeTab === 'history') fetchBattleHistory();
  }, [activeTab, fetchBattleHistory]);

  // ---- Actions ----
  const handleTerminateBattle = async (battleId) => {
    if (!window.confirm('Are you sure you want to terminate this battle?')) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/battles/detail/${battleId}/terminate`,
        { reason: 'Admin terminated' },
        { headers: authHeader() }
      );
      if (res.data.success) {
        toast.success('Battle terminated');
        fetchLiveBattles();
      }
    } catch {
      toast.error('Failed to terminate battle');
    }
  };

  const handleReviewReport = async (reportId, status, actionTaken) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/battles/reports/${reportId}/review`,
        { status, action_taken: actionTaken, admin_notes: '' },
        { headers: authHeader() }
      );
      if (res.data.success) {
        toast.success('Report reviewed');
        fetchReports();
        setSelectedReport(null);
      }
    } catch {
      toast.error('Failed to review report');
    }
  };

  return {
    liveBattles, battleHistory, reports, filteredReports, stats, loading,
    activeTab, setActiveTab,
    selectedBattle, setSelectedBattle,
    selectedReport, setSelectedReport,
    filterStatus, setFilterStatus,
    fetchLiveBattles, handleTerminateBattle, handleReviewReport,
  };
}
