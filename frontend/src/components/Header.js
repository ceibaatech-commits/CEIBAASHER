import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Menu, X, Flame, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import NavbarSearch from './NavbarSearch';
import '../styles/navbar-search.css';

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
    <>
      <header className="sticky top-0 z-50 shadow-lg border-b border-gray-200" style={{ background: '#ffffff', color: '#1f2937', height: '64px' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full">
          <div className="flex items-center h-full gap-6 lg:gap-8 relative">
          {/* Logo & Brand */}
          <div 
            className="cursor-pointer flex items-center flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img 
              src="/ceibaa-logo.png" 
              alt="Ceibaa Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-1 ml-4">
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-cyan-600 transition-all duration-200 font-semibold text-base whitespace-nowrap py-2 px-1 hover:scale-105 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button onClick={() => navigate('/social-feed')} className="text-gray-700 hover:text-cyan-600 transition-all duration-200 font-semibold text-base whitespace-nowrap py-2 px-1 hover:scale-105 relative group">
              Victory Lane
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button onClick={() => navigate('/chapter-tests')} className="text-gray-700 hover:text-cyan-600 transition-all duration-200 font-semibold text-base whitespace-nowrap py-2 px-1 hover:scale-105 relative group">
              Skill Drills
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button onClick={() => navigate('/books')} className="text-gray-700 hover:text-cyan-600 transition-all duration-200 font-semibold text-base whitespace-nowrap py-2 px-1 hover:scale-105 relative group">
              Books
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
            </button>
            {/* Only show Join Battle Room for non-logged-in users */}
            {!isLoggedIn && (
              <button onClick={() => navigate('/join-room')} className="text-gray-700 hover:text-cyan-600 transition-all duration-200 font-semibold text-base whitespace-nowrap py-2 px-1 hover:scale-105 relative group">
                Join Battle Room
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
              </button>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
            {/* Navbar Search - Always Visible */}
            <div className="hidden md:block">
              <NavbarSearch />
            </div>
            
            {isLoggedIn && user ? (
              <>
                {/* Notifications Bell - Only for logged-in users */}
                <NotificationBell />

                {/* User Profile Avatar with Dropdown (Desktop) - Only for logged-in users */}
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
                    <div className="fixed right-4 top-16 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-fade-in" style={{ zIndex: 9999 }}>
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
                            navigate(`/profile/${user.id || user.user_id}`);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
                        >
                          <User className="w-4 h-4 text-cyan-600" />
                          <span className="font-medium text-sm">View Profile</span>
                        </button>
                        
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
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        
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

            {/* Auth Buttons for Guests */}
            {!isLoggedIn && (
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 border-2 border-cyan-500 text-cyan-600 font-semibold rounded-lg hover:bg-cyan-50 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-5 py-2 rounded-lg font-bold transition-all shadow-lg text-white"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {/* Mobile Guest Auth Button */}
            {!isLoggedIn && (
              <button
                onClick={() => navigate('/login')}
                className="md:hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-4 py-2 rounded-lg font-bold transition-all shadow-lg text-white text-sm"
              >
                Login
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
              <button onClick={() => { navigate('/social-feed'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Victory Lane
              </button>
              <button onClick={() => { navigate('/chapter-tests'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Skill Drills
              </button>
              <button onClick={() => { navigate('/books'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Books
              </button>
              {/* Only show Join Battle Room for non-logged-in users */}
              {!isLoggedIn && (
                <button onClick={() => { navigate('/join-room'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                  Join Battle Room
                </button>
              )}

              {/* Mobile Search */}
              <div className="py-2">
                <NavbarSearch />
              </div>

              {/* Mobile-only user actions */}
              {isLoggedIn && user && (
                <>
                  <div className="border-t border-gray-300 my-2"></div>
                  <button 
                    onClick={() => { navigate(`/profile/${user.id || user.user_id}`); setMobileMenuOpen(false); }} 
                    className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </button>
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

    </>
  );
};

export default Header;
