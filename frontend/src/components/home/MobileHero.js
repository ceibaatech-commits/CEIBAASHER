import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpRight, Briefcase, ChevronRight } from 'lucide-react';

const MobileHero = ({
  navigate,
  searchQuery,
  setSearchQuery,
  handleSearch,
  filteredExams,
  liveBattlesCount,
}) => {
  return (
    <div
      className="md:hidden relative overflow-hidden"
      style={{ backgroundColor: '#fdf9ee' }}
      data-testid="mobile-home-hero"
    >
      <style>
        {`
          @keyframes ceibaa-pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.8); }
          }
          @keyframes ceibaa-rise {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ceibaa-rise-1 { animation: ceibaa-rise .5s ease-out both; animation-delay: .05s; }
          .ceibaa-rise-2 { animation: ceibaa-rise .5s ease-out both; animation-delay: .18s; }
          .ceibaa-rise-3 { animation: ceibaa-rise .5s ease-out both; animation-delay: .32s; }
          .ceibaa-rise-4 { animation: ceibaa-rise .5s ease-out both; animation-delay: .46s; }
          .ceibaa-dot { animation: ceibaa-pulse-dot 1.3s ease-in-out infinite; }
          .ceibaa-dots-bg {
            background-image: radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px);
            background-size: 14px 14px;
          }
          @keyframes ceibaa-morph-in {
            0% { opacity: 0; filter: blur(14px); transform: translateY(20px) scale(1.45); letter-spacing: 0.18em; }
            55% { opacity: 1; filter: blur(2px); transform: translateY(0) scale(1); letter-spacing: -0.04em; }
            100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); letter-spacing: -0.02em; }
          }
          .ceibaa-morph-word {
            display: inline-block;
            animation: ceibaa-morph-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .ceibaa-badge-word {
            position: relative;
            color: #7f1d1d;
            isolation: isolate;
            white-space: nowrap;
          }
          @keyframes ceibaa-marker-paint {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .ceibaa-badge-word::after {
            content: '';
            position: absolute;
            left: -2px;
            right: -2px;
            bottom: 4px;
            height: 8px;
            background: #f5c451;
            border-radius: 2px;
            z-index: -1;
            transform-origin: left center;
            transform: scaleX(0);
            opacity: 0.85;
            animation: ceibaa-marker-paint 0.55s ease-out 1.05s forwards;
          }
          @keyframes ceibaa-marker {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .ceibaa-marker-line {
            display: inline-block;
            transform-origin: left center;
            animation: ceibaa-marker .55s ease-out both;
          }
        `}
      </style>
      
      {/* Subtle dotted pattern (right side) */}
      <div
        className="absolute top-4 right-0 w-40 h-44 ceibaa-dots-bg opacity-60 pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Headline */}
      <div className="relative px-5 pt-7 pb-4">
        <h1 className="tracking-tight" data-testid="mobile-home-headline">
          <span
            className="block text-[34px] font-black leading-[1.05]"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
            data-testid="mobile-home-headline-typed"
          >
            {['The', 'Badge', 'That', 'Never', 'Fails.'].map((word, i, arr) => {
              const isBadge = word === 'Badge';
              return (
                <React.Fragment key={`hw-${i}`}>
                  <span
                    className={`ceibaa-morph-word${isBadge ? ' ceibaa-badge-word' : ''}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    {word}
                  </span>
                  {i < arr.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
          </span>
        </h1>
      </div>

      {/* CTA pair — purple "Get Hired" + gold "Train" */}
      <div className="relative px-5 pb-4 ceibaa-rise-4">
        <div className="grid grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="col-span-3 relative text-left rounded-2xl px-4 py-4 shadow-[0_10px_24px_-10px_rgba(76,29,149,0.65)] active:scale-[0.98] transition-transform"
            style={{ backgroundColor: '#4c1d95', color: '#ffffff' }}
            data-testid="mobile-home-get-hired-btn"
          >
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#ddd6fe' }}
            >
              Career Pathway:
            </span>
            <span className="flex items-center gap-1.5 text-[20px] font-black leading-tight">
              Get Hired <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <Briefcase
              className="absolute top-3 right-3 w-6 h-6 opacity-90"
              style={{ color: '#ede9fe' }}
              strokeWidth={2}
            />
          </button>

          <button
            type="button"
            onClick={() => navigate('/recruiter')}
            className="col-span-2 relative text-left rounded-2xl px-4 py-4 shadow-[0_10px_24px_-10px_rgba(217,180,86,0.6)] active:scale-[0.98] transition-transform"
            style={{ backgroundColor: '#efc868', color: '#1f1505' }}
            data-testid="mobile-home-hire-with-us-btn"
          >
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#6b4e0d' }}
            >
              Recruiters:
            </span>
            <span className="flex items-center gap-1.5 text-[20px] font-black leading-tight">
              Hire With Us
            </span>
            <img
              src="/sarvam-logo-dark.svg"
              alt="Ceibaa"
              aria-hidden="true"
              className="absolute top-3 right-3 w-5 h-5 object-contain pointer-events-none"
              data-testid="hire-with-us-logo"
            />
          </button>
        </div>
      </div>

      {/* Search pill */}
      <div className="relative px-5 pb-3">
        <form onSubmit={handleSearch} data-testid="mobile-home-search-form">
          <div
            className="relative flex items-center rounded-full px-4 py-3 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)]"
            style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }}
          >
            <Search className="w-4 h-4 mr-3" style={{ color: '#64748b' }} strokeWidth={2.25} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Exams, Skills, Mentors..."
              className="flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
              style={{ color: '#0f172a' }}
              data-testid="mobile-home-search-input"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Inline search results dropdown */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-5 right-5 z-50 mt-2 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(15,23,42,0.10)',
                boxShadow: '0 16px 40px -12px rgba(15,23,42,0.28)',
                transformOrigin: 'top center',
              }}
              data-testid="mobile-home-search-dropdown"
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#4c1d95' }}>
                <Search className="w-4 h-4 text-white/70" />
                <span className="text-white font-bold text-sm flex-1">
                  {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </span>
              </div>

              {/* Result list */}
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {filteredExams.length > 0 ? filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => { setSearchQuery(''); navigate(`/exam/${exam.id}`); }}
                    className="flex items-center gap-3 px-4 py-3 active:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`bg-gradient-to-br ${exam.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}
                      style={{ width: '2.25rem', height: '2.25rem' }}
                    >
                      {exam.icon?.startsWith('http') ? (
                        <img src={exam.icon} alt={exam.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-base">{exam.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{exam.name}</p>
                      <p className="text-gray-500 text-[11px] truncate">{exam.full_name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-6 text-sm">No exams found for &ldquo;{searchQuery}&rdquo;</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats strip — Exams / Questions / Active Battles Live */}
      <div className="relative px-5 pb-6">
        <div
          className="rounded-2xl px-4 py-3 shadow-[0_6px_18px_-12px_rgba(15,23,42,0.3)]"
          style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }}
          data-testid="mobile-home-stats"
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#64748b' }}
              >
                Exams:
              </p>
              <p className="text-[20px] font-black leading-tight" style={{ color: '#0f172a' }}>
                38<span style={{ color: '#4c1d95' }}>+</span>
              </p>
            </div>
            <div className="border-l border-r px-2" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#64748b' }}
              >
                Questions:
              </p>
              <p className="text-[20px] font-black leading-tight" style={{ color: '#0f172a' }}>
                50K<span style={{ color: '#4c1d95' }}>+</span>
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#64748b' }}
              >
                Active Battles:
              </p>
              <p
                className="text-[20px] font-black leading-tight flex items-center gap-1.5"
                style={{ color: '#0f172a' }}
                data-testid="mobile-home-live-battles"
              >
                {liveBattlesCount.toLocaleString('en-IN')}
                <span
                  className="ceibaa-dot inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#ef4444' }}
                ></span>
                <span className="text-[13px] font-bold" style={{ color: '#ef4444' }}>
                  Live
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subheading card */}
      <div className="relative px-5 pb-6">
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            backgroundColor: '#fffdf6',
            border: '1px solid rgba(127,29,29,0.18)',
            boxShadow: '0 10px 24px -16px rgba(15,23,42,0.18)',
          }}
          data-testid="mobile-home-subheading-card"
        >
          <span
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: '#7f1d1d' }}
            aria-hidden="true"
          ></span>
          <p className="pl-5 pr-4 py-3.5 text-[14px] font-semibold leading-[1.55]" style={{ color: '#1e293b' }}>
            In the{' '}
            <span style={{ color: '#7f1d1d', fontWeight: 800 }}>Ceibaa Arena</span>, every battle{' '}
            <span className="relative inline-block">
              <span className="relative z-10">builds a bridge</span>
              <span
                className="ceibaa-marker-line absolute left-0 right-0 bottom-0.5 h-2 -z-0 opacity-80"
                style={{ background: '#f5c451', borderRadius: '2px', animationDelay: '2.0s' }}
                aria-hidden="true"
              ></span>
            </span>{' '}to your future. Earn your{' '}
            <span style={{ color: '#7f1d1d', fontWeight: 800 }}>badge</span>{' '}and unlock{' '}
            <span style={{ color: '#7f1d1d', fontWeight: 800 }}>opportunities</span>{' '}beyond the exam hall.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileHero;
