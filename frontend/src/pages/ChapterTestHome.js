import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, GraduationCap, ArrowRight, Sparkles, Zap, Target, BarChart3, Smartphone, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

const CLASS_DATA = [
  { num: 6, label: 'Class 6', gradient: 'from-sky-400 to-blue-600', shadow: 'shadow-blue-200', ring: 'ring-blue-300' },
  { num: 7, label: 'Class 7', gradient: 'from-violet-400 to-purple-600', shadow: 'shadow-purple-200', ring: 'ring-purple-300' },
  { num: 8, label: 'Class 8', gradient: 'from-fuchsia-400 to-pink-600', shadow: 'shadow-pink-200', ring: 'ring-pink-300' },
  { num: 9, label: 'Class 9', gradient: 'from-amber-400 to-orange-600', shadow: 'shadow-orange-200', ring: 'ring-orange-300' },
  { num: 10, label: 'Class 10', gradient: 'from-rose-400 to-red-600', shadow: 'shadow-red-200', ring: 'ring-red-300' },
  { num: 11, label: 'Class 11', gradient: 'from-teal-400 to-emerald-600', shadow: 'shadow-emerald-200', ring: 'ring-emerald-300' },
  { num: 12, label: 'Class 12', gradient: 'from-indigo-400 to-blue-700', shadow: 'shadow-indigo-200', ring: 'ring-indigo-300' },
];

const FEATURES = [
  { icon: Target, title: 'Chapter-wise Practice', desc: 'Master one chapter at a time with focused tests mapped to your textbook', color: 'from-orange-500 to-rose-500', bg: 'bg-orange-50' },
  { icon: BarChart3, title: 'Track Your Growth', desc: 'Detailed analytics and progress reports to identify weak areas', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Get results immediately with detailed explanations for every question', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50' },
  { icon: Users, title: 'Live Competitions', desc: 'Real-time battles with students across India on leaderboards', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
  { icon: Smartphone, title: 'Study Anywhere', desc: 'Mobile, tablet, or desktop — works everywhere, learn on the go', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
  { icon: Sparkles, title: '100% Free Forever', desc: 'No hidden charges, no subscriptions — quality education for all', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
];

const STATS = [
  { value: '500+', label: 'Chapter Tests', icon: BookOpen, gradient: 'from-blue-500 to-indigo-600' },
  { value: '10,000+', label: 'Practice Questions', icon: Award, gradient: 'from-purple-500 to-violet-600' },
  { value: '7 Classes', label: '6th to 12th', icon: GraduationCap, gradient: 'from-rose-500 to-pink-600' },
];

const ChapterTestHome = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, handleLogout, handleLogin } = useAuth();

  const handleClassClick = (classNum) => {
    if (classNum === 11 || classNum === 12) {
      navigate(`/chapter-tests/class-${classNum}/select-stream`);
    } else {
      navigate(`/chapter-tests/class-${classNum}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc]">
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 pb-20 pt-10 sm:pt-16">
          {/* Mesh-gradient blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-pink-300/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-indigo-300/20 rounded-full blur-3xl" />
            {/* Floating dots grid */}
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Text */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 border border-white/20">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/90 text-sm font-semibold tracking-wide">NCERT Aligned</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-5" data-testid="hero-title">
                  CBSE Chapter
                  <span className="block bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">Tests</span>
                </h1>

                <p className="text-lg text-white/80 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Master every chapter with focused practice tests. Select your class and start your journey to exam success.
                </p>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-bold text-white/90">
                    <Target className="w-4 h-4 inline mr-1.5 -mt-0.5" />Chapter-wise
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-bold text-white/90">
                    <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />NCERT Based
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-bold text-white/90">
                    <Zap className="w-4 h-4 inline mr-1.5 -mt-0.5" />Instant Results
                  </span>
                </div>
              </div>

              {/* 3D Hero Image */}
              <div className="flex-shrink-0 relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-90" />
                <img
                  src="/images/hero_3d_books.png"
                  alt="3D Books"
                  className="relative w-full h-full object-contain drop-shadow-2xl animate-float"
                  data-testid="hero-3d-image"
                />
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
              <path d="M0 40C360 80 720 0 1080 40C1260 60 1380 60 1440 40V80H0V40Z" fill="#f8f9fc" />
            </svg>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-20 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="stats-section">
            {STATS.map(({ value, label, icon: Icon, gradient }) => (
              <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1`}>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
                    <p className="text-white/85 text-sm font-semibold">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CLASS SELECTION ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2" data-testid="class-selection-title">
              Select Your Class
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">Choose your class to start practicing</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {CLASS_DATA.map(({ num, label, gradient, shadow, ring }) => (
              <button
                key={num}
                onClick={() => handleClassClick(num)}
                data-testid={`class-card-${num}`}
                className={`group relative bg-white rounded-2xl p-5 sm:p-7 ${shadow} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden`}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 shadow-lg group-hover:scale-110 group-hover:rotate-3`}>
                    <span className="text-2xl sm:text-3xl font-black text-white">{num}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 group-hover:text-white transition-colors">
                      {label}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 group-hover:text-white/80 transition-colors mt-0.5">
                      CBSE Curriculum
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER with 3D ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 sm:p-12 overflow-hidden">
            {/* Noise overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3">
                  Ready to Excel in Your Exams?
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-lg">
                  Practice chapter-wise tests and track your progress across all subjects!
                </p>
              </div>
              <img
                src="/images/3d_rocket.png"
                alt="Rocket"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl animate-float-slow hidden sm:block"
              />
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />Why Chapter Tests?
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, idx) => (
              <div
                key={title}
                className={`group ${bg} rounded-2xl p-6 sm:p-7 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                data-testid={`feature-card-${idx}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MADE FOR INDIA ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 px-4 py-1.5 rounded-full mb-4 shadow-md">
                    <span className="text-white text-xs font-black tracking-wider">MADE FOR INDIA</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                    Why Ceibaa is Perfect for Indian Students
                  </h2>
                  <p className="text-gray-500 text-base sm:text-lg max-w-xl">
                    India's first gamified learning platform designed specifically for CBSE curriculum
                  </p>
                </div>
                <img
                  src="/images/3d_target.png"
                  alt="Target"
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-xl hidden md:block"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {[
                  { icon: '🎮', title: 'Gamified Learning', desc: 'Turn studies into exciting games. Battle with friends and compete on leaderboards!', gradient: 'from-purple-500 to-purple-700' },
                  { icon: '📚', title: '100% NCERT Aligned', desc: 'Every question mapped to NCERT chapters, matching CBSE board exam pattern.', gradient: 'from-blue-500 to-blue-700' },
                  { icon: '🏆', title: 'Live Competitions', desc: 'Real-time battles with students across India. Earn badges and climb rankings!', gradient: 'from-amber-500 to-orange-600' },
                  { icon: '💰', title: '100% Free Forever', desc: 'No charges, no subscriptions. Quality education accessible to every student.', gradient: 'from-emerald-500 to-emerald-700' },
                  { icon: '📱', title: 'Study Anywhere', desc: 'Mobile, tablet, or computer — works everywhere! Learn from home or on the go.', gradient: 'from-pink-500 to-rose-700' },
                  { icon: '⚡', title: 'Instant Feedback', desc: 'Get results immediately with detailed explanations. Learn from your mistakes fast!', gradient: 'from-indigo-500 to-purple-700' },
                ].map(({ icon, title, desc, gradient }) => (
                  <div key={title} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 hover:scale-[1.02]`}>
                    <div className="bg-white rounded-xl w-12 h-12 flex items-center justify-center mb-4 shadow-md text-2xl">
                      {icon}
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
                    <p className="text-white/90 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
          <div className="relative bg-gradient-to-r from-orange-500 via-pink-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 flex flex-col items-center">
              <img src="/images/3d_trophy.png" alt="Trophy" className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mb-6 animate-float" />

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3">
                Join 50,000+ Students Across India!
              </h2>
              <p className="text-white/85 text-base sm:text-lg max-w-xl mb-8">
                Start your journey to exam success with India's most engaging learning platform
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white text-purple-700 px-8 py-4 rounded-2xl font-black text-base sm:text-lg hover:scale-105 transition-all shadow-xl hover:shadow-2xl inline-flex items-center gap-2"
                data-testid="cta-start-learning"
              >
                Start Learning Now — It's Free!
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-white/60 mt-4 text-sm">No credit card required</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ChapterTestHome;
