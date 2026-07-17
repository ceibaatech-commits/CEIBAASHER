import React from 'react';
import { Clock, BookOpen, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ExamPotentialSection = ({ navigate }) => {
  return (
    <>
      {/* Unlocking Exam Potential Section */}
      <section className="py-6 md:py-10 bg-gradient-to-b from-white via-indigo-50/30 to-white relative overflow-hidden">
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

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {/* Card 1: Real-Time Mock Tests */}
            <div className="group transform transition-transform duration-300 hover:scale-105 cursor-pointer" onClick={() => navigate('/board')}>
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
                
                <div className="p-4 md:p-8">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Real-Time Mock Tests
                  </h3>
                  
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="/assets/features/mock-tests.webp"
                      alt="Real-Time Mock Tests"
                      width="192"
                      height="192"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                    />
                  </div>
                  
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Experience authentic exam simulations with timed sections, just like the real thing.
                  </p>
                  
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
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Personalized Plans
                  </h3>
                  
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="/assets/features/personalized-plans.webp"
                      alt="Personalized Practice Plans"
                      width="192"
                      height="192"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                    />
                  </div>
                  
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Get custom study schedules and recommended tests based on your performance.
                  </p>
                  
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
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">
                    Performance Analytics
                  </h3>
                  
                  <div className="flex items-center justify-center my-3 md:my-6">
                    <img 
                      src="/assets/features/analytics.webp"
                      alt="Performance Analytics"
                      width="192"
                      height="192"
                      className="w-28 h-28 md:w-48 md:h-48 object-contain"
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                    />
                  </div>
                  
                  <p className="text-gray-600 text-center leading-relaxed text-xs md:text-base">
                    Track your progress with detailed reports, identify strengths and weaknesses.
                  </p>
                  
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
    </>
  );
};

export default ExamPotentialSection;
