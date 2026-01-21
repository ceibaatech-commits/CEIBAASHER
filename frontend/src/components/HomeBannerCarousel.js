import React from 'react';
import { User, Users, Trophy, Swords } from 'lucide-react';

const HeroBanner = () => {
  const features = [
    {
      id: 'solo',
      title: 'Solo Practice',
      desc: 'Unlimited MCQs & mock tests',
      icon: User,
      bg: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      desc: 'Multiplayer quiz battles',
      icon: Users,
      bg: 'from-violet-500 to-purple-600'
    },
    {
      id: 'victory',
      title: 'Victory Lane',
      desc: 'Leaderboards & glory',
      icon: Trophy,
      bg: 'from-amber-500 to-orange-500'
    },
    {
      id: 'duel',
      title: '1v1 Duels',
      desc: 'Real-time matchmaking',
      icon: Swords,
      bg: 'from-rose-500 to-red-500'
    }
  ];

  return (
    <div className="w-full relative">
      {/* Teal/Cyan Gradient Background - Matching Ceibaa Logo */}
      <div className="absolute inset-0">
        {/* Base gradient - teal to dark */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900"></div>
        
        {/* 3D depth layers */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-gradient-to-br from-cyan-400/30 via-teal-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-5%] w-[35%] h-[70%] bg-gradient-to-tl from-emerald-600/25 via-teal-600/15 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-[30%] right-[15%] w-[25%] h-[35%] bg-gradient-to-b from-cyan-300/15 to-transparent rounded-full blur-2xl"></div>
        </div>
        
        {/* Mesh gradient overlay for depth */}
        <div className="absolute inset-0 opacity-40" style={{
          background: `radial-gradient(ellipse at 15% 30%, rgba(34, 211, 238, 0.2) 0%, transparent 50%),
                       radial-gradient(ellipse at 85% 70%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 60%)`
        }}></div>
      </div>

      {/* Banner Content - Same height as old banners */}
      <div className="relative z-10 h-64 sm:h-72 md:h-80 lg:h-96">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="w-full grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left: Title Section */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="w-8 h-[2px] bg-gradient-to-r from-cyan-300 to-teal-300"></span>
                <span>Game Mode</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
                Choose Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300">
                  Battle Arena
                </span>
              </h1>
              <p className="text-teal-100/80 text-sm lg:text-base">
                4 ways to master your comprehensive exams
              </p>
            </div>

            {/* Right: Feature Cards - 2x2 Grid - Static (No Links) */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="group"
                  >
                    <div className="relative bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
                      {/* Icon */}
                      <div 
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-2 sm:mb-3 shadow-lg`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      </div>
                      
                      {/* Text */}
                      <h3 className="text-white font-bold text-sm sm:text-base mb-0.5">
                        {feature.title}
                      </h3>
                      <p className="text-teal-100/60 text-xs leading-snug">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroBanner;
