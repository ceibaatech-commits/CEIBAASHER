import React, { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, FileText } from 'lucide-react';

const CompactBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      exam: 'RRB NTPC',
      title: 'RRB NTPC 2026',
      subtitle: 'Railway Recruitment Board - Non-Technical Popular Categories',
      highlights: [
        '5,800+ Vacancies Expected',
        'Complete Syllabus Coverage',
        'Previous Year Questions'
      ],
      gradient: 'from-blue-600 via-indigo-600 to-purple-700',
      ctaText: 'View Syllabus & Apply',
      icon: '🚂'
    },
    {
      id: 2,
      exam: 'AFCAT',
      title: 'Indian Air Force AFCAT',
      subtitle: 'Air Force Common Admission Test 2026',
      highlights: [
        'Flying & Ground Duty Branches',
        'Complete Exam Pattern',
        'Free Mock Tests Available'
      ],
      gradient: 'from-sky-500 via-blue-600 to-indigo-700',
      ctaText: 'Details & Free Mock Test',
      icon: '✈️'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentBanner = banners[currentSlide];

  return (
    <div className="w-full bg-gray-50">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes rotateClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slideInLeft 0.6s ease-out forwards;
        }
        .animate-pulse-glow {
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .rotate-ring-1 {
          animation: rotateClockwise 20s linear infinite;
        }
        .rotate-ring-2 {
          animation: rotateCounterClockwise 15s linear infinite;
        }
        .rotate-ring-3 {
          animation: rotateClockwise 25s linear infinite;
        }
      `}</style>

      <div className="relative h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden shadow-lg">
        <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient}`}>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '2s'}}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center w-full">
              
              <div className="text-white space-y-3">
                <div className="flex items-center gap-2 animate-slide-in">
                  <span className="text-3xl sm:text-4xl">{currentBanner.icon}</span>
                  <span className="bg-white/25 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                    {currentBanner.exam}
                  </span>
                </div>

                <div className="animate-slide-in" style={{animationDelay: '0.1s'}}>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 leading-tight">
                    {currentBanner.title}
                  </h2>
                  <p className="text-sm sm:text-base text-white/90 font-medium hidden sm:block">
                    {currentBanner.subtitle}
                  </p>
                </div>

                <div className="space-y-2 animate-slide-in" style={{animationDelay: '0.2s'}}>
                  {currentBanner.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm sm:text-base">
                      <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/95 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="animate-slide-in pt-2" style={{animationDelay: '0.3s'}}>
                  <button className="bg-white text-gray-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-gray-100 transition-all inline-flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 group">
                    <span>{currentBanner.ctaText}</span>
                    <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center relative">
                <div className="relative w-72 h-72 lg:w-80 lg:h-80">
                  
                  <div className="absolute inset-0 w-full h-full">
                    <div className="w-full h-full border-[6px] border-white border-dashed rounded-full rotate-ring-1 shadow-lg"></div>
                  </div>
                  
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <div className="w-56 h-56 lg:w-64 lg:h-64 border-[5px] border-white rounded-full rotate-ring-2 shadow-lg"></div>
                  </div>
                  
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <div className="w-40 h-40 lg:w-48 lg:h-48 border-4 border-white border-dotted rounded-full rotate-ring-3 shadow-lg"></div>
                  </div>
                  
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                      <div className="w-28 h-28 lg:w-36 lg:h-36 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center border-2 border-white/50">
                        <div className="text-center">
                          <div className="relative inline-block">
                            <FileText className="w-14 h-14 lg:w-16 lg:h-16 text-white mx-auto mb-2 animate-float" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                          </div>
                          <p className="text-white font-black text-3xl lg:text-4xl mb-0.5 drop-shadow-lg">2026</p>
                          <p className="text-white/95 font-semibold text-sm">Exam Ready</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 py-1.5 rounded-full font-bold text-sm shadow-2xl animate-float border-2 border-white z-10">
                    🔥 Hot
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-3 py-1.5 rounded-full font-bold text-sm shadow-2xl animate-float border-2 border-white z-10" style={{animationDelay: '1.5s'}}>
                    ✨ New
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === index ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactBanner;