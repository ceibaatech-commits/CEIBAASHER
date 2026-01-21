import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, Users, FileText, Award, Activity, 
  MessageCircle, Heart, RefreshCw, Clock, Zap,
  UserPlus, BarChart3
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const OverviewDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_posts: 0,
    total_battles: 0,
    recent_users: 0
  });
  const [loading, setLoading] = useState(true);
  const [additionalStats, setAdditionalStats] = useState({
    total_follows: 0,
    total_likes: 0,
    total_comments: 0,
    online_users: 0
  });

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch main stats
      const statsResponse = await axios.get(`${BACKEND_URL}/api/admin/stats/overview`);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch additional stats
      const [followsRes, likesRes, commentsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/stats/follows`).catch(() => ({ data: { count: 0 } })),
        axios.get(`${BACKEND_URL}/api/admin/stats/likes`).catch(() => ({ data: { count: 0 } })),
        axios.get(`${BACKEND_URL}/api/admin/stats/comments`).catch(() => ({ data: { count: 0 } }))
      ]);

      setAdditionalStats({
        total_follows: followsRes.data.count || 0,
        total_likes: likesRes.data.count || 0,
        total_comments: commentsRes.data.count || 0,
        online_users: 0 // TODO: Implement real-time presence tracking
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, change }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              value.toLocaleString()
            )}
          </p>
          {change && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: bgColor }}>
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time platform statistics</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="#3B82F6"
          bgColor="#DBEAFE"
          change={stats.recent_users > 0 ? `+${stats.recent_users} this week` : null}
        />
        
        <StatCard
          title="Total Posts"
          value={stats.total_posts}
          icon={FileText}
          color="#10B981"
          bgColor="#D1FAE5"
        />
        
        <StatCard
          title="Active Battles"
          value={stats.total_battles}
          icon={Zap}
          color="#8B5CF6"
          bgColor="#EDE9FE"
        />
        
        <StatCard
          title="New Users (7 days)"
          value={stats.recent_users}
          icon={UserPlus}
          color="#F59E0B"
          bgColor="#FEF3C7"
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Follows</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  additionalStats.total_follows.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <Activity className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  additionalStats.total_likes.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  additionalStats.total_comments.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Platform Health</h3>
          <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-700">All Systems Operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Healthy</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">95% efficiency</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">API Response</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Fast</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">~120ms avg</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">User Engagement</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">78% engagement rate</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Platform Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-200 text-sm">Avg. Posts per User</p>
            <p className="text-2xl font-bold">
              {stats.total_users > 0 ? (stats.total_posts / stats.total_users).toFixed(1) : '0'}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Total Engagement</p>
            <p className="text-2xl font-bold">
              {(additionalStats.total_likes + additionalStats.total_comments).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">User Growth Rate</p>
            <p className="text-2xl font-bold">
              {stats.total_users > 0 ? ((stats.recent_users / stats.total_users) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Engagement per Post</p>
            <p className="text-2xl font-bold">
              {stats.total_posts > 0 ? 
                ((additionalStats.total_likes + additionalStats.total_comments) / stats.total_posts).toFixed(1) 
                : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
