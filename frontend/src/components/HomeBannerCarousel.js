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
      bg: 'from-cyan-500 to-cyan-600',
      link: '/skill-drills'
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      desc: 'Multiplayer quiz battles',
      icon: Users,
      bg: 'from-violet-500 to-purple-600',
      link: '/join-room'
    },
    {
      id: 'victory',
      title: 'Victory Lane',
      desc: 'Leaderboards & glory',
      icon: Trophy,
      bg: 'from-amber-500 to-orange-500',
      link: '/victory-lane'
    },
    {
      id: 'duel',
      title: '1v1 Duels',
      desc: 'Real-time matchmaking',
      icon: Swords,
      bg: 'from-rose-500 to-red-500',
      link: '/matchmaking'
    }
  ];

  return (
    <div className="w-full relative">
      {/* 3D Gradient Background */}
      <div className="absolute inset-0 bg-[#0c1222]">
        {/* Primary gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/60"></div>
        
        {/* 3D depth layers */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-gradient-to-br from-cyan-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl transform rotate-12"></div>
          <div className="absolute bottom-[-30%] right-[-5%] w-[45%] h-[80%] bg-gradient-to-tl from-purple-600/20 via-violet-600/10 to-transparent rounded-full blur-3xl transform -rotate-12"></div>
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[40%] bg-gradient-to-b from-teal-500/10 to-transparent rounded-full blur-2xl"></div>
        </div>
        
        {/* Mesh gradient overlay for depth */}
        <div className="absolute inset-0 opacity-30" style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 70%)`
        }}></div>
      </div>

      {/* Banner Content - Same height as old banners */}
      <div className="relative z-10 h-64 sm:h-72 md:h-80 lg:h-96">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="w-full grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left: Title Section */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="w-8 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-400"></span>
                <span>Game Mode</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
                Choose Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  Battle Arena
                </span>
              </h1>
              <p className="text-gray-400 text-sm lg:text-base">
                4 ways to master your comprehensive exams
              </p>
            </div>

            {/* Right: Feature Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => navigate(feature.link)}
                    className="group cursor-pointer"
                  >
                    <div className="relative bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-sm border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
                      {/* Icon */}
                      <div 
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300 shadow-lg`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      </div>
                      
                      {/* Text */}
                      <h3 className="text-white font-bold text-sm sm:text-base mb-0.5 group-hover:text-cyan-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-snug">
                        {feature.desc}
                      </p>
                      
                      {/* Hover arrow */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroBanner;
