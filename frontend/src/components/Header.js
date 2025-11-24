import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Home, Trophy, BookOpen, Users, LogOut, User, Search } from 'lucide-react';
import StunningCeibaaLogo from './StunningCeibaaLogo';
import NavbarSearch from './NavbarSearch';

const Header = ({ isLoggedIn = false, user = null, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <StunningCeibaaLogo size="sm" showText={true} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold flex items-center space-x-1">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button onClick={() => navigate('/exams')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold flex items-center space-x-1">
              <Trophy className="w-4 h-4" />
              <span>Victory Lane</span>
            </button>
            <button onClick={() => navigate('/chapter-tests')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>Skill Drills</span>
            </button>
            <button onClick={() => navigate('/social-feed')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Victory Lane
            </button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block">
            <NavbarSearch />
          </div>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-cyan-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Join Battle
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-cyan-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
              Home
            </button>
            <button onClick={() => { navigate('/exams'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
              Victory Lane
            </button>
            <button onClick={() => { navigate('/chapter-tests'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
              Skill Drills
            </button>
            <button onClick={() => { navigate('/social-feed'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
              Victory Lane
            </button>

            {/* Mobile Search */}
            <div className="py-2">
              <NavbarSearch />
            </div>

            {isLoggedIn && user ? (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                  Dashboard
                </button>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md"
              >
                Join Battle
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
