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
        <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center">
            <div className="grid md:grid-cols-2 gap-8 items-center w-full">
              {/* Left: Text Content */}
              <div className="text-white space-y-6 z-10">
                {/* Icon & Badge */}
                <div className="flex items-center space-x-3">
                  <span className="text-5xl">{currentBanner.icon}</span>
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                    {currentBanner.exam}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-2 leading-tight">
                    {currentBanner.title}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 font-medium">
                    {currentBanner.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-lg text-white/80">
                  {currentBanner.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2">
                  {currentBanner.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-white/90">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => navigate(currentBanner.ctaLink)}
                    className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all inline-flex items-center space-x-2 shadow-2xl hover:scale-105 transform"
                  >
                    <span>{currentBanner.ctaText}</span>
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Decorative Element */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  {/* Animated Circle */}
                  <div className="w-72 h-72 bg-white/10 backdrop-blur-sm rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-56 h-56 bg-white/10 rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-24 h-24 text-white/80 mx-auto mb-4" />
                        <p className="text-white font-bold text-2xl">2026</p>
                        <p className="text-white/80">Exam Ready</p>
                      </div>
                    </div>
                  </div>
                  {/* Floating Badge */}
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-bounce">
                    New Batch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
        aria-label="Previous banner"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
        aria-label="Next banner"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeBannerCarousel;
