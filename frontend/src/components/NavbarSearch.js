import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NavbarSearch = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsExpanded(false);
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setShowResults(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    setShowResults(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/auth/search-user?name=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.data.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 0) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setIsExpanded(false);
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
  };

  const handleClearClick = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      ref={searchContainerRef}
      className="relative flex items-center"
    >
      {/* Collapsed state - Just search icon */}
      {!isExpanded && (
        <button
          onClick={handleExpandClick}
          aria-label="Search users"
          className="p-2.5 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Search className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* Expanded state - Search bar */}
      {isExpanded && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center z-50">
          <form 
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-white border-2 border-cyan-500 rounded-full overflow-hidden shadow-2xl transition-all duration-300 ease-out"
            style={{
              width: window.innerWidth < 640 ? 'calc(100vw - 80px)' : '450px',
              height: '44px'
            }}
          >
            <button
              type="submit"
              aria-label="Search"
              className="pl-4 pr-2 py-3 focus:outline-none hover:bg-gray-50 transition-colors"
            >
              <Search className="w-5 h-5 text-cyan-600" />
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search exams, topics, courses..."
              aria-label="Search"
              className="flex-1 py-3 px-2 focus:outline-none text-base"
              style={{ 
                height: '44px',
                color: '#1a1a1a',
                backgroundColor: '#ffffff'
              }}
            />
            
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              aria-label="Close search"
              className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="fixed right-4 top-20 w-full min-w-[300px] max-w-[450px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-fade-in" style={{ zIndex: 9999 }}>
              <div className="max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600">
                        Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchResults.map((searchUser) => (
                      <button
                        key={searchUser.user_id}
                        onClick={() => handleUserClick(searchUser.user_id)}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        {searchUser.profile_picture || searchUser.avatar ? (
                          <img
                            src={searchUser.profile_picture || searchUser.avatar}
                            alt={searchUser.name}
                            className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-300">
                            {searchUser.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {searchUser.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {searchUser.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                ) : query.trim() ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No users found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try searching with a different name
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarSearch;
