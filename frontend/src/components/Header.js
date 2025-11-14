import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Bell, LogOut, Menu, X, Flame, Search } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Header = ({ isLoggedIn = false, user = null, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/search-user?name=${encodeURIComponent(query)}`);
      
      if (response.data.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      handleSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleUserClick = (userId) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <header className="sticky top-0 z-40 shadow-2xl border-b border-gray-300" style={{ background: '#f8f9fa', color: '#1f2937' }}>
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
            <button onClick={() => navigate('/social')} className="text-gray-700 hover:text-cyan-600 transition-colors font-semibold">
              Social Feed
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
                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile (Desktop) - Click to go to Dashboard */}
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="hidden md:flex items-center space-x-3 bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 transition-colors cursor-pointer text-gray-800"
                >
                  <img
                    src={user.profile_picture || user.avatar || 'https://ui-avatars.com/api/?name=' + user.name}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-cyan-400"
                  />
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span>{user.rating || 1200}</span>
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{user.streak || 0}</span>
                    </div>
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </>
            ) : (
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
              <button onClick={() => { navigate('/social'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Social Feed
              </button>
              <button onClick={() => { navigate('/join-room'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
                Join Battle Room
              </button>
              <button onClick={() => { navigate('/about'); setMobileMenuOpen(false); }} className="text-left text-gray-700 hover:text-cyan-600 transition-colors font-semibold py-2">
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
