import React from 'react';
import { ChevronRight } from 'lucide-react';

const CanopyBanner = ({ navigate }) => {
  const canopySvgIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14v7"/>
      <path d="M9 18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/>
      <path d="M17 14.26V10a2 2 0 1 0-4 0v4.26"/>
      <path d="M21 12a5 5 0 0 0-10 0"/>
      <path d="M12 19a8 8 0 0 0 16 0"/>
      <path d="M12 3v3"/>
    </svg>
  );

  return (
    <>
      {/* Desktop Canopy Banner */}
      <div className="hidden md:block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center p-4">
                {canopySvgIcon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 text-sm font-medium bg-white/10 px-2 py-0.5 rounded">NEW</span>
                  <h2 className="text-2xl font-bold">The Canopy</h2>
                </div>
                <p className="text-emerald-100 max-w-xl">
                  Grow your influence and earn! Unlock badges at 500 posts, media posting at 1K followers, and get <span className="font-semibold text-white">90% ad revenue</span> at 2.5K followers.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/earn')}
              className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-lg"
            >
              Start Growing
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Canopy Banner */}
      <div 
        className="md:hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white mx-4 my-4 rounded-2xl overflow-hidden shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/earn')}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center p-3 flex-shrink-0">
              {canopySvgIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-emerald-200 text-xs font-medium bg-white/10 px-1.5 py-0.5 rounded">NEW</span>
                <h2 className="text-base font-bold">The Canopy</h2>
              </div>
              <p className="text-emerald-100 text-xs leading-snug">
                Earn badges, unlock media posting & get <span className="font-semibold text-white">90% ad revenue!</span>
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
          </div>
        </div>
      </div>
    </>
  );
};

export default CanopyBanner;
