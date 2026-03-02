import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Users, Clock, AlertTriangle, CheckCircle, XCircle,
  Eye, Ban, Flag, RefreshCw, ChevronDown, ChevronUp,
  Play, Pause, Shield, MessageSquare, Filter, Search
} from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const LiveBattlesManager = () => {
  const [liveBattles, setLiveBattles] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [socket, setSocket] = useState(null);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('ceibaa_admin_token');
  };

  // Fetch live battles
  const fetchLiveBattles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/battles/live`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.data.success) {
        setLiveBattles(response.data.live_battles || []);
      }
    } catch (error) {
      console.error('Error fetching live battles:', error);
      if (error.response?.status === 403) {
        toast.error('Super Admin access required');
      }
    }
  }, []);

  // Fetch battle history
  const fetchBattleHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/battles/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { page, limit: 50, status: filterStatus !== 'all' ? filterStatus : undefined }
      });
      if (response.data.success) {
        setBattleHistory(response.data.battles || []);
      }
    } catch (error) {
      console.error('Error fetching battle history:', error);
    }
  }, [page, filterStatus]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/battles/reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { page: 1, limit: 50 }
      });
      if (response.data.success) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/battles/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const newSocket = io(`${API_URL}/api/battlews`, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Admin connected to battle monitor');
      newSocket.emit('admin_join_monitor', { token });
    });

    newSocket.on('admin_joined', (data) => {
      console.log('Admin monitor joined:', data);
      toast.success('Connected to live battle monitor');
    });

    newSocket.on('admin_battle_started', (data) => {
      console.log('New battle started:', data);
      setLiveBattles(prev => [data.battle, ...prev]);
      toast.info(`New battle started: ${data.room_id}`);
    });

    newSocket.on('admin_battle_ended', (data) => {
      console.log('Battle ended:', data);
      setLiveBattles(prev => prev.filter(b => b.room_id !== data.room_id));
      fetchStats();
    });

    newSocket.on('admin_new_report', (data) => {
      console.log('New report:', data);
      setReports(prev => [data.report, ...prev]);
      toast.warning('New battle report submitted');
    });

    newSocket.on('admin_error', (data) => {
      toast.error(data.error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('admin_leave_monitor');
      newSocket.disconnect();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLiveBattles(),
        fetchStats(),
        fetchReports()
      ]);
      setLoading(false);
    };
    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveBattles();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLiveBattles, fetchStats, fetchReports]);

  // Fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchBattleHistory();
    }
  }, [activeTab, fetchBattleHistory]);

  // Terminate battle
  const handleTerminateBattle = async (battleId) => {
    if (!window.confirm('Are you sure you want to terminate this battle?')) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/battles/${battleId}/terminate`,
        { reason: 'Admin terminated' },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (response.data.success) {
        toast.success('Battle terminated');
        fetchLiveBattles();
      }
    } catch (error) {
      toast.error('Failed to terminate battle');
    }
  };

  // Review report
  const handleReviewReport = async (reportId, status, actionTaken) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/battles/reports/${reportId}/review`,
        { status, action_taken: actionTaken, admin_notes: '' },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (response.data.success) {
        toast.success('Report reviewed');
        fetchReports();
        setSelectedReport(null);
      }
    } catch (error) {
      toast.error('Failed to review report');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      waiting: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      in_progress: { bg: 'bg-green-100', text: 'text-green-800', icon: Play },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      terminated: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle },
      reviewed: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Eye },
      action_taken: { bg: 'bg-red-100', text: 'text-red-800', icon: Ban },
      dismissed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle }
    };

    const cfg = config[status] || config.waiting;
    const Icon = cfg.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active_battles}</p>
                <p className="text-sm text-gray-500">Active Battles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.battles_today}</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.battles_this_week}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_reports}</p>
                <p className="text-sm text-gray-500">Pending Reports</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'live', label: 'Live Battles', icon: Zap, count: liveBattles.length },
            { id: 'reports', label: 'Reports', icon: Flag, count: reports.filter(r => r.status === 'pending').length },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Live Battles Tab */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Battles</h3>
                <button
                  onClick={fetchLiveBattles}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {liveBattles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active battles at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveBattles.map(battle => (
                    <div
                      key={battle.id || battle.room_id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Zap className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{battle.room_id}</p>
                            <p className="text-sm text-gray-500">
                              {battle.exam} • {battle.subject}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {battle.players?.length || 2} players
                            </p>
                            <StatusBadge status={battle.status} />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedBattle(battle)}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleTerminateBattle(battle.id || battle.room_id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Terminate Battle"
                            >
                              <Ban className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Players */}
                      {battle.players && battle.players.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex gap-4">
                            {battle.players.map((player, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {player.username?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {player.username || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Score: {player.score || 0}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Battle Reports</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="action_taken">Action Taken</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports
                    .filter(r => filterStatus === 'all' || r.status === filterStatus)
                    .map(report => (
                      <div
                        key={report.id}
                        className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer ${
                          report.status === 'pending' ? 'border-l-4 border-orange-500' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              report.status === 'pending' ? 'bg-orange-100' : 'bg-gray-200'
                            }`}>
                              <Flag className={`w-5 h-5 ${
                                report.status === 'pending' ? 'text-orange-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {report.reported_user?.username || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Reported by: {report.reported_by?.username || 'Anonymous'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700 capitalize">
                                {report.reason?.replace('_', ' ')}
                              </p>
                              <StatusBadge status={report.status} />
                            </div>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        {report.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Battle History</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {battleHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No battle history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3 font-medium">Room ID</th>
                        <th className="pb-3 font-medium">Players</th>
                        <th className="pb-3 font-medium">Exam</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Duration</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {battleHistory.map(battle => (
                        <tr key={battle.id} className="hover:bg-gray-50">
                          <td className="py-3 text-sm font-medium text-gray-900">
                            {battle.room_id?.slice(0, 15)}...
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {battle.players?.length || 0} players
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {battle.exam}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={battle.status} />
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {battle.duration_seconds ? `${Math.floor(battle.duration_seconds / 60)}m` : '-'}
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {battle.created_at ? new Date(battle.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Reported User</p>
                <p className="font-medium text-gray-900">{selectedReport.reported_user?.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Reported By</p>
                <p className="font-medium text-gray-900">{selectedReport.reported_by?.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-medium text-gray-900 capitalize">
                  {selectedReport.reason?.replace('_', ' ')}
                </p>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedReport.status} />
              </div>

              {/* Chat Evidence */}
              {selectedReport.evidence?.chat_messages?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Chat Evidence</p>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedReport.evidence.chat_messages.map((msg, idx) => (
                      <div key={idx} className="text-sm mb-1">
                        <span className="font-medium">{msg.sender}:</span> {msg.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedReport.status === 'pending' && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Take Action</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReviewReport(selectedReport.id, 'dismissed', 'none')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleReviewReport(selectedReport.id, 'action_taken', 'warning')}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                    >
                      Warn User
                    </button>
                    <button
                      onClick={() => handleReviewReport(selectedReport.id, 'action_taken', 'temp_ban')}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                    >
                      7-Day Ban
                    </button>
                    <button
                      onClick={() => handleReviewReport(selectedReport.id, 'action_taken', 'permanent_ban')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Permanent Ban
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Battle Detail Modal */}
      {selectedBattle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Battle Details</h3>
                <button
                  onClick={() => setSelectedBattle(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Room ID</p>
                <p className="font-medium text-gray-900">{selectedBattle.room_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Exam</p>
                  <p className="font-medium text-gray-900">{selectedBattle.exam}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium text-gray-900">{selectedBattle.subject}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedBattle.status} />
              </div>

              {/* Players */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Players</p>
                <div className="space-y-2">
                  {selectedBattle.players?.map((player, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {player.username?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{player.username}</span>
                      </div>
                      <span className="text-sm text-gray-600">Score: {player.score || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedBattle(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleTerminateBattle(selectedBattle.id || selectedBattle.room_id);
                    setSelectedBattle(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Terminate Battle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBattlesManager;
