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
              <img 
                src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/sd5j5kdo_IMG_1159-removebg-preview.png"
                alt="Ceibaa Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Ceibaa
              </h1>
              <p className="text-xs text-cyan-300 font-bold tracking-wide">Neural Battle Arena</p>
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
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
