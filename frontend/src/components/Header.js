import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Bell, LogOut, Menu, X, Flame } from 'lucide-react';

const Header = ({ isLoggedIn = false, user = null, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <svg className="w-12 h-12" viewBox="0 0 50 50">
                <defs>
                  <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="22" fill="url(#neonGradient)" opacity="0.2" />
                <path
                  d="M25 5 L45 25 L25 45 L5 25 Z"
                  fill="url(#neonGradient)"
                  className="animate-pulse"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Ceibaa
              </h1>
              <p className="text-xs text-cyan-400 font-semibold">Neural Battle Arena</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/')} className="hover:text-cyan-400 transition-colors font-semibold">
              Home
            </button>
            <button onClick={() => navigate('/')} className="hover:text-cyan-400 transition-colors font-semibold">
              Exams
            </button>
            <button onClick={() => navigate('/leaderboard')} className="hover:text-cyan-400 transition-colors font-semibold">
              Leaderboard
            </button>
            <button onClick={() => navigate('/creator-dashboard')} className="hover:text-cyan-400 transition-colors font-semibold">
              Create
            </button>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isLoggedIn && user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile (Desktop) */}
                <div className="hidden md:flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
                  <img
                    src={user.avatar || 'https://ui-avatars.com/api/?name=' + user.name}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-cyan-400"
                  />
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>{user.rating || 1200}</span>
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>{user.streak || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
              >
                Join Battle
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-3">
              <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Home
              </button>
              <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Exams
              </button>
              <button onClick={() => { navigate('/leaderboard'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Leaderboard
              </button>
              <button onClick={() => { navigate('/creator-dashboard'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Creator Dashboard
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
