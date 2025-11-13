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
            className="cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center">
              <svg width="200" height="60" viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerMultiColorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="20%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                    <stop offset="40%" style={{ stopColor: '#d946ef', stopOpacity: 1 }} />
                    <stop offset="60%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                    <stop offset="80%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                  </linearGradient>
                  <linearGradient id="headerGlossEffect" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
                    <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                    <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 0.1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="140"
                  y="55"
                  fontFamily="Arial, Helvetica, sans-serif"
                  fontSize="60"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="url(#headerMultiColorGradient)"
                  style={{ letterSpacing: '2px' }}
                >
                  Ceibaa
                </text>
                <text
                  x="140"
                  y="55"
                  fontFamily="Arial, Helvetica, sans-serif"
                  fontSize="60"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="url(#headerGlossEffect)"
                  opacity="0.5"
                  style={{ letterSpacing: '2px', mixBlendMode: 'overlay' }}
                >
                  Ceibaa
                </text>
                <text
                  x="140"
                  y="78"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="12"
                  fontWeight="400"
                  textAnchor="middle"
                  fill="#9ca3af"
                  style={{ letterSpacing: '2px' }}
                >
                  Mind Vs Mind
                </text>
              </svg>
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
            <button onClick={() => navigate('/social')} className="hover:text-cyan-400 transition-colors font-semibold">
              Social Feed
            </button>
            <button onClick={() => navigate('/join-room')} className="hover:text-cyan-400 transition-colors font-semibold">
              Join Battle Room
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-cyan-400 transition-colors font-semibold">
              About Us
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

                {/* User Profile (Desktop) - Click to go to Dashboard */}
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="hidden md:flex items-center space-x-3 bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-colors cursor-pointer"
                >
                  <img
                    src={user.profile_picture || user.avatar || 'https://ui-avatars.com/api/?name=' + user.name}
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
                </button>

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
              <button onClick={() => { navigate('/social'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Social Feed
              </button>
              <button onClick={() => { navigate('/join-room'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                Join Battle Room
              </button>
              <button onClick={() => { navigate('/about'); setMobileMenuOpen(false); }} className="text-left hover:text-cyan-400 transition-colors font-semibold py-2">
                About Us
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
