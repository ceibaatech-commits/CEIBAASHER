import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp, BookOpen, FileText, Clock, Gamepad2, Search, Home as HomeIcon, Plus, ChevronRight } from 'lucide-react';
import axios from 'axios';
import CeibaaLogo from '../components/CeibaaLogo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import HomeBannerCarousel from '../components/HomeBannerCarousel';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExams();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('ceibaa_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ceibaa_user');
      }
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/exams`);
      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ceibaa_user');
    setUser(null);
    setIsLoggedIn(false);
  };

  // Category filter
  const categories = [
    { id: 'admission', label: 'Admission Tests', icon: '🎓', color: 'from-violet-600 to-purple-600' },
    { id: 'medical', label: 'Medical', icon: '🏥', color: 'from-emerald-600 to-teal-600' },
    { id: 'defence', label: 'Defence', icon: '🎖️', color: 'from-green-700 to-emerald-700' },
    { id: 'banking', label: 'Banking', icon: '🏦', color: 'from-rose-600 to-red-600' },
    { id: 'teaching', label: 'Teaching Examinations', icon: '👨‍🏫', color: 'from-blue-600 to-indigo-600' },
    { id: 'ssc', label: 'SSC Examinations', icon: '📝', color: 'from-cyan-600 to-blue-600' },
    { id: 'upsc', label: 'UPSC Examinations', icon: '🏛️', color: 'from-purple-600 to-pink-600' },
    { id: 'language', label: 'Language Proficiency Tests', icon: '🌍', color: 'from-teal-600 to-green-600' },
  ];

  // Skill Drill Classes (CBSE)
  const skillDrillClasses = [
    { id: 'class-6', name: 'Class 6', icon: '📗', color: 'from-cyan-500 to-blue-500', subjects: 'Science, Maths, SST' },
    { id: 'class-7', name: 'Class 7', icon: '📘', color: 'from-blue-500 to-indigo-500', subjects: 'Science, Maths, SST' },
    { id: 'class-8', name: 'Class 8', icon: '📙', color: 'from-indigo-500 to-purple-500', subjects: 'Science, Maths, SST' },
    { id: 'class-9', name: 'Class 9', icon: '📕', color: 'from-purple-500 to-pink-500', subjects: 'Science, Maths, SST' },
    { id: 'class-10', name: 'Class 10', icon: '📓', color: 'from-pink-500 to-rose-500', subjects: 'Science, Maths, SST' },
    { id: 'class-11', name: 'Class 11', icon: '📔', color: 'from-emerald-500 to-teal-500', subjects: 'PCM, PCB, Commerce' },
    { id: 'class-12', name: 'Class 12', icon: '📒', color: 'from-orange-500 to-amber-500', subjects: 'PCM, PCB, Commerce' },
  ];

  // Filter exams based on category and search
  const getFilteredExams = () => {
    let filtered = exams;
    
    if (activeCategory) {
      // Map filter categories to both exam IDs and category names
      const categoryMap = {
        admission: { ids: ['CUET', 'CAT', 'CLAT', 'IPM', 'JEE', 'NEET', 'GATE', 'UGC_NET'], categories: ['Admission Tests'] },
        medical: { ids: ['NEET'], categories: ['Medical Entrance', 'Medical'] },
        defence: { ids: ['NDA', 'Agniveer', 'CDS', 'CAPF', 'AFCAT'], categories: ['Defence', 'Defence Examinations'] },
        banking: { ids: ['IBPS_PO', 'SBI_PO', 'RBI_Grade_B'], categories: ['Banking Examinations', 'Banking'] },
        teaching: { ids: ['CTET', 'UGC_NET'], categories: ['Teaching Examinations', 'Teaching'] },
        ssc: { ids: ['SSC_CGL', 'SSC_CHSL'], categories: ['SSC Examinations'] },
        upsc: { ids: ['UPSC'], categories: ['UPSC Examinations'] },
        language: { ids: ['SPANISH', 'FRENCH', 'TAMIL', 'TELUGU', 'KANNADA', 'CHINESE', 'JAPANESE', 'KOREAN', 'IELTS', 'TOEFL'], categories: ['Language Proficiency Tests', 'Language', 'Language Learning', 'Language Games'] },
      };
      const mapping = categoryMap[activeCategory] || { ids: [], categories: [] };
      filtered = filtered.filter(exam => 
        mapping.ids.includes(exam.id) || mapping.categories.includes(exam.category)
      );
    }
    
    if (searchQuery) {
      filtered = filtered.filter(exam => 
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Scroll to exams section
      const examsSection = document.getElementById('exams-section');
      examsSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  const filteredExams = getFilteredExams();
  const activeCateg = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 pb-20 md:pb-0">
      {/* SEO Component for Home Page */}
      <SEO 
        title="Ceibaa 2026 - Test Series, MCQ & Free Practice Quizzes for JEE, NEET, UPSC, SSC & 38+ Competitive Exams"
        description="Master 38+ competitive exams including JEE 2026, NEET 2026, UPSC, SSC, Banking, Teaching with Ceibaa's free online test series, MCQs, and practice quizzes. Join live multiplayer battles, take mock tests, and prepare with comprehensive syllabus coverage."
        keywords="JEE 2026, NEET 2026, UPSC 2026, SSC 2026, Banking exams, Teaching exams, competitive exams, test series, MCQ practice, free quiz, online mock tests, exam preparation, live battles"
      />
      
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Mobile Hero Section - Fresh Design */}
      <div className="md:hidden bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Welcome to Ceibaa</h1>
            <p className="text-slate-300 text-sm">Master your competitive exams</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exams, topics..."
              className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </form>
        
        {/* Quick Stats */}
        <div className="flex justify-between mt-4 bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-cyan-400">38+</p>
            <p className="text-xs text-slate-400">Exams</p>
          </div>
          <div className="text-center flex-1 border-x border-slate-600/50">
            <p className="text-2xl font-bold text-emerald-400">50K+</p>
            <p className="text-xs text-slate-400">Questions</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-amber-400">Live</p>
            <p className="text-xs text-slate-400">Battles</p>
          </div>
        </div>
      </div>

      {/* Category Filter - Grid Layout (3 per row) */}
      <div className="md:hidden bg-white sticky top-16 z-30 shadow-md border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2 py-3 px-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all h-20 w-full ${
                activeCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl leading-none">{cat.icon}</span>
              <span className="text-center leading-tight px-1 line-clamp-2">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Search Results */}
      {searchQuery.trim() && (
        <div className="md:hidden px-4 py-4 bg-white border-b">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl p-4 text-white mb-4">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-lg">Search Results</h2>
                <p className="text-white/80 text-sm">Found {filteredExams.length} exams for "{searchQuery}"</p>
              </div>
            </div>
          </div>
          
          {/* Search Result Cards */}
          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => navigate(`/exam/${exam.id}`)}
                style={{ padding: '0.75rem' }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`bg-gradient-to-br ${exam.color} rounded-xl flex items-center justify-center shadow-md`}
                    style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }}
                  >
                    {exam.icon?.startsWith('http') ? (
                      <img src={exam.icon} alt={exam.name} style={{ width: '1.5rem', height: '1.5rem' }} className="object-contain" />
                    ) : (
                      <span style={{ fontSize: '1.25rem' }}>{exam.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900" style={{ fontSize: '0.875rem' }}>{exam.name}</h3>
                    <p className="text-gray-500 truncate" style={{ fontSize: '0.75rem' }}>{exam.full_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-gray-500" style={{ fontSize: '0.625rem' }}>
                      <span className="flex items-center gap-1">
                        <FileText style={{ width: '0.75rem', height: '0.75rem' }} />
                        {exam.total_questions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                        {exam.duration}
                      </span>
                    </div>
                  </div>
                  <ChevronRight style={{ width: '1rem', height: '1rem' }} className="text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
            {filteredExams.length === 0 && (
              <p className="text-center text-gray-500 py-8">No exams found matching "{searchQuery}"</p>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Show Selected Category Exams - Only when a category is selected */}
      {!searchQuery.trim() && activeCategory && (
        <div className="md:hidden px-4 py-3 bg-white border-b">
          <div className={`bg-gradient-to-r ${activeCateg?.color} rounded-xl p-3 text-white mb-3`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeCateg?.icon}</span>
              <div>
                <h2 className="font-bold text-sm">{activeCateg?.label}</h2>
                <p className="text-white/90 text-xs">{filteredExams.length} exams available</p>
              </div>
            </div>
          </div>
          {/* Exam Cards for Selected Category */}
          <div className="space-y-2">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => navigate(`/exam/${exam.id}`)}
                style={{ padding: '0.75rem' }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`bg-gradient-to-br ${exam.color} rounded-xl flex items-center justify-center shadow-md`}
                    style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }}
                  >
                    {exam.icon.startsWith('http') ? (
                      <img src={exam.icon} alt={exam.name} style={{ width: '1.5rem', height: '1.5rem' }} className="object-contain" />
                    ) : (
                      <span style={{ fontSize: '1.25rem' }}>{exam.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900" style={{ fontSize: '0.875rem' }}>{exam.name}</h3>
                    <p className="text-gray-500 truncate" style={{ fontSize: '0.75rem' }}>{exam.full_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-gray-500" style={{ fontSize: '0.625rem' }}>
                      <span className="flex items-center gap-1">
                        <FileText style={{ width: '0.75rem', height: '0.75rem' }} />
                        {exam.total_questions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                        {exam.duration}
                      </span>
                    </div>
                  </div>
                  <ChevronRight style={{ width: '1rem', height: '1rem' }} className="text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
            {filteredExams.length === 0 && (
              <p className="text-center text-gray-500 py-8">No exams found in this category</p>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Skill Drill - CBSE Classes Section */}
      {!searchQuery.trim() && !activeCategory && (
        <div className="md:hidden px-4 py-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Skill Drill - CBSE Classes</h2>
            <p className="text-sm text-gray-600">Chapter-wise practice for all subjects</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {skillDrillClasses.map((classItem) => (
              <div
                key={classItem.id}
                onClick={() => navigate(`/chapter-tests/${classItem.id}`)}
                className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 active:scale-95 transition-transform cursor-pointer overflow-hidden"
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${classItem.color} opacity-10`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">{classItem.icon}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{classItem.name}</h3>
                  <p className="text-xs text-gray-600 leading-tight">{classItem.subjects}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Desktop Banner Carousel */}
      <div className="hidden md:block mt-16">
        <HomeBannerCarousel />
      </div>
      
      {/* Quick Access Buttons - Desktop Only */}
      <div className="hidden md:block bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/victory-lane')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Victory Lane</span>
            </button>
            <button
              onClick={() => navigate('/join-room')}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Join Battle Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-white border-b shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">38+ Competitive Exams</p>
              <p className="text-xs text-gray-600">Complete Syllabus</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Live Battles</p>
              <p className="text-xs text-gray-600">Real-time Competition</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 text-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Topic-wise Quiz</p>
              <p className="text-xs text-gray-600">Focused Practice</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Track Progress</p>
              <p className="text-xs text-gray-600">Detailed Analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Section: Unlocking Exam Potential - Optimized */}
      <section className="py-16 bg-gradient-to-b from-white via-indigo-50/30 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              UNLOCKING YOUR EXAM POTENTIAL
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-medium">
              Preparing global learners for competitive success
            </p>
          </div>

          {/* Three Feature Cards - Optimized */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: Real-Time Mock Tests */}
            <div className="group transform transition-transform duration-300 hover:scale-105">
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
                
                <div className="p-8">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    Real-Time Mock Tests
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/dyz1aut8_Gemini_Generated_Image_pzpy3hpzpy3hpzpy_2-removebg-preview.png"
                      alt="Real-Time Mock Tests"
                      className="w-48 h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed">
                    Experience authentic exam simulations with timed sections, just like the real thing.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Timed Practice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Personalized Practice Plans */}
            <div className="group transform transition-transform duration-300 hover:scale-105">
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500"></div>
                
                <div className="p-8">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    Personalized Plans
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/vi47czpu_Gemini_Generated_Image_fduhiefduhiefduh_2-removebg-preview.png"
                      alt="Personalized Practice Plans"
                      className="w-48 h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed">
                    Get custom study schedules and recommended tests based on your performance.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700">Smart Study</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: In-Depth Performance Analytics */}
            <div className="group transform transition-transform duration-300 hover:scale-105">
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-500"></div>
                
                <div className="p-8">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    Performance Analytics
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/zn7jiygr_Gemini_Generated_Image_jj536ojj536ojj53_2-removebg-preview.png"
                      alt="Performance Analytics"
                      className="w-48 h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed">
                    Track your progress with detailed reports, identify strengths and weaknesses.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Track Growth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Courses Card - Mobile Only */}
      <section className="md:hidden max-w-7xl mx-auto px-4 py-8">
        {/* Single Professional Courses Card */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/courses')}
          className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 rounded-2xl p-6 shadow-xl cursor-pointer overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-white mb-1">Professional Courses</h3>
                <p className="text-white/90 text-sm font-semibold">Advance your career with premium certificate programs</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </section>

      {/* Main Content - Exam Cards - Hidden on Mobile */}
      <main className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Competitive Exam
          </h2>
          <p className="text-xl text-gray-600">
            Select your target exam to explore complete syllabus and start practicing
          </p>
        </div>

        {/* Exam Cards Grid */}
        {/* Defence Exams Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 mb-8 border-2 border-green-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_exam-multiverse/artifacts/l6agpvjq_Gemini_Generated_Image_8vwf428vwf428vwf_2-removebg-preview.png" 
                  alt="Defence Exams" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-green-800 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
                  Defence Exams
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎖️ Serve the Nation • Armed Forces & Paramilitary</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-green-200">
                ⚔️ NDA • Agniveer • CDS
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-200">
                🛡️ Army • Navy • Air Force
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-teal-200">
                🏆 CAPF & Paramilitary
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => ['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id)).map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-green-300 min-h-[420px] flex flex-col">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden flex-shrink-0`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center overflow-hidden line-clamp-3">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Admission Tests Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/9pbxgmoq_Gemini_Generated_Image_1zgyxl1zgyxl1zgy_2-removebg-preview.png" 
                  alt="Admission Tests" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Admission Tests
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎓 Gateway to Excellence • Professional Entrance Exams</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-purple-200">
                ⚡ JEE • NEET • GATE
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-blue-200">
                🎯 CAT • CLAT • CUET
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-indigo-200">
                🌟 Engineering • Medical • Management
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'Admission Tests').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-purple-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>


        {/* Banking Examinations Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl p-8 mb-8 border-2 border-indigo-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/dgbp1l60_Gemini_Generated_Image_be1xs8be1xs8be1x_2-removebg-preview.png" 
                  alt="Banking Examinations" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent">
                  Banking Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🏦 Financial Excellence • Banking & Financial Services</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-indigo-200">
                💼 IBPS PO • Clerk • SO
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-blue-200">
                🏛️ SBI PO • Clerk
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-cyan-200">
                💰 RBI • NABARD
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'Banking Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-indigo-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* UPSC Examinations Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-3xl p-8 mb-8 border-2 border-amber-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/lwzydz67_Gemini_Generated_Image_69zrpn69zrpn69zr_2-removebg-preview.png" 
                  alt="UPSC Examinations" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 bg-clip-text text-transparent">
                  UPSC Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🇮🇳 Nation Building • Union Public Service Commission</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-amber-200">
                👔 Civil Services Exam
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-orange-200">
                📊 IES • ISS • EPFO
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-red-200">
                🏛️ IAS • IPS • IFS
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'UPSC Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-amber-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SSC Examinations Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 rounded-3xl p-8 mb-8 border-2 border-red-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepchamp/artifacts/37tv8za2_Gemini_Generated_Image_6rtg7l6rtg7l6rtg_2-removebg-preview.png" 
                  alt="SSC Examinations" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-red-700 via-rose-700 to-pink-700 bg-clip-text text-transparent">
                  SSC Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">💼 Government Career • Staff Selection Commission</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-red-200">
                📝 CGL • CHSL
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-rose-200">
                🛡️ GD Constable
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-pink-200">
                ✍️ Stenographer
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'SSC Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-red-300">
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Teaching Examinations Section - Enhanced UI */}
        <div className="mb-16">
          {/* Unique Header with Gradient Background */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 mb-8 border-2 border-emerald-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src="https://customer-assets.emergentagent.com/job_prepninja-exams/artifacts/pv7esjzw_IMG_1360-removebg-preview.png" 
                  alt="Teaching Examinations" 
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Teaching Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🎓 Shape Future Minds • Teaching Eligibility & Recruitment</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-200">
                ✨ DSSB • KVS • CTET
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-teal-200">
                📚 Primary • Secondary • Higher Education
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-cyan-200">
                🏆 Delhi • Central • State Level
              </span>
            </div>
          </motion.div>

          {/* Enhanced Card Grid with Unique Styling */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'Teaching Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                {/* Card Content */}
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-emerald-300">
                  {/* Header with Gradient */}
                  <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden`}>
                    {/* Animated Decorative Elements */}
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    
                    {/* Icon & Title */}
                    <div className="relative text-white">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {exam.icon.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl">{exam.icon}</div>
                        )}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                      <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                    </div>
                  </div>
                
                  {/* Simplified Card Body */}
                  <div className="p-6">
                    <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center">{exam.description}</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Language Proficiency Tests - Game Mode Section */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-8 mb-8 border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-3xl">🎮</span>
              </motion.div>
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                  Language Proficiency Tests
                </h3>
                <p className="text-gray-600 text-lg font-medium mt-1">
                  Play, Compete & Master Languages! 🚀
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Spanish Language Legends */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-orange-400"
              onClick={() => navigate('/exam/SPANISH')}
            >
              <div className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">Quick Play</span>
                </div>
                <div className="text-5xl mb-2">🎮</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Spanish Legends
                </h4>
                <p className="text-white/90 text-sm">Earn gems & compete!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* French Quest */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-blue-400"
              onClick={() => navigate('/exam/FRENCH')}
            >
              <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">5 Min Rounds</span>
                </div>
                <div className="text-5xl mb-2">🎯</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  French Quest
                </h4>
                <p className="text-white/90 text-sm">Word battles await!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Tamil Trivia Blast */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-amber-400"
              onClick={() => navigate('/exam/TAMIL')}
            >
              <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">Quick Play</span>
                </div>
                <div className="text-5xl mb-2">🚀</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Tamil Trivia Blast
                </h4>
                <p className="text-white/90 text-sm">Challenge friends!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-amber-500 to-red-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Telugu Word Warriors */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-teal-400"
              onClick={() => navigate('/exam/TELUGU')}
            >
              <div className="bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">Quick Play</span>
                </div>
                <div className="text-5xl mb-2">⚔️</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Telugu Warriors
                </h4>
                <p className="text-white/90 text-sm">Battle & collect!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Kannada Champions */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-green-400"
              onClick={() => navigate('/exam/KANNADA')}
            >
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">5 Min Rounds</span>
                </div>
                <div className="text-5xl mb-2">🏆</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Kannada Champions
                </h4>
                <p className="text-white/90 text-sm">Win badges!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Chinese Quest */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-red-400"
              onClick={() => navigate('/exam/CHINESE')}
            >
              <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">Quick Play</span>
                </div>
                <div className="text-5xl mb-2">🐉</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Chinese Quest
                </h4>
                <p className="text-white/90 text-sm">Solve puzzles!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Japanese Ninja */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-pink-400"
              onClick={() => navigate('/exam/JAPANESE')}
            >
              <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">5 Min Rounds</span>
                </div>
                <div className="text-5xl mb-2">🥷</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Japanese Ninja
                </h4>
                <p className="text-white/90 text-sm">Master missions!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>

            {/* Korean K-Pop */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent hover:border-purple-400"
              onClick={() => navigate('/exam/KOREAN')}
            >
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 relative">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-bold">Quick Play</span>
                </div>
                <div className="text-5xl mb-2">🎤</div>
                <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">
                  Korean K-Pop
                </h4>
                <p className="text-white/90 text-sm">Level up like a star!</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">💎 Gems</span>
                  <span className="font-bold text-purple-600">100+</span>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-500 to-rose-500 text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
                  🎯 Play Now
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Other Competitive Exams Section - Enhanced */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 rounded-3xl p-8 mb-8 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-gray-600 via-slate-600 to-zinc-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BookOpen className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-gray-700 via-slate-700 to-zinc-700 bg-clip-text text-transparent">
                  Other Competitive Exams
                </h2>
                <p className="text-gray-700 font-medium text-lg">📖 More Opportunities • Agriculture & State Services</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                🌾 Agriculture Exams
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                📋 RPSC & State Exams
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-zinc-200">
                🎯 Specialized Services
              </span>
            </div>
          </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.filter(exam => 
            !['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id) && 
            !['Admission Tests', 'Banking Examinations', 'UPSC Examinations', 'SSC Examinations', 'Teaching Examinations', 'Language Proficiency Tests', 'Language Games'].includes(exam.category)
          ).map((exam, index) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/exam/${exam.id}`)}
              className="group relative"
              data-testid={`exam-card-${exam.id}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-slate-600 to-zinc-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-gray-300 min-h-[420px] flex flex-col">
                <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden flex-shrink-0`}>
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  ></motion.div>
                  <motion.div 
                    className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  ></motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  
                  <div className="relative text-white">
                    <motion.div 
                      className="mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {exam.icon.startsWith('http') ? (
                        <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                          <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                      ) : (
                        <div className="text-6xl">{exam.icon}</div>
                      )}
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
                    <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
                  </div>
                </div>
              
                <div className="p-6">
                  <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center overflow-hidden line-clamp-3">{exam.description}</p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold">{exam.total_questions} Qs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="font-semibold">{exam.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>

        {/* How Ceibaa Works Section - Compact Version */}
        <div className="mt-12 relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Background Image - More Visible, Positioned to Show Faces */}
          <div className="absolute inset-0">
            <img 
              src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/96rls157_Gemini_Generated_Image_swqa8zswqa8zswqa%202.png"
              alt="Ceibaa Background"
              className="w-full h-full object-cover object-center opacity-90"
            />
            {/* Lighter Gradient Overlay - Only on sides */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-transparent to-purple-900/60"></div>
            {/* Bottom gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-indigo-900/70 to-transparent"></div>
          </div>

          {/* Content - More Compact */}
          <div className="relative z-10 py-8 px-8 text-white">
            <div className="text-center max-w-6xl mx-auto">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-black mb-2 drop-shadow-2xl"
                style={{
                  textShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)'
                }}
              >
                How Ceibaa Works ✨
              </motion.h3>
              <p className="text-lg text-white font-bold mb-8 drop-shadow-xl">
                Your journey to exam success in 3 simple steps
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-6">
                {/* Step 1 - Compact */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="relative group"
                >
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-cyan-400">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                        <span className="text-xl font-black text-white">1</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-4xl mb-2">🎯</div>
                      <h4 className="text-lg font-black mb-2 text-cyan-600">Select Your Exam</h4>
                      <p className="text-gray-800 text-sm leading-relaxed font-bold">
                        Choose from 38+ competitive exams
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 2 - Compact */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="relative group"
                >
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-purple-400">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-br from-purple-400 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                        <span className="text-xl font-black text-white">2</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-4xl mb-2">📚</div>
                      <h4 className="text-lg font-black mb-2 text-purple-600">Pick Your Topic</h4>
                      <p className="text-gray-800 text-sm leading-relaxed font-bold">
                        Topic-wise practice & tracking
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 3 - Compact */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="relative group"
                >
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-orange-400">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-br from-orange-400 to-red-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                        <span className="text-xl font-black text-white">3</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-4xl mb-2">⚔️</div>
                      <h4 className="text-lg font-black mb-2 text-orange-600">Battle & Win</h4>
                      <p className="text-gray-800 text-sm leading-relaxed font-bold">
                        Compete live or practice solo
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* CTA Button - Compact */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <button
                  onClick={() => {
                    const examsSection = document.querySelector('main');
                    examsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 px-8 py-4 rounded-full font-black text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 inline-flex items-center gap-2 text-white border-4 border-white"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  🚀 Start Your Battle Journey
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center py-2 px-4 text-indigo-600"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate('/chapter-tests')}
            className="flex flex-col items-center py-2 px-4 text-gray-500"
          >
            <Zap className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Practice</span>
          </button>
          <button
            onClick={() => navigate('/victory-lane')}
            className="flex flex-col items-center py-2 px-4 text-gray-500"
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Victory</span>
          </button>
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            className="flex flex-col items-center py-2 px-4 text-gray-500"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">{isLoggedIn ? 'Profile' : 'Login'}</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => navigate('/join-room')}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      <Footer />
    </div>
  );
};

export default Home;