import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, GraduationCap, ArrowRight, Sparkles, Zap, Target, BarChart3, Smartphone, Users, Bell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DotLottiePlayer } from '@dotlottie/react-player';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

const CLASS_DATA = [
  { num: 6, label: 'Class 6', gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-100' },
  { num: 7, label: 'Class 7', gradient: 'from-cyan-500 to-teal-600', shadow: 'shadow-cyan-100' },
  { num: 8, label: 'Class 8', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-100' },
  { num: 9, label: 'Class 9', gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-100' },
  { num: 10, label: 'Class 10', gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-100' },
  { num: 11, label: 'Class 11', gradient: 'from-teal-600 to-cyan-700', shadow: 'shadow-teal-100' },
  { num: 12, label: 'Class 12', gradient: 'from-slate-700 to-gray-900', shadow: 'shadow-gray-200' },
];

const STATE_BOARDS = [
  { name: 'Haryana Board', abbr: 'HBSE', emoji: '🌾' },
  { name: 'Rajasthan Board', abbr: 'RBSE', emoji: '🏰' },
  { name: 'Bihar Board', abbr: 'BSEB', emoji: '🏛️' },
  { name: 'Tamil Nadu Board', abbr: 'TNBSE', emoji: '🛕' },
  { name: 'UP Board', abbr: 'UPMSP', emoji: '🕌' },
  { name: 'Maharashtra Board', abbr: 'MSBSHSE', emoji: '🏔️' },
  { name: 'MP Board', abbr: 'MPBSE', emoji: '🐅' },
  { name: 'West Bengal Board', abbr: 'WBBSE', emoji: '🌺' },
];

const FEATURES = [
  { icon: Target, title: 'Chapter-wise Practice', desc: 'Focused tests mapped to your textbook chapters', color: 'bg-teal-500' },
  { icon: BarChart3, title: 'Track Your Growth', desc: 'Detailed analytics to identify weak areas', color: 'bg-cyan-500' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Immediate results with detailed explanations', color: 'bg-emerald-500' },
  { icon: Users, title: 'Live Competitions', desc: 'Real-time battles with students across India', color: 'bg-blue-500' },
  { icon: Smartphone, title: 'Study Anywhere', desc: 'Works on mobile, tablet, and desktop', color: 'bg-slate-600' },
  { icon: Sparkles, title: '100% Free Forever', desc: 'No charges, no subscriptions ever', color: 'bg-teal-600' },
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEO
        title="Free Chapter-wise MCQs & NCERT Solutions - CBSE Class 6 to 12"
        description="Practice free chapter-wise MCQs, NCERT solutions, and interactive quizzes for CBSE Class 6, 7, 8, 9, 10, 11 & 12. All subjects covered with instant results."
        keywords="chapter wise mcq, ncert solutions, cbse class 6 7 8 9 10 11 12, free mcq test, online quiz, ncert mcq"
        canonical="https://ceibaa.in/chapter-tests"
      />
      <Header isLoggedIn={isLoggedIn} user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#0f1729] pt-4 sm:pt-6 pb-12 sm:pb-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-2 lg:gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-teal-500/15 border border-teal-500/25 px-3 py-1 rounded-full mb-2 sm:mb-3">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-teal-300 text-xs font-semibold tracking-wide">NCERT Aligned</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-[1.15] mb-1.5 sm:mb-2" data-testid="hero-title">
                  CBSE Chapter{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Tests</span>
                </h1>

                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto lg:mx-0 mb-3 leading-relaxed">
                  Master every chapter with focused practice tests. Select your class and start your journey to exam success.
                </p>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-start">
                  {['Chapter-wise', 'NCERT Based', 'Instant Results'].map(tag => (
                    <span key={tag} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lottie animation on all screens */}
              <div className="flex-shrink-0 w-36 h-36 sm:w-48 sm:h-48 lg:w-[280px] lg:h-[280px] -mb-2 lg:mb-0">
                <DotLottiePlayer
                  src="https://assets-v2.lottiefiles.com/a/6dcb9f7c-1172-11ee-8f3a-7f6ccb9677cf/Tu534yUIU1.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="max-w-4xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-20 mb-8 sm:mb-12">
          <div className="grid grid-cols-3 gap-2 sm:gap-4" data-testid="stats-section">
            {[
              { val: '500+', label: 'Chapter Tests', Icon: BookOpen },
              { val: '10,000+', label: 'Questions', Icon: Award },
              { val: '7 Classes', label: '6th to 12th', Icon: GraduationCap },
            ].map(({ val, label, Icon }) => (
              <div key={label} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-md border border-gray-100 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-gray-900">{val}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CLASS SELECTION ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1" data-testid="class-selection-title">
              Select Your Class
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm">Choose your class to start practicing</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {CLASS_DATA.map(({ num, label, gradient, shadow }) => (
              <button
                key={num}
                onClick={() => handleClassClick(num)}
                data-testid={`class-card-${num}`}
                className={`group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 ${shadow} shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-100`}
              >
                <div className="flex flex-col items-center gap-1.5 sm:gap-2.5">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform shadow-md`}>
                    <span className="text-base sm:text-xl font-black text-white">{num}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800">{label}</h3>
                    <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5 hidden sm:block">CBSE</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── STATE BOARDS DIVIDER ── */}
          <div className="flex items-center gap-4 my-8 sm:my-10" data-testid="state-boards-divider">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.06em] whitespace-nowrap">
              State Boards — Coming Soon
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── STATE BOARDS GRID ── */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-4" data-testid="state-boards-grid">
            {STATE_BOARDS.map(({ name, abbr, emoji }) => (
              <div
                key={abbr}
                data-testid={`state-board-card-${abbr}`}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-dashed border-gray-300 cursor-default opacity-80"
              >
                <div className="flex flex-col items-center gap-1.5 sm:gap-2.5">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">{emoji}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">{name}</h3>
                    <p className="text-[9px] sm:text-[11px] text-gray-400 mt-0.5 uppercase">{abbr} · Classes 6–12</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-2 py-0.5 text-[9px] sm:text-xs font-bold">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── NOTIFY BUTTON ── */}
          <div className="flex justify-center mt-6 sm:mt-8">
            <button
              onClick={() => toast.success("You'll be notified when your board goes live!")}
              className="inline-flex items-center gap-2 border border-green-500 text-green-700 rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors"
              data-testid="notify-state-boards-btn"
            >
              <Bell className="w-4 h-4" />
              Notify me when my board launches
            </button>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="relative bg-[#0f1729] rounded-2xl p-5 sm:p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white mb-1.5">
                  Ready to Excel in Your Exams?
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Practice chapter-wise tests and track your progress across all subjects!
                </p>
              </div>
              <img
                src="/images/3d_rocket.png"
                alt="Rocket"
                className="w-14 h-14 sm:w-24 sm:h-24 object-contain drop-shadow-lg flex-shrink-0"
              />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }, idx) => (
              <div
                key={title}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 hover:shadow-md transition-shadow"
                data-testid={`feature-card-${idx}`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${color} flex items-center justify-center mb-2 sm:mb-3`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5 sm:mb-1">{title}</h4>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY CEIBAA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl p-4 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mb-5 sm:mb-8">
              <div className="flex-1 text-center sm:text-left">
                <span className="inline-block bg-[#0f1729] text-teal-300 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
                  MADE FOR INDIA
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-gray-900">
                  Why Ceibaa is Perfect for Indian Students
                </h2>
              </div>
              <img
                src="/images/3d_target.png"
                alt="Target"
                className="w-16 h-16 sm:w-28 sm:h-28 object-contain hidden sm:block"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {[
                { title: 'Gamified Learning', desc: 'Battle with friends, compete on leaderboards', color: 'bg-[#0f1729]' },
                { title: '100% NCERT Aligned', desc: 'Mapped to CBSE board exam pattern', color: 'bg-slate-700' },
                { title: 'Live Competitions', desc: 'Earn badges and climb rankings', color: 'bg-teal-700' },
                { title: '100% Free Forever', desc: 'Quality education for every student', color: 'bg-emerald-700' },
                { title: 'Study Anywhere', desc: 'Mobile, tablet, or computer', color: 'bg-cyan-700' },
                { title: 'Instant Feedback', desc: 'Learn from your mistakes fast', color: 'bg-slate-800' },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`${color} rounded-xl p-3 sm:p-4`}>
                  <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">{title}</h4>
                  <p className="text-[9px] sm:text-xs text-gray-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
          <div className="bg-[#0f1729] rounded-2xl p-5 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <img src="/images/3d_trophy.png" alt="Trophy" className="w-14 h-14 sm:w-20 sm:h-20 object-contain mx-auto mb-3 sm:mb-5" />

              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white mb-2">
                Join 50,000+ Students Across India!
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-4 sm:mb-6">
                Start your journey to exam success with India's most engaging learning platform
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-lg"
                data-testid="cta-start-learning"
              >
                Start Learning Now — It's Free!
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ChapterTestHome;
