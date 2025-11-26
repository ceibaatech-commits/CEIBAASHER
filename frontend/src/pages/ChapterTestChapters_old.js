// ChapterTestChapters_old.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Added missing icons (Search, Star, TrendingUp are used but not imported)
import { ArrowLeft, BookOpen, Clock, Trophy, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Play, ChevronRight, Target, Search, Star, TrendingUp } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChapterTestChapters = () => {
  const navigate = useNavigate();
  const { classNumber, subject } = useParams();
  // FIX: Simplified parameter extraction. classNumber is extracted by removing 'class-' prefix.
  const selectedClass = classNumber?.replace('class-', '');
  // FIX: Replaced complex subject formatting with simple conversion of URL slug to title case for display only.
  // The API call should use the slug-based name for better consistency, or ensure the API handles the formatted name.
  // Assuming subject URL is 'mathematics-kshitij' or 'mathematics'. Splitting by '-' and capitalizing words.
  const formattedSubject = subject?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // Assuming the subject slug from the URL is what the API needs. Let's send the original subject slug to the backend.
  const subjectSlug = subject;


  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, attempted, unattempted
  const [sortBy, setSortBy] = useState('chapter'); // chapter, name
  const [bookmarkedChapters, setBookmarkedChapters] = useState([]);

  useEffect(() => {
    fetchChapters();
    loadBookmarks();
  }, [selectedClass, subject]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [chapters, searchQuery, filterType, sortBy]);

  const fetchChapters = async () => {
    try { // FIX: Removed trailing colon after 'try'
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chapter-tests/chapters`, {
        params: {
          // FIX: Passing the clean class number and the URL slug for the subject
          class_param: selectedClass, 
          subject: subjectSlug // Send the slug name (e.g., 'mathematics') to backend
        }
      });
      
      if (response.data.success) {
        setChapters(response.data.chapters || []);
      } else {
        // FIX: Handle API failure response
        console.error('API returned failure:', response.data.message);
        setChapters(getDefaultChapters());
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      // Set default chapters if API fails
      setChapters(getDefaultChapters());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChapters = () => {
    // Default sample chapters structure
    return [
      { chapter_number: 1, chapter_name: 'Sample Chapter 1 (Default)', total_questions: 50, difficulty: 'Easy', duration: 30, attempted: false },
      { chapter_number: 2, chapter_name: 'Sample Chapter 2 (Default)', total_questions: 45, difficulty: 'Medium', duration: 35, attempted: false }
    ];
  };

  const loadBookmarks = () => {
    const saved = localStorage.getItem(`bookmarks_${selectedClass}_${subject}`);
    if (saved) {
      setBookmarkedChapters(JSON.parse(saved));
    }
  };

  const toggleBookmark = (chapterNumber) => {
    const updated = bookmarkedChapters.includes(chapterNumber)
      ? bookmarkedChapters.filter(num => num !== chapterNumber)
      : [...bookmarkedChapters, chapterNumber];
    
    setBookmarkedChapters(updated);
    localStorage.setItem(`bookmarks_${selectedClass}_${subject}`, JSON.stringify(updated));
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...chapters];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(ch => 
        ch.chapter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.chapter_number.toString().includes(searchQuery)
      );
    }

    // Apply filter type
    // Assuming 'attempted' status is part of the chapter data fetched from the API
    if (filterType === 'attempted') {
      filtered = filtered.filter(ch => ch.attempted);
    } else if (filterType === 'unattempted') {
      filtered = filtered.filter(ch => !ch.attempted);
    }

    // Apply sorting
    if (sortBy === 'chapter') {
      filtered.sort((a, b) => a.chapter_number - b.chapter_number);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.chapter_name.localeCompare(b.chapter_name));
    }

    setFilteredChapters(filtered);
  };

  const startTest = (chapter) => {
    // Navigate to quiz with chapter details
    navigate('/quiz', { 
      state: { 
        exam: `Class ${selectedClass}`,
        subject: formattedSubject,
        chapter: chapter.chapter_name,
        chapterNumber: chapter.chapter_number
      } 
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateProgress = () => {
    if (chapters.length === 0) return 0;
    // Assuming 'attempted' key exists in chapter objects
    const attempted = chapters.filter(ch => ch.attempted).length; 
    return Math.round((attempted / chapters.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate('/chapter-tests')} className="hover:text-cyan-600">
            Home
          </button>
          <span>/</span>
          <button onClick={() => navigate(`/chapter-tests/class-${selectedClass}`)} className="hover:text-cyan-600">
            Class {selectedClass}
          </button>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{formattedSubject}</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(`/chapter-tests/class-${selectedClass}`)}
          className="flex items-center space-x-2 text-gray-700 hover:text-cyan-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Subjects</span>
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Class {selectedClass}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-700 font-semibold">{formattedSubject}</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">
                Chapter-wise Tests
              </h1>
              <p className="text-gray-600">
                {chapters.length} chapters available • {calculateProgress()}% completed
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8" />
                  <div>
                    <p className="text-sm opacity-90">Overall Progress</p>
                    <p className="text-3xl font-bold">{calculateProgress()}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Chapters</option>
              <option value="attempted">Attempted</option>
              <option value="unattempted">Unattempted</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="chapter">Sort by Chapter Number</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Chapters List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="text-gray-600 mt-4">Loading chapters...</p>
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No chapters found</p>
            <p className="text-gray-500 text-sm mt-2">Check your URL parameters or backend configuration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.chapter_number}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-cyan-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Ch {chapter.chapter_number}
                      </span>
                      {chapter.attempted && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          ✓ Attempted
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {chapter.chapter_name}
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => toggleBookmark(chapter.chapter_number)}
                    className={`p-2 rounded-full ${
                      bookmarkedChapters.includes(chapter.chapter_number)
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                    } transition-colors`}
                  >
                    <Star className="w-5 h-5" fill={bookmarkedChapters.includes(chapter.chapter_number) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Questions</p>
                    <p className="text-2xl font-bold text-blue-700">{chapter.total_questions || 50}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 font-semibold mb-1">Duration</p>
                    <p className="text-2xl font-bold text-purple-700">{chapter.duration || 30}m</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs text-pink-600 font-semibold mb-1">Level</p>
                    <p className={`text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(chapter.difficulty || 'Medium')}`}>
                      {chapter.difficulty || 'Medium'}
                    </p>
                  </div>
                </div>

                {chapter.last_score && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Previous Score:</span>
                      <span className="text-lg font-bold text-green-600">{chapter.last_score}%</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => startTest(chapter)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>{chapter.attempted ? 'Practice Again' : 'Start Test'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Link */}
        <div className="mt-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white text-center">
          <h3 className="text-2xl font-bold mb-2">📊 View Your Performance Analytics</h3>
          <p className="mb-6 opacity-90">Track your progress, identify weak areas, and improve your scores</p>
          <button
            onClick={() => navigate('/analytics')}
            className="bg-white text-cyan-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Analytics Dashboard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestChapters;