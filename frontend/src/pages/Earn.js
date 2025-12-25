import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Trophy, Star, Users, FileText, Video, Image, DollarSign, TrendingUp,
  Lock, Unlock, ChevronRight, Play, Pause, RefreshCw, Award, Crown,
  MapPin, Eye, IndianRupee, Target, Zap, Gift, CheckCircle2, Circle,
  GraduationCap, Building2, BookOpen, Sparkles, ArrowRight, Info
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Earn = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [milestoneData, setMilestoneData] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simData, setSimData] = useState({ posts: 0, followers: 0 });
  const [earningsSimulation, setEarningsSimulation] = useState({ earnings: 0, impressions: 0 });
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch milestone data
  const fetchMilestoneData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/milestones/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMilestoneData(response.data);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch simulation data
  const fetchSimulationData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [milestoneRes, earningsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/milestones/simulation`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/monetization/simulation`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (milestoneRes.data.success) {
        setSimData({
          posts: milestoneRes.data.simulation?.simulated_posts || 0,
          followers: milestoneRes.data.simulation?.simulated_followers || 0
        });
      }

      if (earningsRes.data.success) {
        setEarningsSimulation({
          earnings: earningsRes.data.simulation?.simulated_earnings || 0,
          impressions: earningsRes.data.simulation?.simulated_impressions || 0
        });
      }
    } catch (error) {
      console.error('Error fetching simulation:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchMilestoneData();
      fetchSimulationData();
    } else {
      setLoading(false);
    }
  }, []);

  // Simulate adding posts
  const simulateAddPosts = async () => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/milestones/simulate?action=add_post`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSimData(prev => ({
          ...prev,
          posts: response.data.simulation.posts
        }));
        toast.success('+100 Posts added!');
      }
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Simulate adding followers
  const simulateAddFollowers = async () => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/milestones/simulate?action=add_followers`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSimData(prev => ({
          ...prev,
          followers: response.data.simulation.followers
        }));
        toast.success('+250 Followers added!');
      }
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Simulate earnings
  const simulateEarnings = async (impressions = 1000) => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/monetization/simulate-earnings?impressions=${impressions}&cpm_rate=50`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEarningsSimulation({
          earnings: response.data.totals.total_simulated_earnings,
          impressions: response.data.totals.total_simulated_impressions
        });
        toast.success(`+₹${response.data.simulation.creator_earning.toFixed(2)} earned!`);
      }
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset simulation
  const resetSimulation = async () => {
    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        axios.post(`${BACKEND_URL}/api/milestones/simulate?action=reset`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post(`${BACKEND_URL}/api/monetization/reset-simulation`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSimData({ posts: 0, followers: 0 });
      setEarningsSimulation({ earnings: 0, impressions: 0 });
      toast.success('Simulation reset!');
    } catch (error) {
      toast.error('Reset failed');
    }
  };

  // Select badge
  const handleSelectBadge = async (badgeType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/milestones/select-badge`,
        { badge_type: badgeType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowBadgeModal(false);
        fetchMilestoneData();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to select badge');
    }
  };

  // Calculate progress for display
  const getDisplayStats = () => {
    if (!milestoneData) return { posts: 0, followers: 0 };
    
    if (simulationMode) {
      return {
        posts: (milestoneData.stats?.posts_count || 0) + simData.posts,
        followers: (milestoneData.stats?.followers_count || 0) + simData.followers
      };
    }
    
    return {
      posts: milestoneData.stats?.posts_count || 0,
      followers: milestoneData.stats?.followers_count || 0
    };
  };

  const displayStats = getDisplayStats();

  // Check milestone status
  const isBadgeUnlocked = displayStats.posts >= 500;
  const isMediaUnlocked = displayStats.followers >= 1000;
  const isMonetizationUnlocked = displayStats.followers >= 2500;

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={false} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <DollarSign className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Creator Earnings Program</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Unlock badges, media posting, and earn from local ads. Join now to start your journey!
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition"
            >
              Login to Get Started
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={!!user} user={user} onLogout={logout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-700 font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Creator Earnings Program
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Earn With Ceibaa</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Grow your account, unlock features, and earn from local vendor ads. 90% of all ad revenue goes directly to you!
          </p>
        </div>

        {/* Simulation Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${simulationMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                {simulationMode ? <Play className="w-5 h-5 text-purple-600" /> : <Pause className="w-5 h-5 text-gray-500" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Simulation Mode</h3>
                <p className="text-sm text-gray-500">Test milestone progression and earnings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {simulationMode && (
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  simulationMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {simulationMode ? 'Simulation ON' : 'Enable Simulation'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">Posts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayStats.posts.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-sm">Followers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayStats.followers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-sm">Impressions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {simulationMode ? earningsSimulation.impressions.toLocaleString() : (milestoneData?.monetization?.total_impressions || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-500 text-sm">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{simulationMode ? earningsSimulation.earnings.toFixed(2) : (milestoneData?.monetization?.total_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-7 h-7" />
              Milestone Rewards
            </h2>
            <p className="text-purple-100 mt-1">Complete milestones to unlock exclusive features</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Milestone 1: Badge */}
            <div className={`border-2 rounded-2xl p-6 transition ${isBadgeUnlocked ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isBadgeUnlocked ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {isBadgeUnlocked ? <Unlock className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Creator Badge</h3>
                      {isBadgeUnlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Unlock Teacher, Professor, or Institute badge</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Teacher</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Professor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Institute</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{displayStats.posts}/500</p>
                  <p className="text-sm text-gray-500">Posts</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((displayStats.posts / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>
              {isBadgeUnlocked && !milestoneData?.features?.badge_selected && (
                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Select Your Badge
                </button>
              )}
              {milestoneData?.features?.badge_selected && (
                <div className="mt-4 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Badge Selected: {milestoneData?.user?.badge_type}</span>
                </div>
              )}
            </div>

            {/* Milestone 2: Media Posting */}
            <div className={`border-2 rounded-2xl p-6 transition ${isMediaUnlocked ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isMediaUnlocked ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {isMediaUnlocked ? <Unlock className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Media Creator</h3>
                      {isMediaUnlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Unlock video and image posting abilities</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Images</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Videos</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{displayStats.followers.toLocaleString()}/1,000</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((displayStats.followers / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Milestone 3: Monetization */}
            <div className={`border-2 rounded-2xl p-6 transition ${isMonetizationUnlocked ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isMonetizationUnlocked ? 'bg-yellow-500' : 'bg-gray-200'}`}>
                    {isMonetizationUnlocked ? <Crown className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Monetization Partner</h3>
                      {isMonetizationUnlocked && <CheckCircle2 className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Enable full monetization and ad revenue</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">90% Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Local Ads</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{displayStats.followers.toLocaleString()}/2,500</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((displayStats.followers / 2500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        {simulationMode && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-500" />
              Simulation Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={simulateAddPosts}
                disabled={isSimulating}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Add Posts</p>
                    <p className="text-sm text-gray-500">+100 posts</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <button
                onClick={simulateAddFollowers}
                disabled={isSimulating}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Add Followers</p>
                    <p className="text-sm text-gray-500">+250 followers</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <button
                onClick={() => simulateEarnings(1000)}
                disabled={isSimulating || !isMonetizationUnlocked}
                className={`p-4 rounded-2xl transition flex items-center justify-between group ${
                  isMonetizationUnlocked
                    ? 'bg-yellow-50 hover:bg-yellow-100'
                    : 'bg-gray-100 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMonetizationUnlocked ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Simulate Earnings</p>
                    <p className="text-sm text-gray-500">{isMonetizationUnlocked ? '+1000 impressions' : 'Unlock at 2,500 followers'}</p>
                  </div>
                </div>
                {isMonetizationUnlocked && <ArrowRight className="w-5 h-5 text-yellow-500 opacity-0 group-hover:opacity-100 transition" />}
              </button>
            </div>
          </div>
        )}

        {/* Monetization Info */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-3xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">How Monetization Works</h2>
              <p className="text-white/80 mt-1">Local vendors, real earnings</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">Local Vendor Ads</h3>
              <p className="text-sm text-white/70">District-level businesses approach us to promote their services to local audiences</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">City-Based Targeting</h3>
              <p className="text-sm text-white/70">Ads are targeted by city, ensuring relevance for your local audience</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">90/10 Revenue Split</h3>
              <p className="text-sm text-white/70">You keep 90% of all ad revenue. Earn based on impressions from your content</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/70">Currently targeting: Delhi NCR region</span>
            </div>
            <button
              onClick={() => navigate('/victory-lane')}
              className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              Start Creating
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Badge Selection Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Select Your Badge</h2>
              <p className="text-gray-600 mt-2">Choose a badge that represents you best</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSelectBadge('Teacher')}
                className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 rounded-2xl transition flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition">
                  <Award className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Teacher</p>
                  <p className="text-sm text-gray-500">For educators and tutors</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectBadge('Professor')}
                className="w-full p-4 border-2 border-gray-200 hover:border-indigo-500 rounded-2xl transition flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition">
                  <GraduationCap className="w-6 h-6 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Professor</p>
                  <p className="text-sm text-gray-500">For academic experts</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectBadge('Institute')}
                className="w-full p-4 border-2 border-gray-200 hover:border-purple-500 rounded-2xl transition flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition">
                  <Building2 className="w-6 h-6 text-purple-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Institute</p>
                  <p className="text-sm text-gray-500">For coaching centers & organizations</p>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowBadgeModal(false)}
              className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Earn;
