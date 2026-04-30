import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp, BookOpen, FileText, Clock, Gamepad2, Search, Home as HomeIcon, Plus, ChevronRight, ChevronDown, ArrowUpRight, Briefcase, Sparkles, GraduationCap, Stethoscope, Shield, Landmark, School, Building2, Building, ShieldAlert, Map, Languages, BadgeCheck } from 'lucide-react';
import axios from 'axios';
import SEO from '../components/SEO';
import CeibaaLogo from '../components/CeibaaLogo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import { AnimatePresence } from 'framer-motion';

const API_URL = window.location.origin;

const Home = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBattlesCount, setLiveBattlesCount] = useState(() => 2000 + Math.floor(Math.random() * 1200));

  useEffect(() => {
    fetchExams();
    checkAuth();
  }, []);

  // Keep the "Active Battles" number lively — fluctuates between 2000–3500 every 4s
  useEffect(() => {
    const tick = () => {
      setLiveBattlesCount((prev) => {
        const delta = Math.floor(Math.random() * 41) - 20; // -20 … +20
        const next = prev + delta;
        if (next < 2000) return 2000 + Math.floor(Math.random() * 60);
        if (next > 3500) return 3500 - Math.floor(Math.random() * 60);
        return next;
      });
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
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

  /*
   * ══════════════════════════════════════════════════════════════════════════════
   * 📋 ADDING A NEW EXAM CATEGORY - STEP BY STEP GUIDE
   * ══════════════════════════════════════════════════════════════════════════════
   * 
   * When adding a NEW exam to /app/backend/exam_data.py:
   * 
   * STEP 1: Add exam to exam_data.py (REQUIRED)
   *    - Add exam entry with: name, full_name, description, icon, color, 
   *      total_questions, duration, category, syllabus_topics
   *    - The "category" field determines which section it appears in
   * 
   * STEP 2: If using a NEW category (not existing), update this file:
   *    a) Add to 'categories' array below (for mobile filter buttons)
   *    b) Add to 'categoryMap' in getFilteredExams() function
   *    c) Add a desktop section (search for "Examinations Section" to see examples)
   * 
   * STEP 3: Admin Panel will auto-update (reads from /api/exam-metadata)
   * 
   * EXISTING CATEGORIES (no changes needed if using these):
   *    - Admission Tests, Medical, Defence, Banking Examinations
   *    - Teaching Examinations, SSC Examinations, UPSC Examinations
   *    - RSMSSB Examinations, Language Proficiency Tests
   * 
   * ══════════════════════════════════════════════════════════════════════════════
   */

  // Category filter buttons for mobile and desktop
  const categories = [
    { id: 'admission', label: 'Admission Tests', icon: '🎓', color: 'from-violet-600 to-purple-600' },
    { id: 'medical', label: 'Medical', icon: '🏥', color: 'from-emerald-600 to-teal-600', image: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png' },
    { id: 'defence', label: 'Defence', icon: '🎖️', color: 'from-green-700 to-emerald-700', image: 'https://cdn-icons-png.flaticon.com/512/6142/6142033.png' },
    { id: 'banking', label: 'Banking', icon: '🏦', color: 'from-rose-600 to-red-600', image: 'https://cdn-icons-png.flaticon.com/512/3696/3696141.png' },
    { id: 'university', label: 'University & Degree', icon: '🎓', color: 'from-amber-600 to-yellow-600', image: 'https://customer-assets.emergentagent.com/job_quizmaster-299/artifacts/ndexgxo7_image.png' },
    { id: 'teaching', label: 'Teaching Examinations', icon: '👨‍🏫', color: 'from-blue-600 to-indigo-600' },
    { id: 'ssc', label: 'SSC Examinations', icon: '👨🏻‍✈️', color: 'from-cyan-600 to-blue-600' },
    { id: 'upsc', label: 'UPSC Examinations', icon: '💼', color: 'from-purple-600 to-pink-600' },
    { id: 'uppsc', label: 'UPPSC', icon: '🏢', color: 'from-orange-600 to-red-600' },
    { id: 'csbc', label: 'CSBC', icon: '🚔', color: 'from-red-600 to-pink-600' },
    { id: 'rsmssb', label: 'RSMSSB', icon: '🏜️', color: 'from-amber-600 to-orange-600' },
    { id: 'language', label: 'Language Proficiency Tests', icon: '🗣️', color: 'from-teal-600 to-green-600', image: 'https://customer-assets.emergentagent.com/job_quizmaster-299/artifacts/fcifoi4k_image.png' },
  ];

  // Skill Drill Classes (CBSE)
  const skillDrillClasses = [
    { id: 'class-6', name: 'Class 6', icon: '📗', color: 'from-cyan-500 to-blue-500', subjects: 'Science, Maths, SST' },
    { id: 'class-7', name: 'Class 7', icon: '📘', color: 'from-blue-500 to-indigo-500', subjects: 'Science, Maths, SST' },
    { id: 'class-8', name: 'Class 8', icon: '📙', color: 'from-indigo-500 to-purple-500', subjects: 'Science, Maths, SST' },
    { id: 'class-9', name: 'Class 9', icon: '📕', color: 'from-purple-500 to-pink-500', subjects: 'Science, Maths, SST' },
    { id: 'class-10', name: 'Class 10', icon: '📓', color: 'from-pink-500 to-rose-500', subjects: 'Science, Maths, SST' },
    { id: 'class-11/science', name: 'Class 11 Science', icon: '🔬', color: 'from-emerald-500 to-teal-500', subjects: 'Physics, Chemistry, Maths/Bio' },
    { id: 'class-11/commerce', name: 'Class 11 Commerce', icon: '📊', color: 'from-amber-500 to-orange-500', subjects: 'Accounts, Economics, Business' },
    { id: 'class-11/humanities', name: 'Class 11 Humanities', icon: '📜', color: 'from-violet-500 to-purple-500', subjects: 'History, Geography, Political Sc.' },
    { id: 'class-12/science', name: 'Class 12 Science', icon: '🔬', color: 'from-teal-500 to-cyan-500', subjects: 'Physics, Chemistry, Maths/Bio' },
    { id: 'class-12/commerce', name: 'Class 12 Commerce', icon: '📊', color: 'from-orange-500 to-red-500', subjects: 'Accounts, Economics, Business' },
    { id: 'class-12/humanities', name: 'Class 12 Humanities', icon: '📜', color: 'from-purple-500 to-pink-500', subjects: 'History, Geography, Political Sc.' },
  ];
  
  // Categories for mobile - exclude Teaching on mobile
  const mobileCategories = categories.filter(cat => cat.id !== 'teaching');

  // Mobile: Lucide icon map for refreshed category card design
  const mobileCategoryIconMap = {
    admission: GraduationCap,
    medical: Stethoscope,
    defence: Shield,
    banking: Landmark,
    university: School,
    ssc: Briefcase,
    upsc: Building2,
    uppsc: Building,
    csbc: ShieldAlert,
    rsmssb: Map,
    language: Languages,
    teaching: BookOpen,
  };

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
        university: { ids: ['LLB', 'BCOM', 'BCA'], categories: ['University & Degree Exams', 'University & Degree'] },
        teaching: { ids: ['CTET', 'UGC_NET'], categories: ['Teaching Examinations', 'Teaching'] },
        ssc: { ids: ['SSC_CGL', 'SSC_CHSL'], categories: ['SSC Examinations'] },
        upsc: { ids: ['UPSC'], categories: ['UPSC Examinations'] },
        uppsc: { ids: ['UP_Police_Constable', 'UPTET'], categories: ['UPPSC Examinations', 'UPPSC'] },
        csbc: { ids: ['Bihar_Police_Constable'], categories: ['CSBC Examinations', 'CSBC'] },
        rsmssb: { ids: ['RSMSSB_Patwari', 'Rajasthan_Police_Constable'], categories: ['RSMSSB Examinations', 'RSMSSB'] },
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 pb-0 md:pb-0">
      {/* SEO Component for Home Page */}
      <SEO 
        title="Ceibaa 2026 - India's #1 Social Learning & Career Platform"
        description="FREE 1M+ MCQ's. Live 1v1 Duels. Multiplayer Rooms. The Victory Lane (Post MCQ's, Videos and Photos. Courses. Interships and Jobs by Top Companies"
      />
      
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Mobile Hero Section — matches reference mock */}
      <style>
        {`
          @keyframes ceibaa-pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.8); }
          }
          @keyframes ceibaa-rise {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ceibaa-rise-1 { animation: ceibaa-rise .5s ease-out both; animation-delay: .05s; }
          .ceibaa-rise-2 { animation: ceibaa-rise .5s ease-out both; animation-delay: .18s; }
          .ceibaa-rise-3 { animation: ceibaa-rise .5s ease-out both; animation-delay: .32s; }
          .ceibaa-rise-4 { animation: ceibaa-rise .5s ease-out both; animation-delay: .46s; }
          .ceibaa-dot { animation: ceibaa-pulse-dot 1.3s ease-in-out infinite; }
          .ceibaa-dots-bg {
            background-image: radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px);
            background-size: 14px 14px;
          }
        `}
      </style>
      <div
        className="md:hidden relative overflow-hidden"
        style={{ backgroundColor: '#fdf9ee' }}
        data-testid="mobile-home-hero"
      >
        {/* Subtle dotted pattern (right side) */}
        <div
          className="absolute top-4 right-0 w-40 h-44 ceibaa-dots-bg opacity-60 pointer-events-none"
          aria-hidden="true"
        ></div>

        {/* Headline */}
        <div className="relative px-5 pt-7 pb-4">
          <h1 className="tracking-tight" data-testid="mobile-home-headline">
            <span
              className="ceibaa-rise-1 block text-[34px] font-black leading-[1.05]"
              style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
            >
              The Badge That Never Fails.
            </span>
            <span
              className="ceibaa-rise-2 block mt-3 text-[15px] font-semibold leading-[1.45]"
              style={{ color: '#0f172a' }}
            >
              In the Ceibaa Arena, every battle builds a bridge to your future. Earn your badge and unlock opportunities beyond the exam hall.
            </span>
            <span
              className="ceibaa-rise-3 block mt-3 text-[13px] font-medium italic"
              style={{ color: '#64748b', fontFamily: 'Georgia, serif' }}
            >
              Real-world ready, Arena tested.
            </span>
          </h1>
        </div>

        {/* CTA pair — purple "Get Hired" + gold "Train" */}
        <div className="relative px-5 pb-4 ceibaa-rise-4">
          <div className="grid grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="col-span-3 relative text-left rounded-2xl px-4 py-4 shadow-[0_10px_24px_-10px_rgba(76,29,149,0.65)] active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#4c1d95', color: '#ffffff' }}
              data-testid="mobile-home-get-hired-btn"
            >
              <span
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#ddd6fe' }}
              >
                Career Pathway:
              </span>
              <span className="flex items-center gap-1.5 text-[20px] font-black leading-tight">
                Get Hired <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
              </span>
              <Briefcase
                className="absolute top-3 right-3 w-6 h-6 opacity-90"
                style={{ color: '#ede9fe' }}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                const drill = document.getElementById('skill-drill-section');
                if (drill) {
                  drill.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  navigate('/chapter-tests');
                }
              }}
              className="col-span-2 relative text-left rounded-2xl px-4 py-4 shadow-[0_10px_24px_-10px_rgba(217,180,86,0.6)] active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#efc868', color: '#1f1505' }}
              data-testid="mobile-home-train-btn"
            >
              <span
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#6b4e0d' }}
              >
                Skill Forge:
              </span>
              <span className="flex items-center gap-1.5 text-[20px] font-black leading-tight">
                CBSE
              </span>
              <Sparkles
                className="absolute top-3 right-3 w-5 h-5"
                style={{ color: '#6b4e0d' }}
                strokeWidth={2.25}
              />
            </button>
          </div>
        </div>

        {/* Search pill */}
        <div className="relative px-5 pb-3">
          <form onSubmit={handleSearch} data-testid="mobile-home-search-form">
            <div
              className="relative flex items-center rounded-full px-4 py-3 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)]"
              style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }}
            >
              <Search className="w-4 h-4 mr-3" style={{ color: '#64748b' }} strokeWidth={2.25} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Exams, Skills, Mentors..."
                className="flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
                style={{ color: '#0f172a' }}
                data-testid="mobile-home-search-input"
              />
            </div>
          </form>
        </div>

        {/* Stats strip — Exams / Questions / Active Battles Live */}
        <div className="relative px-5 pb-6">
          <div
            className="rounded-2xl px-4 py-3 shadow-[0_6px_18px_-12px_rgba(15,23,42,0.3)]"
            style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }}
            data-testid="mobile-home-stats"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}
                >
                  Exams:
                </p>
                <p className="text-[20px] font-black leading-tight" style={{ color: '#0f172a' }}>
                  38<span style={{ color: '#4c1d95' }}>+</span>
                </p>
              </div>
              <div className="border-l border-r px-2" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}
                >
                  Questions:
                </p>
                <p className="text-[20px] font-black leading-tight" style={{ color: '#0f172a' }}>
                  50K<span style={{ color: '#4c1d95' }}>+</span>
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}
                >
                  Active Battles:
                </p>
                <p
                  className="text-[20px] font-black leading-tight flex items-center gap-1.5"
                  style={{ color: '#0f172a' }}
                  data-testid="mobile-home-live-battles"
                >
                  {liveBattlesCount.toLocaleString('en-IN')}
                  <span
                    className="ceibaa-dot inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#ef4444' }}
                  ></span>
                  <span className="text-[13px] font-bold" style={{ color: '#ef4444' }}>
                    Live
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter - Grid Layout with Drawer Effect - Teaching hidden on mobile */}
      <div className="md:hidden sticky top-16 z-30 border-b" style={{ backgroundColor: '#fdf9ee', borderColor: 'rgba(15,23,42,0.08)' }}>
        <div className="py-3 px-3">
          {/* Group categories into rows of 3 */}
          {(() => {
            const rows = [];
            for (let i = 0; i < mobileCategories.length; i += 3) {
              rows.push(mobileCategories.slice(i, i + 3));
            }
            
            // Find which row contains the active category
            const activeRowIndex = activeCategory 
              ? rows.findIndex(row => row.some(cat => cat.id === activeCategory))
              : -1;
            
            return rows.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {/* Category Row */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {row.map(cat => {
                    const IconComp = mobileCategoryIconMap[cat.id] || BadgeCheck;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(isActive ? '' : cat.id)}
                        data-testid={`mobile-category-${cat.id}`}
                        className="relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-[0.97]"
                        style={{
                          backgroundColor: '#ffffff',
                          border: isActive ? '1.5px solid #4c1d95' : '1px solid rgba(15,23,42,0.08)',
                          boxShadow: isActive
                            ? '0 10px 24px -12px rgba(76,29,149,0.45)'
                            : '0 6px 14px -10px rgba(15,23,42,0.25)',
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center mb-2"
                          style={{ backgroundColor: isActive ? '#4c1d95' : '#ede9fe' }}
                        >
                          <IconComp
                            className="w-6 h-6"
                            strokeWidth={2}
                            style={{ color: isActive ? '#ffffff' : '#4c1d95' }}
                          />
                        </div>
                        <span
                          className="text-center text-[11px] font-bold leading-tight line-clamp-2"
                          style={{ color: '#0f172a' }}
                        >
                          {cat.label}
                        </span>
                        {isActive && (
                          <ChevronDown
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4"
                            style={{ color: '#4c1d95' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Drawer Panel - appears below the row containing active category */}
                <AnimatePresence>
                  {activeRowIndex === rowIndex && activeCategory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl p-3 mb-3" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 10px 24px -14px rgba(15,23,42,0.25)' }}>
                        {/* Category Header */}
                        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#4c1d95', color: '#ffffff' }}>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const ActiveIcon = mobileCategoryIconMap[activeCategory] || BadgeCheck;
                              return <ActiveIcon className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.2} />;
                            })()}
                            <div>
                              <h3 className="font-bold text-sm">{categories.find(c => c.id === activeCategory)?.label}</h3>
                              <p className="text-[11px]" style={{ color: '#ddd6fe' }}>{filteredExams.length} exams available</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Exam Cards */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {filteredExams.map((exam) => (
                            <div
                              key={exam.id}
                              onClick={() => navigate(`/exam/${exam.id}`)}
                              className="bg-white border border-gray-200 rounded-lg p-2.5 active:scale-98 transition-transform cursor-pointer flex items-center gap-2.5"
                            >
                              <div 
                                className={`bg-gradient-to-br ${exam.color} rounded-lg flex items-center justify-center shadow-sm`}
                                style={{ width: '2rem', height: '2rem', minWidth: '2rem' }}
                              >
                                {exam.icon?.startsWith('http') ? (
                                  <img src={exam.icon} alt={exam.name} className="w-4 h-4 object-contain" />
                                ) : (
                                  <span className="text-sm">{exam.icon}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-xs">{exam.name}</h4>
                                <p className="text-gray-500 text-[10px] truncate">{exam.full_name}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {filteredExams.length === 0 && (
                            <p className="text-center text-gray-500 py-4 text-sm">No exams in this category</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ));
          })()}
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

      {/* Mobile: Skill Drill - CBSE Classes Section */}
      {!searchQuery.trim() && !activeCategory && (
        <div id="skill-drill-section" className="md:hidden px-4 py-6" style={{ backgroundColor: '#fdf9ee' }} data-testid="mobile-skill-drill-section">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#efc868' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#6b4e0d' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[20px] font-black" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>Skill Drill — CBSE Classes</h2>
              <p className="text-[12px]" style={{ color: '#64748b' }}>Chapter-wise practice for all subjects</p>
            </div>
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
      
      {/* Desktop Banner Carousel - no gap after header */}
      <div className="hidden md:block">
        <HomeBannerCarousel />
      </div>
      
      {/* Welcome section is now integrated into HomeBannerCarousel */}

      {/* The Canopy Banner - Desktop Only */}
      <div className="hidden md:block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14v7"/>
                  <path d="M9 18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/>
                  <path d="M17 14.26V10a2 2 0 1 0-4 0v4.26"/>
                  <path d="M21 12a5 5 0 0 0-10 0"/>
                  <path d="M12 19a8 8 0 0 0 16 0"/>
                  <path d="M12 3v3"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 text-sm font-medium bg-white/10 px-2 py-0.5 rounded">NEW</span>
                  <h2 className="text-2xl font-bold">The Canopy</h2>
                </div>
                <p className="text-emerald-100 max-w-xl">
                  Grow your influence and earn! Unlock badges at 500 posts, media posting at 1K followers, and get <span className="font-semibold text-white">90% ad revenue</span> at 2.5K followers.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/earn')}
              className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-lg"
            >
              Start Growing
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* The Canopy Banner - Mobile Only */}
      <div 
        className="md:hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white mx-4 my-4 rounded-2xl overflow-hidden shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/earn')}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14v7"/>
                <path d="M9 18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/>
                <path d="M17 14.26V10a2 2 0 1 0-4 0v4.26"/>
                <path d="M21 12a5 5 0 0 0-10 0"/>
                <path d="M12 19a8 8 0 0 0 16 0"/>
                <path d="M12 3v3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-emerald-200 text-xs font-medium bg-white/10 px-1.5 py-0.5 rounded">NEW</span>
                <h2 className="text-base font-bold">The Canopy</h2>
              </div>
              <p className="text-emerald-100 text-xs leading-snug">
                Earn badges, unlock media posting & get <span className="font-semibold text-white">90% ad revenue!</span>
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
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
            <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/board')}>
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
      <section className="py-8 md:py-16 bg-gradient-to-b from-white via-indigo-50/30 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              UNLOCKING YOUR EXAM POTENTIAL
            </h2>
            <p className="text-sm md:text-xl text-gray-600 font-medium">
              Preparing global learners for competitive success
            </p>
          </div>

          {/* Three Feature Cards - Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {/* Card 1: Real-Time Mock Tests */}
            <div className="group transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => navigate('/board')}>
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
                
                <div className="p-4 md:p-8">
                  {/* Title */}
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Real-Time Mock Tests
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/dyz1aut8_Gemini_Generated_Image_pzpy3hpzpy3hpzpy_2-removebg-preview.png"
                      alt="Real-Time Mock Tests"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Experience authentic exam simulations with timed sections, just like the real thing.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-3 md:mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                      <span className="text-xs md:text-sm font-semibold text-green-700">Timed Practice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Personalized Practice Plans */}
            <div className="group transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => navigate('/board')}>
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500"></div>
                
                <div className="p-4 md:p-8">
                  {/* Title */}
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Personalized Plans
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/vi47czpu_Gemini_Generated_Image_fduhiefduhiefduh_2-removebg-preview.png"
                      alt="Personalized Practice Plans"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Get custom study schedules and recommended tests based on your performance.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-3 md:mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
                      <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                      <span className="text-xs md:text-sm font-semibold text-purple-700">Smart Study</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: In-Depth Performance Analytics */}
            <div className="group transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => navigate('/board')}>
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-500"></div>
                
                <div className="p-4 md:p-8">
                  {/* Title */}
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Performance Analytics
                  </h3>
                  
                  {/* Character - Optimized */}
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/zn7jiygr_Gemini_Generated_Image_jj536ojj536ojj53_2-removebg-preview.png"
                      alt="Performance Analytics"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Track your progress with detailed reports, identify strengths and weaknesses.
                  </p>
                  
                  {/* Icon Badge */}
                  <div className="mt-3 md:mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                      <span className="text-xs md:text-sm font-semibold text-blue-700">Track Growth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Courses Card - Mobile Only */}
      <section className="md:hidden max-w-7xl mx-auto px-4 pt-4 pb-2">
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
                  src="https://cdn-icons-png.flaticon.com/512/6142/6142033.png" 
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
                  src="https://cdn-icons-png.flaticon.com/512/3696/3696141.png" 
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

        {/* UPPSC Examinations Section - Uttar Pradesh State Exams */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50 via-red-50 to-rose-50 rounded-3xl p-8 mb-8 border-2 border-orange-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-3xl">🏢</span>
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-orange-700 via-red-700 to-rose-700 bg-clip-text text-transparent">
                  UPPSC Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🏛️ Uttar Pradesh State Government Jobs • UPPSC Board</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-orange-200">
                👮 UP Police • Constable
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-red-200">
                📖 Hindi • GK • Reasoning
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-rose-200">
                🔢 Numerical Ability
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'UPPSC Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-orange-300">
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
                        {exam.icon?.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl text-center">{exam.icon || '🏢'}</div>
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
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">{exam.total_questions} Qs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CSBC Examinations Section - Bihar State Exams */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 rounded-3xl p-8 mb-8 border-2 border-red-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-red-600 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-3xl">🚔</span>
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-red-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                  CSBC Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🏛️ Bihar State Government Jobs • Central Selection Board of Constable</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-red-200">
                👮 Bihar Police • Constable
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-pink-200">
                📖 Bihar GK • Hindi • English
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-rose-200">
                🔬 Science • Social Studies
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'CSBC Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-600 to-rose-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
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
                        {exam.icon?.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl text-center">{exam.icon || '🚔'}</div>
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
                        <Clock className="w-4 h-4 text-pink-600" />
                        <span className="font-semibold">{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RSMSSB Examinations Section - Rajasthan State Exams */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-3xl p-8 mb-8 border-2 border-amber-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-3xl">🏜️</span>
              </motion.div>
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-amber-700 via-orange-700 to-yellow-700 bg-clip-text text-transparent">
                  RSMSSB Examinations
                </h2>
                <p className="text-gray-700 font-medium text-lg">🏛️ Rajasthan State Government Jobs • RSMSSB Board</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-amber-200">
                📋 Patwari • Revenue
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-orange-200">
                🏜️ Rajasthan GK • Culture
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-sm border border-yellow-200">
                💻 Computer • Reasoning
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.filter(exam => exam.category === 'RSMSSB Examinations').map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
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
                        {exam.icon?.startsWith('http') ? (
                          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                            <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                          </div>
                        ) : (
                          <div className="text-6xl text-center">{exam.icon || '🏜️'}</div>
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

        {/* Other Competitive Exams Section - Enhanced - Only show if there are exams */}
        {exams.filter(exam => 
          !['NDA', 'Agniveer', 'CDS', 'CAPF'].includes(exam.id) && 
          !['Admission Tests', 'Banking Examinations', 'UPSC Examinations', 'SSC Examinations', 'Teaching Examinations', 'Language Proficiency Tests', 'Language Games', 'UPPSC Examinations', 'CSBC Examinations', 'RSMSSB Examinations', 'Defence Exams', 'Government Jobs', 'Medical Entrance'].includes(exam.category)
        ).length > 0 && (
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
            !['Admission Tests', 'Banking Examinations', 'UPSC Examinations', 'SSC Examinations', 'Teaching Examinations', 'Language Proficiency Tests', 'Language Games', 'UPPSC Examinations', 'CSBC Examinations', 'RSMSSB Examinations', 'Defence Exams', 'Government Jobs', 'Medical Entrance'].includes(exam.category)
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
        )}

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