import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  Trophy,
  Swords,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import MarqueeBanner from './MarqueeBanner';

const BACKEND_URL = window.location.origin;

// ─── Static Hero Banner (desktop only) ────────────────────────────────────────
const StaticHeroBanner = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'solo',
      title: 'Solo Practice',
      desc: 'Unlimited MCQs & mock tests',
      icon: User,
      color: '#0891b2',
      link: null,
    },
    {
      id: 'rooms',
      title: 'Join Rooms',
      desc: 'Multiplayer quiz battles',
      icon: Users,
      color: '#7c3aed',
      link: '/join-room',
    },
    {
      id: 'victory',
      title: 'Capazoo',
      desc: 'Leaderboards & glory',
      icon: Trophy,
      color: '#ea580c',
      link: '/capazoo',
    },
    {
      id: 'duel',
      title: '1v1 Duels',
      desc: 'Real-time matchmaking',
      icon: Swords,
      color: '#dc2626',
      link: null,
    },
  ];

  return (
    <div className="w-full bg-slate-900 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-teal-300 text-sm font-medium">
                India's #1 Social Learning Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] mb-6">
              Learn. Compete. <br />
              <span className="text-teal-400">Conquer.</span>
            </h1>

            <p className="text-slate-400 text-lg mb-8 max-w-md">
              Master your exams with unlimited practice, live battles, and a
              community of 50,000+ students.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.id}
                onClick={() => f.link && navigate(f.link)}
                className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 transition-colors ${
                  f.link ? 'cursor-pointer hover:bg-slate-800' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: f.color }}
                >
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold">{f.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Quiz Card ────────────────────────────────────────────────────────────────
const QuizCard = ({ quiz, onClick, className = '' }) => (
  <div
    onClick={onClick}
    className={`w-full h-full rounded-[28px] overflow-hidden cursor-pointer relative group bg-slate-100 shadow-sm ${className}`}
  >
    <img
      src={quiz.banner_image}
      alt={quiz.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      draggable={false}
      loading="lazy"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

    {quiz.sponsor_name && (
      <div className="absolute left-4 bottom-4">
        <span className="bg-white/90 backdrop-blur text-slate-900 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full">
          {quiz.sponsor_name}
        </span>
      </div>
    )}
  </div>
);

// ─── Arrow Button ─────────────────────────────────────────────────────────────
const RailArrow = ({
  direction = 'left',
  onClick,
  className = '',
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`absolute z-20 top-1/2 -translate-y-1/2 rounded-full bg-white/95 hover:bg-white shadow-md border border-slate-200 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    aria-label={direction === 'left' ? 'Previous quizzes' : 'Next quizzes'}
  >
    {direction === 'left' ? (
      <ChevronLeft className="w-5 h-5 text-slate-700" />
    ) : (
      <ChevronRight className="w-5 h-5 text-slate-700" />
    )}
  </button>
);

// ─── Desktop Carousel ─────────────────────────────────────────────────────────
const DesktopCarousel = ({ quizzes, onNavigate }) => {
  const [current, setCurrent] = useState(0);
  const total = quizzes.length;

  const cardWidth = 360;
  const cardHeight = 520;
  const gap = 20;
  const peekLeft = 28;
  const peekRight = 140;

  const maxIndex = Math.max(0, total - 3);

  useEffect(() => {
    if (total <= 3) return;

    const id = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(id);
  }, [total, maxIndex]);

  if (total === 0) return null;

  const next = () => setCurrent((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  const translateX = current * (cardWidth + gap);

  return (
    <div className="relative">
      {total > 3 && (
        <>
          <RailArrow
            direction="left"
            onClick={prev}
            disabled={current === 0}
            className="left-2 w-11 h-11"
          />

          <RailArrow
            direction="right"
            onClick={next}
            disabled={current >= maxIndex}
            className="right-2 w-11 h-11"
          />
        </>
      )}

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            gap: `${gap}px`,
            transform: `translateX(-${Math.max(0, translateX - peekLeft)}px)`,
            paddingRight: `${peekRight}px`,
          }}
        >
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="shrink-0"
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
              }}
            >
              <QuizCard quiz={quiz} onClick={() => onNavigate(quiz)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Carousel ──────────────────────────────────────────────────────────
const MobileCarousel = ({ quizzes, onNavigate }) => {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const total = quizzes.length;

  const cardWidth = 286;
  const cardHeight = 390;
  const gap = 14;
  const peekLeft = 14;
  const peekRight = 72;

  const maxIndex = Math.max(0, total - 1);

  useEffect(() => {
    if (total <= 1) return;

    const id = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(id);
  }, [total, maxIndex]);

  if (total === 0) return null;

  const next = () => setCurrent((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) next();
    if (distance < -50) prev();
  };

  const translateX = current * (cardWidth + gap);

  return (
    <div className="relative px-2 pt-2">
      {total > 1 && (
        <>
          <RailArrow
            direction="left"
            onClick={prev}
            disabled={current === 0}
            className="left-1 w-9 h-9"
          />

          <RailArrow
            direction="right"
            onClick={next}
            disabled={current >= maxIndex}
            className="right-1 w-9 h-9"
          />
        </>
      )}

      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            gap: `${gap}px`,
            transform: `translateX(-${Math.max(0, translateX - peekLeft)}px)`,
            paddingRight: `${peekRight}px`,
          }}
        >
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="shrink-0"
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
              }}
            >
              <QuizCard quiz={quiz} onClick={() => onNavigate(quiz)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ isMobile }) =>
  isMobile ? (
    <div className="px-3 pt-2">
      <div className="w-[286px] h-[390px] rounded-[28px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
    </div>
  ) : (
    <div className="w-full overflow-hidden">
      <div className="flex gap-5">
        <div className="w-[360px] h-[520px] rounded-[28px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
        <div className="w-[360px] h-[520px] rounded-[28px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
        <div className="w-[360px] h-[520px] rounded-[28px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      </div>
    </div>
  );

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeBannerCarousel() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/sponsored-quizzes`)
      .then((r) => r.json())
      .then((data) => setQuizzes(data.quizzes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNavigate = useCallback(
    (quiz) => {
      navigate(`/sponsored-quiz/${quiz.id}`);
    },
    [navigate]
  );

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col gap-0">
      <div className="hidden md:block">
        <StaticHeroBanner />
      </div>

      <div className="py-2 md:py-4">
        <MarqueeBanner
          text="SPONSORED QUIZ • WIN PRIZES • PLAY NOW"
          secondText="TOPPERS FAVOURITE INSTITUTE"
          separator="•"
          secondSeparator="•"
          speed={20}
          secondSpeed={18}
        />
      </div>

      {(loading || quizzes.length > 0) && (
        <div className="w-full pb-4 md:pb-10 pt-2 md:pt-4">
          <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6">
            {loading ? (
              <Skeleton isMobile={false} />
            ) : (
              <DesktopCarousel quizzes={quizzes} onNavigate={handleNavigate} />
            )}
          </div>

          <div className="block md:hidden">
            {loading ? (
              <Skeleton isMobile={true} />
            ) : (
              <MobileCarousel quizzes={quizzes} onNavigate={handleNavigate} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}