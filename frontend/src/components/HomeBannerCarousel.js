import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, FileText, TrendingUp } from 'lucide-react';

const HomeBannerCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      exam: 'RRB NTPC',
      title: 'RRB NTPC 2026',
      subtitle: 'Railway Recruitment Board - Non-Technical Popular Categories',
      description: 'Start your railway career with comprehensive preparation',
      highlights: [
        '5,800+ Vacancies Expected',
        'Complete Syllabus Coverage',
        'Previous Year Questions'
      ],
      gradient: 'from-blue-600 via-indigo-600 to-purple-700',
      ctaText: 'View Syllabus & Apply',
      ctaLink: '/exams/rrb-ntpc',
      icon: '🚂',
      pattern: 'railway'
    },
    {
      id: 2,
      exam: 'AFCAT',
      title: 'Indian Air Force AFCAT',
      subtitle: 'Air Force Common Admission Test 2026',
      description: 'Join the Indian Air Force - Fly High, Aim Higher',
      highlights: [
        'Flying & Ground Duty Branches',
        'Complete Exam Pattern',
        'Free Mock Tests Available'
      ],
      gradient: 'from-sky-500 via-blue-600 to-indigo-700',
      ctaText: 'Details & Free Mock Test',
      ctaLink: '/exams/afcat',
      icon: '✈️',
      pattern: 'airforce'
    }
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const currentBanner = banners[currentSlide];

  return (
    <div className="relative w-full bg-white overflow-hidden shadow-lg">
      {/* Banner Container */}
      <div className="relative home-banner-carousel">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {currentBanner.pattern === 'railway' && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="railway-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 20h40M20 0v40" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-blue-300"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#railway-pattern)" />
              </svg>
            </div>
          )}
          {currentBanner.pattern === 'airforce' && (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="airforce-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="2" fill="currentColor" className="text-sky-300"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#airforce-pattern)" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient} banner-animated-gradient overflow-hidden`}>
          {/* Floating Particles */}
          <div className="absolute inset-0 banner-particles">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
          </div>
          
          {/* Animated Glow Effects */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '1s'}}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-10 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
              {/* Left: Text Content */}
              <div className="text-white home-banner-content compact-banner">
                {/* Icon & Badge */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2 animate-slide-in-left">
                  <div className="banner-icon-bounce text-xl sm:text-2xl md:text-3xl">{currentBanner.icon}</div>
                  <span className="bg-white/30 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold border border-white/40">
                    {currentBanner.exam}
                  </span>
                </div>

                {/* Title with Gradient Text */}
                <div className="mb-1.5 sm:mb-2 animate-slide-in-left" style={{animationDelay: '0.1s'}}>
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black mb-0.5 sm:mb-1 leading-tight banner-title-glow">
                    {currentBanner.title}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-white/95 font-semibold banner-subtitle-shine">
                    {currentBanner.subtitle}
                  </p>
                </div>

                {/* Description - Hidden on mobile */}
                <p className="hidden sm:block text-sm md:text-base text-white/90 mb-2 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
                  {currentBanner.description}
                </p>

                {/* Highlights with Icons */}
                <div className="space-y-1 mb-2 sm:mb-3">
                  {currentBanner.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-1.5 animate-slide-in-left" style={{animationDelay: `${0.3 + index * 0.1}s`}}>
                      <div className="w-4 h-4 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm text-white font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button Enhanced */}
                <div className="animate-slide-in-left" style={{animationDelay: '0.6s'}}>
                  <button
                    onClick={() => navigate(currentBanner.ctaLink)}
                    className="banner-cta-button bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-gray-100 transition-all inline-flex items-center space-x-1.5 shadow-lg hover:shadow-white/50 relative overflow-hidden group"
                  >
                    <span className="relative z-10">{currentBanner.ctaText}</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </button>
                </div>
              </div>

              {/* Right: Enhanced Decorative Element */}
              <div className="hidden md:flex items-center justify-center relative py-6">
                <div className="relative banner-3d-element">
                  {/* Rotating Ring 1 */}
                  <div className="absolute inset-0 banner-ring-1"></div>
                  {/* Rotating Ring 2 */}
                  <div className="absolute inset-0 banner-ring-2"></div>
                  
                  {/* Center Content - Responsive sizing */}
                  <div className="w-72 h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl relative z-10">
                    <div className="w-60 h-60 lg:w-64 lg:h-64 xl:w-80 xl:h-80 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border-2 border-white/30">
                      <div className="text-center">
                        <div className="relative">
                          <FileText className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-white mx-auto mb-3 lg:mb-4 animate-float" />
                          <div className="absolute -top-2 -right-2 w-5 h-5 lg:w-6 lg:h-6 bg-yellow-400 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-white font-black text-2xl lg:text-3xl xl:text-4xl mb-1 banner-year-glow">2026</p>
                        <p className="text-white/90 font-semibold text-sm lg:text-base">Exam Ready</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-2xl animate-bounce-slow border-2 border-white/50">
                    🔥 Hot
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-2xl animate-bounce-slow border-2 border-white/50" style={{animationDelay: '0.5s'}}>
                    ✨ New
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBannerCarousel;
