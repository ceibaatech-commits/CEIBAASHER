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
  GraduationCap, Building2, BookOpen, Sparkles, ArrowRight, Info, TreePine
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
      <div className="min-h-screen bg-slate-50">
        <Header isLoggedIn={false} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <TreePine className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">The Canopy</h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Grow under the canopy. Unlock badges, media posting, and earn from local ads.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
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
      <div className="min-h-screen bg-slate-50">
        <Header isLoggedIn={!!user} user={user} onLogout={logout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-medium text-sm mb-4">
            <TreePine className="w-4 h-4" />
            The Canopy
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Grow & Earn</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Complete milestones, unlock features, and earn 90% of all ad revenue from local vendors.
          </p>
        </div>

        {/* Simulation Toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${simulationMode ? 'bg-amber-100' : 'bg-slate-100'}`}>
                {simulationMode ? <Play className="w-5 h-5 text-amber-600" /> : <Pause className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Simulation Mode</h3>
                <p className="text-sm text-slate-500">Test milestone progression</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {simulationMode && (
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={`px-5 py-2 rounded-lg font-medium transition ${
                  simulationMode
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {simulationMode ? 'Simulation ON' : 'Enable Simulation'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-slate-500 text-sm">Posts</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{displayStats.posts.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-slate-500 text-sm">Followers</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{displayStats.followers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-slate-500 text-sm">Impressions</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {simulationMode ? earningsSimulation.impressions.toLocaleString() : (milestoneData?.monetization?.total_impressions || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-slate-500 text-sm">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ₹{simulationMode ? earningsSimulation.earnings.toFixed(2) : (milestoneData?.monetization?.total_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              Milestone Rewards
            </h2>
            <p className="text-emerald-100 text-sm mt-1">Complete milestones to unlock exclusive features</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Milestone 1: Badge */}
            <div className={`border rounded-xl p-4 md:p-5 transition ${isBadgeUnlocked ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isBadgeUnlocked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {isBadgeUnlocked ? <Unlock className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Lock className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-900">Creator Badge</h3>
                    {isBadgeUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  </div>
                  <p className="text-slate-500 text-xs md:text-sm mt-0.5">Unlock Teacher, Professor, or Institute badge</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Teacher</span>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Professor</span>
                    <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-md">Institute</span>
                  </div>
                  {/* Progress indicator - inline on mobile */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((displayStats.posts / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="text-sm md:text-base font-bold text-slate-900">{displayStats.posts}</span>
                      <span className="text-xs text-slate-500">/500</span>
                    </div>
                  </div>
                </div>
              </div>
              {isBadgeUnlocked && !milestoneData?.features?.badge_selected && (
                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="mt-4 w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Select Your Badge
                </button>
              )}
              {milestoneData?.features?.badge_selected && (
                <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Badge: {milestoneData?.user?.badge_type}</span>
                </div>
              )}
            </div>

            {/* Milestone 2: Media Posting */}
            <div className={`border rounded-xl p-5 transition ${isMediaUnlocked ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMediaUnlocked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    {isMediaUnlocked ? <Unlock className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Media Creator</h3>
                      {isMediaUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">Unlock video and image posting abilities</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <Image className="w-3 h-3" /> Images
                      </span>
                      <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <Video className="w-3 h-3" /> Videos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{displayStats.followers.toLocaleString()}/1,000</p>
                  <p className="text-xs text-slate-500">Followers</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((displayStats.followers / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Milestone 3: Monetization */}
            <div className={`border rounded-xl p-5 transition ${isMonetizationUnlocked ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMonetizationUnlocked ? 'bg-amber-500' : 'bg-slate-200'}`}>
                    {isMonetizationUnlocked ? <Crown className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Monetization Partner</h3>
                      {isMonetizationUnlocked && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">Enable full monetization and ad revenue</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> 90% Revenue
                      </span>
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Local Ads
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{displayStats.followers.toLocaleString()}/2,500</p>
                  <p className="text-xs text-slate-500">Followers</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((displayStats.followers / 2500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        {simulationMode && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Simulation Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={simulateAddPosts}
                disabled={isSimulating}
                className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Add Posts</p>
                    <p className="text-sm text-slate-500">+100 posts</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <button
                onClick={simulateAddFollowers}
                disabled={isSimulating}
                className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Add Followers</p>
                    <p className="text-sm text-slate-500">+250 followers</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <button
                onClick={() => simulateEarnings(1000)}
                disabled={isSimulating || !isMonetizationUnlocked}
                className={`p-4 rounded-xl transition flex items-center justify-between group border ${
                  isMonetizationUnlocked
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                    : 'bg-slate-50 border-slate-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMonetizationUnlocked ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <IndianRupee className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Simulate Earnings</p>
                    <p className="text-sm text-slate-500">{isMonetizationUnlocked ? '+1000 impressions' : 'Unlock at 2,500'}</p>
                  </div>
                </div>
                {isMonetizationUnlocked && <ArrowRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition" />}
              </button>
            </div>
          </div>
        )}

        {/* Monetization Info */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">How Monetization Works</h2>
              <p className="text-emerald-100 text-sm mt-1">Local vendors, real earnings</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-semibold mb-1.5">Local Vendor Ads</h3>
              <p className="text-sm text-emerald-100">District-level businesses promote their services to local audiences</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-semibold mb-1.5">City-Based Targeting</h3>
              <p className="text-sm text-emerald-100">Ads are targeted by city for relevance to your local audience</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <IndianRupee className="w-4 h-4" />
              </div>
              <h3 className="font-semibold mb-1.5">90/10 Revenue Split</h3>
              <p className="text-sm text-emerald-100">Keep 90% of all ad revenue. Earn from impressions on your content</p>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-200" />
              <span className="text-sm text-emerald-200">Currently targeting: Delhi NCR region</span>
            </div>
            <button
              onClick={() => navigate('/victory-lane')}
              className="px-6 py-2.5 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition flex items-center gap-2"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Gift className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Select Your Badge</h2>
              <p className="text-slate-500 text-sm mt-1">Choose a badge that represents you best</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSelectBadge('Teacher')}
                className="w-full p-4 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition flex items-center gap-4 group"
              >
                <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition">
                  <Award className="w-5 h-5 text-blue-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Teacher</p>
                  <p className="text-sm text-slate-500">For educators and tutors</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectBadge('Professor')}
                className="w-full p-4 border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl transition flex items-center gap-4 group"
              >
                <div className="w-11 h-11 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition">
                  <GraduationCap className="w-5 h-5 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Professor</p>
                  <p className="text-sm text-slate-500">For academic experts</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectBadge('Institute')}
                className="w-full p-4 border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 rounded-xl transition flex items-center gap-4 group"
              >
                <div className="w-11 h-11 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition">
                  <Building2 className="w-5 h-5 text-violet-600 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Institute</p>
                  <p className="text-sm text-slate-500">For coaching centers & organizations</p>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowBadgeModal(false)}
              className="w-full mt-4 py-2.5 text-slate-500 hover:text-slate-700 transition text-sm"
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
