import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Trophy, Swords } from 'lucide-react';

const HeroBanner = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'solo',
      title: 'Solo Practice',
      description: 'Perfect your mechanics with unlimited MCQs & mock tests',
      icon: User,
      gradient: 'from-cyan-500 to-blue-600',
      bgGlow: 'bg-cyan-500/20',
      link: '/skill-drills'
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      description: 'Team up instantly in multiplayer quiz battles',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      bgGlow: 'bg-purple-500/20',
      link: '/join-room'
    },
    {
      id: 'victory',
      title: 'Victory Lane',
      description: 'Post your glory on leaderboards & achievements',
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/20',
      link: '/victory-lane'
    },
    {
      id: 'matchmaking',
      title: '1v1 Matchmaking',
      description: 'Real-time duels against matched opponents',
      icon: Swords,
      gradient: 'from-rose-500 to-red-600',
      bgGlow: 'bg-rose-500/20',
      link: '/matchmaking'
    }
  ];

  return (
    <div className="w-full">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-8px) rotateX(2deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes card-hover-glow {
          0%, 100% { box-shadow: 0 20px 40px -15px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .card-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .card-3d:hover {
          transform: translateY(-8px) rotateX(5deg);
        }
        .card-3d:hover .icon-container {
          transform: translateZ(30px) scale(1.1);
        }
        .card-3d:hover .card-content {
          transform: translateZ(20px);
        }
        .icon-container {
          transition: transform 0.4s ease;
        }
        .card-content {
          transition: transform 0.4s ease;
        }
      `}</style>

      {/* Main Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 animate-gradient"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-ring"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-ring" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl animate-pulse-ring" style={{animationDelay: '2s'}}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Header Section */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Experience Gaming-Style Learning</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Level Up
              </span>
              {' '}Your Exam Prep
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Master competitive exams with our battle-tested platform featuring solo practice, multiplayer battles, and real-time matchmaking
            </p>
          </div>

          {/* 3D Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => navigate(feature.link)}
                  className="card-3d relative group cursor-pointer transition-all duration-500"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 ${feature.bgGlow} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Card */}
                  <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-500 group-hover:bg-white/15 group-hover:border-white/30">
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 animate-shimmer"></div>
                    </div>
                    
                    {/* Icon Container */}
                    <div className="icon-container relative mb-6">
                      <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300`}>
                        <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2} />
                      </div>
                      {/* Floating Ring */}
                      <div className={`absolute -inset-2 border-2 border-dashed rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} style={{borderColor: 'rgba(255,255,255,0.3)'}}></div>
                    </div>
                    
                    {/* Content */}
                    <div className="card-content relative">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-white/60 text-sm md:text-base leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Bottom Accent Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-12 md:mt-16 text-center">
            <button
              onClick={() => navigate('/skill-drills')}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 animate-gradient"
              style={{ backgroundSize: '200% 200%' }}
            >
              <span>Start Your Journey</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            
            <p className="mt-4 text-white/50 text-sm">
              Join 50,000+ students already leveling up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
