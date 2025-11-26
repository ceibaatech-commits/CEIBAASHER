import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar-search.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NavbarSearch = ({ onExpandChange }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Notify parent component about expansion state
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!query.trim()) {
          setIsExpanded(false);
        }
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

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
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
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
      // Search for exams and chapters
      const response = await axios.get(
        `${BACKEND_URL}/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.data.success) {
        setSearchResults(response.data.results || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
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

  const handleResultClick = (result) => {
    console.log('Search result clicked:', result);
    
    if (result.type === 'exam') {
      const path = `/exam/${result.slug}`;
      console.log('Navigating to exam:', path);
      navigate(path);
    } else if (result.type === 'chapter') {
      const path = `/chapter-tests/class-${result.class}/${result.subject}`;
      console.log('Navigating to chapter:', path);
      navigate(path);
    }
    
    setIsExpanded(false);
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
  };

  const handleCollapseClick = () => {
    setIsExpanded(false);
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleClearClick = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = (e) => {
    // Check if the blur is happening because of clicking inside the search container
    if (searchContainerRef.current && searchContainerRef.current.contains(e.relatedTarget)) {
      return;
    }
    
    // If there's no query and results aren't showing, collapse the search
    if (!query.trim() && !showResults) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 150);
    }
  };

  return (
    <div ref={searchContainerRef} className="navbar-search-wrapper">
      {!isExpanded ? (
        <button
          onClick={handleExpandClick}
          className="navbar-search-collapsed"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
      ) : (
        <div className="navbar-search-expanded">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Search exams, topics, courses..."
            autoComplete="off"
          />
          <button
            onClick={handleCollapseClick}
            className="navbar-search-close"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Close search"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          
          {showResults && (
            <div className="search-results-dropdown">
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
                        Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleResultClick(result);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 active:bg-gray-200 transition-colors text-left border-b border-gray-100 last:border-b-0 cursor-pointer"
                        style={{ minHeight: '56px' }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          result.type === 'exam' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}>
                          {result.type === 'exam' ? '📝' : '📚'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {result.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.type === 'exam' ? 'Exam' : `Class ${result.class} - ${result.subject}`}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </>
                ) : query.trim() ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
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
