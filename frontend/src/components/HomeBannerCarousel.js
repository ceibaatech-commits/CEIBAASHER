import React from 'react';
import { User, Users, Trophy, Swords, Sparkles } from 'lucide-react';

const HeroBanner = () => {
  const features = [
    {
      id: 'solo',
      title: 'Solo Practice',
      desc: 'Unlimited MCQs & mock tests',
      icon: User,
      iconBg: '#0891b2'
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      desc: 'Multiplayer quiz battles',
      icon: Users,
      iconBg: '#7c3aed'
    },
    {
      id: 'victory',
      title: 'Victory Lane',
      desc: 'Leaderboards & glory',
      icon: Trophy,
      iconBg: '#ea580c'
    },
    {
      id: 'duel',
      title: '1v1 Duels',
      desc: 'Real-time matchmaking',
      icon: Swords,
      iconBg: '#dc2626'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }}></div>
          <div className="absolute bottom-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0891b2 0%, transparent 70%)' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
          
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-[15%] w-3 h-3 bg-teal-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-[20%] w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-[25%] w-4 h-4 border border-teal-400/20 rounded rotate-45"></div>
          <div className="absolute top-28 right-[35%] w-6 h-6 border border-cyan-400/15 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-teal-300 text-sm font-medium">India's #1 Social Learning Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-4">
                Learn.
                <span className="text-teal-400"> Compete.</span>
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #2dd4bf 0%, #22d3ee 100%)' }}>
                  Conquer.
                </span>
              </h1>
              
              <p className="text-slate-400 text-lg mb-8 max-w-md">
                Master your exams with unlimited practice, live battles, and a community of 50,000+ students.
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-black text-white">38+</div>
                  <div className="text-slate-500 text-sm">Exams</div>
                </div>
                <div className="w-px h-12 bg-slate-700"></div>
                <div>
                  <div className="text-3xl font-black text-white">50K+</div>
                  <div className="text-slate-500 text-sm">Students</div>
                </div>
                <div className="w-px h-12 bg-slate-700"></div>
                <div>
                  <div className="text-3xl font-black text-white">1M+</div>
                  <div className="text-slate-500 text-sm">Questions</div>
                </div>
              </div>
            </div>

            {/* Right - Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 transition-all duration-300 hover:bg-slate-800/80 hover:border-slate-600/50 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: feature.iconBg }}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    
                    {/* Text */}
                    <h3 className="text-white font-bold text-lg mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #115e59 50%, #0f766e 100%)' }}>
        {/* Decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-5">
            <span className="text-3xl">🎓</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Welcome to the Future of Learning!
          </h2>
          
          <p className="text-teal-100/90 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            We are beyond excited to welcome you to <span className="font-bold text-white">Ceibaa.in</span>—India's very first Social Learning App designed exclusively for students! 🇮🇳
          </p>
          
          {/* Decorative dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-300/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-300/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-300/50"></div>
          </div>
        </div>
        
        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroBanner;
