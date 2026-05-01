import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Users, TrendingUp, BookOpen, Brain, Target, Award, ArrowRight, Sparkles, Clock } from 'lucide-react';
import axios from 'axios';
import StunningCeibaaLogo from '../components/StunningCeibaaLogo';

const API_URL = window.location.origin;

const NewHome = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchExams();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/exams`);
      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsLoggedIn(false);
  };

  const examIcons = {
    NEET: '🧬',
    JEE: '⚛️',
    UPSC: '🏛️',
    SSC: '📊',
    Banking: '💰',
    Agriculture: '🌾',
    RPSC: '🏢',
    Defence: '🎖️'
  };

  const examColors = {
    NEET: 'from-green-400 to-emerald-600',
    JEE: 'from-blue-400 to-indigo-600',
    UPSC: 'from-purple-400 to-violet-600',
    SSC: 'from-orange-400 to-red-600',
    Banking: 'from-yellow-400 to-orange-600',
    Agriculture: 'from-lime-400 to-green-600',
    RPSC: 'from-pink-400 to-rose-600',
    Defence: 'from-cyan-400 to-blue-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <StunningCeibaaLogo size="md" showText={true} />
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white hover:text-cyan-400 transition-colors font-medium">Features</a>
              <a href="#exams" className="text-white hover:text-cyan-400 transition-colors font-medium">Exams</a>
              <button
                onClick={() => navigate('/admin/sheets')}
                className="text-white hover:text-cyan-400 transition-colors font-medium"
              >
                Admin
              </button>
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/50"
                >
                  Join Battle
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">India's #1 Interactive Exam Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transform Learning
            </span>
            <br />
            <span className="text-white">Into Epic Battles</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Master competitive exams through live multiplayer battles, AI-powered practice, and real-time challenges. Join 10,000+ students crushing their goals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => document.getElementById('exams').scrollIntoView({ behavior: 'smooth' })}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl font-bold text-lg transition-all shadow-2xl hover:shadow-cyan-500/50 hover:scale-105"
            >
              Start Battle Now
              <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/join-room')}
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all border-2 border-white/30 hover:border-cyan-400"
            >
              Join with PIN
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, label: 'Active Battlers', value: '10K+' },
              { icon: Trophy, label: 'Daily Battles', value: '500+' },
              { icon: BookOpen, label: 'Practice Topics', value: '200+' },
              { icon: Award, label: 'Success Rate', value: '95%' }
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Students Love <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Ceibaa</span>
            </h2>
            <p className="text-xl text-gray-300">Experience the future of competitive exam preparation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Live Battle Mode',
                desc: 'Compete in real-time with video chat, reactions, and instant leaderboards',
                color: 'from-yellow-400 to-orange-500'
              },
              {
                icon: Brain,
                title: 'AI-Powered Practice',
                desc: 'Adaptive questions from Google Sheets with detailed explanations',
                color: 'from-purple-400 to-pink-500'
              },
              {
                icon: Target,
                title: 'Topic Mastery',
                desc: 'Focus on specific subjects with 200+ curated topics across 8 major exams',
                color: 'from-cyan-400 to-blue-500'
              },
              {
                icon: Users,
                title: 'Multiplayer Rooms',
                desc: 'Create PIN-based rooms for friends or join public battles instantly',
                color: 'from-green-400 to-emerald-500'
              },
              {
                icon: Trophy,
                title: 'Rewards & Rankings',
                desc: 'Earn points, climb leaderboards, unlock achievements and badges',
                color: 'from-pink-400 to-rose-500'
              },
              {
                icon: Clock,
                title: 'Flexible Learning',
                desc: 'Solo practice, group battles, or timed challenges - your choice',
                color: 'from-indigo-400 to-purple-500'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-cyan-400/50 transition-all hover:scale-105"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exams Section */}
      <section id="exams" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Battle Arena</span>
            </h2>
            <p className="text-xl text-gray-300">8 major competitive exams, thousands of questions</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
              <p className="text-white mt-4">Loading exams...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => navigate(`/exam/${exam.id}`)}
                  className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-cyan-400/50 transition-all hover:scale-105 text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${examColors[exam.id]} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  
                  <div className="relative">
                    <div className="text-5xl mb-4">{examIcons[exam.id]}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{exam.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{exam.fullName}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-400 font-medium">{exam.subjects.length} Subjects</span>
                      <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 animate-gradient"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-pulse-slow" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Dominate Your Exams?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of students already crushing their competitive exam goals
          </p>
          <button
            onClick={() => document.getElementById('exams').scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl font-bold text-xl transition-all shadow-2xl hover:shadow-cyan-500/50 hover:scale-105"
          >
            Start Your First Battle
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <CeibaaLogo size="sm" />
            <div className="text-gray-400 text-sm mt-4 md:mt-0">
              © 2024 Ceibaa. Empowering students to achieve excellence.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewHome;
