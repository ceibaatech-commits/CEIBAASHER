import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Users, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import useHomeData from '../hooks/useHomeData';
import HomeDesktopSections from '../components/home/HomeDesktopSections';

import MobileHero from '../components/home/MobileHero';
import MobileCategoryFilter from '../components/home/MobileCategoryFilter';
import MobileSkillDrill from '../components/home/MobileSkillDrill';
import CanopyBanner from '../components/home/CanopyBanner';
import ExamPotentialSection from '../components/home/ExamPotentialSection';
import HowCeibaaWorks from '../components/home/HowCeibaaWorks';

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 pb-0 md:pb-0">
      {/* SEO Component for Home Page */}
      <SEO 
        title="Ceibaa 2026 - India's #1 Social Learning & Career Platform"
        description="FREE 1M+ MCQ's. Live 1v1 Duels. Multiplayer Rooms. Capazoo (Post MCQ's, Videos and Photos. Courses. Interships and Jobs by Top Companies"
      />
      
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Mobile Hero Section */}
      <MobileHero
        navigate={navigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        filteredExams={filteredExams}
        liveBattlesCount={liveBattlesCount}
      />

      {/* Category Filter */}
      <MobileCategoryFilter
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        filteredExams={filteredExams}
        navigate={navigate}
      />

      {/* Mobile: Skill Drill - CBSE Classes Section */}
      {!searchQuery.trim() && !activeCategory && (
        <MobileSkillDrill navigate={navigate} />
      )}
      
      {/* Desktop Banner Carousel */}
      <div className="hidden md:block">
        <HomeBannerCarousel />
      </div>

      {/* Canopy Banner (Desktop & Mobile) */}
      <CanopyBanner navigate={navigate} />

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

      {/* Unlocking Exam Potential Section */}
      <ExamPotentialSection navigate={navigate} />

      {/* Main Content - Exam Cards */}
      <main className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="exams-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Competitive Exam</h2>
          <p className="text-xl text-gray-600">Select your target exam to explore complete syllabus and start practicing</p>
        </div>
        <HomeDesktopSections exams={exams} />

        {/* How Ceibaa Works Section */}
        <HowCeibaaWorks />
      </main>

      <Footer />
    </div>
  );
};

export default Home;