import React from 'react';
import { Sparkles, ChevronRight, HelpCircle, Timer, Award } from 'lucide-react';
import { POINTS_PER_CORRECT } from './constants';

interface IntroQuiz {
  title: string;
  description?: string | null;
  banner_image?: string | null;
  sponsor_name?: string | null;
  question_count: number;
  time_per_question: number;
}

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl p-2 sm:p-2.5 backdrop-blur-md">
    <div className={`p-1.5 rounded-lg ${accent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-300'}`}>
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="text-left min-w-0">
      <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider truncate" style={{ fontFamily: "'Geist', sans-serif" }}>{label}</p>
      <p className={`text-[11px] sm:text-xs font-bold tracking-tight mt-0.5 truncate ${accent ? 'text-emerald-300' : 'text-white'}`} style={{ fontFamily: "'Geist', sans-serif" }}>
        {value}
      </p>
    </div>
  </div>
);

interface IntroScreenProps {
  quiz: IntroQuiz;
  onStart: () => void;
  user?: { id?: string; name?: string } | null;
  /** Height (px) of any fixed bottom nav bar the host app renders on top of this screen. Defaults to 96. */
  bottomNavHeight?: number;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ quiz, onStart, user, bottomNavHeight = 96 }) => {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  return (
    <section
      data-testid="quiz-intro-screen"
      className="relative h-screen h-[100dvh] w-full flex flex-col justify-end bg-slate-950 overflow-hidden"
      style={{ fontFamily: "'Geist', sans-serif", paddingBottom: bottomNavHeight }}
    >
      {/* Full Screen Poster Asset Backdrop */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {quiz.banner_image && !imgError ? (
          <img
            src={quiz.banner_image}
            alt={quiz.title || 'Campaign Poster'}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover object-center transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
        {(!quiz.banner_image || imgError || !imgLoaded) && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'radial-gradient(140% 100% at 50% 10%, #312e81 0%, #1e1b4b 50%, #0b0a12 100%)',
            }}
          />
        )}
        {/* Dynamic Vignette Shading for maximum legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
      </div>

      {/* Glassmorphic Control Engine Interface — always visible, no scroll needed */}
      <div
        className="relative z-10 w-full max-w-xl mx-auto px-4 pb-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <div
          className="w-full rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-white/10 flex flex-col gap-2.5 sm:gap-4 shadow-2xl max-h-[50dvh] overflow-y-auto"
          style={{
            background: 'rgba(15, 14, 23, 0.75)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          }}
        >
          <div>
            {/* High-Profile Sponsor Badge */}
            {quiz.sponsor_name && (
              <div className="mb-2">
                <div
                  data-testid="quiz-sponsor-badge"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 backdrop-blur-md px-3 py-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                    Presented by {quiz.sponsor_name}
                  </span>
                </div>
              </div>
            )}

            {/* Title and Short Description Info */}
            <h1
              data-testid="quiz-title"
              className="text-white font-extrabold leading-tight text-lg sm:text-3xl mb-1.5 sm:mb-2 drop-shadow-sm"
            >
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="text-slate-200 text-[11px] sm:text-sm leading-relaxed mb-2.5 sm:mb-4 font-medium line-clamp-2 sm:line-clamp-3">
                {quiz.description}
              </p>
            )}

            {/* Metrics Layout Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <StatCard icon={HelpCircle} label="Questions" value={quiz.question_count} />
              <StatCard icon={Timer} label="Per Question" value={`${quiz.time_per_question}s`} />
              <StatCard
                icon={Award}
                label="Max Score"
                value={`${quiz.question_count * POINTS_PER_CORRECT} pts`}
                accent
              />
            </div>
          </div>

          {/* Global Action Call Strip */}
          <div className="w-full pt-2.5 sm:pt-3 border-t border-white/10 flex flex-col gap-2 sm:gap-2.5">
            <button
              data-testid="quiz-start-btn"
              onClick={onStart}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-400 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 px-6 shadow-[0_12px_24px_-6px_rgba(16,185,129,0.4)] active:scale-[0.99] transition-all touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 focus-visible:outline-offset-2"
            >
              <span>{user ? 'Begin Challenge' : 'Play as Guest'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="text-slate-300 text-[9px] text-center uppercase tracking-widest font-bold">
              Instant Points Distribution · No Skipping Allowed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroScreen;