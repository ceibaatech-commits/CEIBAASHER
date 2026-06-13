import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp, BookOpen, FileText, Clock, Gamepad2, Search, Home as HomeIcon, Plus, ChevronRight, ChevronDown, ArrowUpRight, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import CeibaaLogo from '../components/CeibaaLogo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import useHomeData, { CATEGORIES, SKILL_DRILL_CLASSES } from '../hooks/useHomeData';
import HomeDesktopSections from '../components/home/HomeDesktopSections';

const Home = () => {
  const navigate = useNavigate();
  const {
    exams, loading, user, isLoggedIn,
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    liveBattlesCount,
    handleLogin, handleLogout, handleSearch, getFilteredExams,
  } = useHomeData();

  const filteredExams = getFilteredExams();
  const skillDrillClasses = SKILL_DRILL_CLASSES;
  const categories = CATEGORIES;
  const mobileCategories = CATEGORIES;

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
          @keyframes ceibaa-morph-in {
            0% { opacity: 0; filter: blur(14px); transform: translateY(20px) scale(1.45); letter-spacing: 0.18em; }
            55% { opacity: 1; filter: blur(2px); transform: translateY(0) scale(1); letter-spacing: -0.04em; }
            100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); letter-spacing: -0.02em; }
          }
          .ceibaa-morph-word {
            display: inline-block;
            animation: ceibaa-morph-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes ceibaa-elastic-in {
            0%   { opacity: 0; transform: translateY(28px) scale(0.3); }
            55%  { opacity: 1; transform: translateY(-5px) scale(1.18); }
            72%  { transform: translateY(2px) scale(0.94); }
            86%  { transform: translateY(-1px) scale(1.04); }
            100% { transform: translateY(0) scale(1); }
          }
          .ceibaa-elastic-word {
            display: inline-block;
            animation: ceibaa-elastic-in 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .ceibaa-badge-word {
            position: relative;
            color: #7f1d1d;
            isolation: isolate;
            white-space: nowrap;
          }
          @keyframes ceibaa-marker-paint {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .ceibaa-badge-word::after {
            content: '';
            position: absolute;
            left: -2px;
            right: -2px;
            bottom: 4px;
            height: 8px;
            background: #f5c451;
            border-radius: 2px;
            z-index: -1;
            transform-origin: left center;
            transform: scaleX(0);
            opacity: 0.85;
            animation: ceibaa-marker-paint 0.55s ease-out 1.05s forwards;
          }
          @keyframes ceibaa-marker {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .ceibaa-marker-line {
            display: inline-block;
            transform-origin: left center;
            animation: ceibaa-marker .55s ease-out both;
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
              className="block text-[34px] font-black leading-[1.05]"
              style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
              data-testid="mobile-home-headline-typed"
            >
              {['The', 'Badge', 'That', 'Never', 'Fails.'].map((word, i, arr) => {
                const isBadge = word === 'Badge';
                return (
                  <React.Fragment key={`hw-${i}`}>
                    <span
                      className={`ceibaa-morph-word${isBadge ? ' ceibaa-badge-word' : ''}`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      {word}
                    </span>
                    {i < arr.length - 1 ? ' ' : ''}
                  </React.Fragment>
                );
              })}
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
              onClick={() => navigate('/recruiter')}
              className="col-span-2 relative text-left rounded-2xl px-4 py-4 shadow-[0_10px_24px_-10px_rgba(217,180,86,0.6)] active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#efc868', color: '#1f1505' }}
              data-testid="mobile-home-hire-with-us-btn"
            >
              <span
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#6b4e0d' }}
              >
                Recruiters:
              </span>
              <span className="flex items-center gap-1.5 text-[20px] font-black leading-tight">
                Hire With Us
              </span>
              <img
                src="/sarvam-logo-dark.svg"
                alt="Ceibaa"
                aria-hidden="true"
                className="absolute top-3 right-3 w-5 h-5 object-contain pointer-events-none"
                data-testid="hire-with-us-logo"
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
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Inline search results dropdown */}
          <AnimatePresence>
            {searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute left-5 right-5 z-50 mt-2 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(15,23,42,0.10)',
                  boxShadow: '0 16px 40px -12px rgba(15,23,42,0.28)',
                  transformOrigin: 'top center',
                }}
                data-testid="mobile-home-search-dropdown"
              >
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#4c1d95' }}>
                  <Search className="w-4 h-4 text-white/70" />
                  <span className="text-white font-bold text-sm flex-1">
                    {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                  </span>
                </div>

                {/* Result list */}
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {filteredExams.length > 0 ? filteredExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => { setSearchQuery(''); navigate(`/exam/${exam.id}`); }}
                      className="flex items-center gap-3 px-4 py-3 active:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`bg-gradient-to-br ${exam.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}
                        style={{ width: '2.25rem', height: '2.25rem' }}
                      >
                        {exam.icon?.startsWith('http') ? (
                          <img src={exam.icon} alt={exam.name} className="w-5 h-5 object-contain" />
                        ) : (
                          <span className="text-base">{exam.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{exam.name}</p>
                        <p className="text-gray-500 text-[11px] truncate">{exam.full_name}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-6 text-sm">No exams found for &ldquo;{searchQuery}&rdquo;</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Subheading card — moved here, below the stats strip */}
        <div className="relative px-5 pb-6">
          <div
            className="rounded-2xl relative overflow-hidden"
            style={{
              backgroundColor: '#fffdf6',
              border: '1px solid rgba(127,29,29,0.18)',
              boxShadow: '0 10px 24px -16px rgba(15,23,42,0.18)',
            }}
            data-testid="mobile-home-subheading-card"
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: '#7f1d1d' }}
              aria-hidden="true"
            ></span>
            <p className="pl-5 pr-4 py-3.5 text-[14px] font-semibold leading-[1.55]" style={{ color: '#1e293b' }}>
              In the{' '}
              <span style={{ color: '#7f1d1d', fontWeight: 800 }}>Ceibaa Arena</span>, every battle{' '}
              <span className="relative inline-block">
                <span className="relative z-10">builds a bridge</span>
                <span
                  className="ceibaa-marker-line absolute left-0 right-0 bottom-0.5 h-2 -z-0 opacity-80"
                  style={{ background: '#f5c451', borderRadius: '2px', animationDelay: '2.0s' }}
                  aria-hidden="true"
                ></span>
              </span>{' '}to your future. Earn your{' '}
              <span style={{ color: '#7f1d1d', fontWeight: 800 }}>badge</span>{' '}and unlock{' '}
              <span style={{ color: '#7f1d1d', fontWeight: 800 }}>opportunities</span>{' '}beyond the exam hall.
            </p>
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
                          style={{ backgroundColor: isActive ? '#4c1d95' : '#f5e6cb' }}
                        >
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.label}
                              className="w-7 h-7 object-contain"
                              style={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }}
                            />
                          ) : (
                            <span className="text-[22px] leading-none" aria-hidden="true">
                              {cat.icon}
                            </span>
                          )}
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
                              const activeCat = categories.find(c => c.id === activeCategory);
                              if (!activeCat) return null;
                              return activeCat.image ? (
                                <img
                                  src={activeCat.image}
                                  alt={activeCat.label}
                                  className="w-6 h-6 object-contain"
                                  style={{ filter: 'brightness(0) invert(1)' }}
                                />
                              ) : (
                                <span className="text-lg leading-none" aria-hidden="true">{activeCat.icon}</span>
                              );
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



      {/* Mobile: Skill Drill - CBSE Classes Section */}
      {!searchQuery.trim() && !activeCategory && (
        <div id="skill-drill-section" className="md:hidden px-4 py-6" style={{ backgroundColor: '#fdf9ee' }} data-testid="mobile-skill-drill-section">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#efc868' }}>
              <img
                src="/sarvam-logo-dark.svg"
                alt="Ceibaa"
                aria-hidden="true"
                className="w-5 h-5 object-contain"
                data-testid="skill-drill-logo"
              />
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
      <main className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="exams-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Competitive Exam</h2>
          <p className="text-xl text-gray-600">Select your target exam to explore complete syllabus and start practicing</p>
        </div>
        <HomeDesktopSections exams={exams} />

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