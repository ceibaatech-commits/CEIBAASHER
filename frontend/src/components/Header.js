import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Menu, X, Flame, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import NavbarSearch from './NavbarSearch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Header = ({ isLoggedIn = false, user = null, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  return (
    <header className="sticky top-0 z-50 shadow-2xl border-b border-gray-300" style={{ background: '#f8f9fa', color: '#1f2937' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => navigate('/')}
          >
            <img 
              src="/ceibaa-logo.png" 
              alt="Ceibaa Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Home
            </button>
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Exams
            </button>
            <button onClick={() => navigate('/chapter-tests')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Chapter Test
            </button>
            <button onClick={() => navigate('/books')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Books
            </button>
            <button onClick={() => navigate('/join-room')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Join Battle Room
            </button>
            <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              About Us
            </button>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isLoggedIn && user ? (
              <>
                {/* Navbar Search - YouTube style expanding search */}
                <NavbarSearch />

                {/* Notifications Bell */}
                <NotificationBell />

                {/* User Name (Desktop) */}
                <div className="hidden md:block text-right mr-2">
                  <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                {/* User Profile Avatar with Dropdown (Desktop) */}
                <div className="hidden md:block relative profile-dropdown-container">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none"
                  >
                    {/* Profile Avatar */}
                    {user.profile_picture || user.avatar ? (
                      <img
                        src={user.profile_picture || user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-cyan-500 transition-all object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-300 hover:border-cyan-500 transition-all cursor-pointer">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50 animate-fade-in">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-purple-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          {user.profile_picture || user.avatar ? (
                            <img
                              src={user.profile_picture || user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-cyan-400">
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-gray-700">{user.rating || 1200}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-gray-700">{user.streak || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/dashboard');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-600" />
                          <span className="font-medium text-sm">Dashboard</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onLogout();
                            navigate('/');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {!isLoggedIn && (
              <button
                onClick={onLogin}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-lg font-bold transition-all shadow-lg text-white"
              >
                Join Battle
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-300">
            {/* Mobile User Profile Section */}
            {isLoggedIn && user && (
              <div className="px-4 py-3 mb-3 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {user.profile_picture || user.avatar ? (
                    <img
                      src={user.profile_picture || user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-cyan-400">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-3 mt-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-700">{user.rating || 1200}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-gray-700">{user.streak || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col space-y-3">
              <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Home
              </button>
              <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Exams
              </button>
              <button onClick={() => { navigate('/chapter-tests'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Chapter Test
              </button>
              <button onClick={() => { navigate('/books'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Books
              </button>
              <button onClick={() => { navigate('/join-room'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Join Battle Room
              </button>
              <button onClick={() => { navigate('/about'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                About Us
              </button>

              {/* Mobile-only user actions */}
              {isLoggedIn && user && (
                <>
                  <div className="border-t border-gray-300 my-2"></div>
                  <button 
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} 
                    className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2 flex items-center space-x-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    onClick={() => { onLogout(); navigate('/'); setMobileMenuOpen(false); }} 
                    className="text-left text-red-600 hover:text-red-700 transition-colors font-semibold py-2 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
