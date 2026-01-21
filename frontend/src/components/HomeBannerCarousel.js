import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Trophy, Swords, ChevronRight } from 'lucide-react';

const HeroBanner = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'solo',
      title: 'Solo Practice',
      desc: 'Unlimited MCQs & mock tests',
      icon: User,
      color: '#06b6d4',
      bg: 'from-cyan-600 to-teal-700',
      link: '/skill-drills'
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      desc: 'Multiplayer quiz battles',
      icon: Users,
      color: '#8b5cf6',
      bg: 'from-violet-600 to-purple-700',
      link: '/join-room'
    },
    {
      id: 'victory',
      title: 'Victory Lane',
      desc: 'Leaderboards & achievements',
      icon: Trophy,
      color: '#f59e0b',
      bg: 'from-amber-500 to-orange-600',
      link: '/victory-lane'
    },
    {
      id: 'matchmaking',
      title: '1v1 Matchmaking',
      desc: 'Real-time duels',
      icon: Swords,
      color: '#ef4444',
      bg: 'from-red-500 to-rose-600',
      link: '/matchmaking'
    }
  ];

  return (
    <div className="w-full bg-[#0a0f1a]">
      {/* Compact Banner - Same height as old banners */}
      <div className="relative h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a] via-[#0f172a] to-[#0a0f1a]"></div>
        
        {/* Geometric accent - top right */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="w-full grid lg:grid-cols-5 gap-6 items-center">
            
            {/* Left: Title Section */}
            <div className="lg:col-span-2 text-left">
              <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">
                <span className="w-8 h-[2px] bg-cyan-400"></span>
                <span>Game Mode</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-2">
                Choose Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                  Battle Arena
                </span>
              </h1>
              <p className="text-gray-400 text-sm lg:text-base max-w-sm hidden sm:block">
                4 ways to master your competitive exams
              </p>
            </div>

            {/* Right: Feature Cards - Horizontal Strip */}
            <div className="lg:col-span-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => navigate(feature.link)}
                    className="flex-shrink-0 w-36 sm:w-40 group cursor-pointer"
                  >
                    <div className="relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1">
                      {/* Icon */}
                      <div 
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      
                      {/* Text */}
                      <h3 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-snug">
                        {feature.desc}
                      </p>
                      
                      {/* Arrow indicator */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroBanner;
