/**
 * DynamicBannerCarousel.js
 *
 * Mobile: infinite auto-scroll marquee animation.
 *   — Doubles the banner array so translateX(-50%) = exactly one full set width.
 *   — Pauses on touch (to let the user tap a card), resumes after lift.
 *   — Drag-to-scroll kept for desktop via mousedown handler.
 *
 * Desktop: drag-to-scroll (rendered inside hidden md:block in Home.js).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// ── Navigation helpers ─────────────────────────────────────────────────────
const buildTargetUrl = (targetType, targetId) => {
  switch (targetType) {
    case 'quiz_room':   return `/quiz-room/${targetId}`;
    case 'battle':      return `/battle-lobby/${targetId}`;
    case 'leaderboard': return targetId ? `/leaderboard/${targetId}` : '/leaderboard';
    case 'url':         return targetId;
    default:            return null;
  }
};

// ── Skeleton ───────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[78vw] max-w-xs h-44 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
);

// ── Single banner card ─────────────────────────────────────────────────────
const CHIP = {
  quiz_room:   '🧩 Join Quiz',
  battle:      '⚔️ Enter Battle',
  leaderboard: '🏆 Leaderboard',
  url:         '🔗 Learn More',
};

const BannerCard = React.memo(({ banner, onClick }) => (
  <button
    onClick={() => onClick(banner)}
    /* pointer-events-none while animating is NOT set — tap still works */
    className="flex-shrink-0 w-[78vw] max-w-xs rounded-2xl overflow-hidden shadow-lg
               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 group"
    aria-label={banner.title || `Go to ${banner.target_type}`}
    style={{ touchAction: 'pan-y' }}   /* allow vertical scroll, block horizontal */
  >
    <div className="relative h-44">
      <img
        src={banner.image_url}
        alt={banner.title || 'Banner'}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        draggable={false}
      />
      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
      {/* Chip */}
      <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white
                       bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full tracking-wide">
        {CHIP[banner.target_type] ?? 'Open'}
      </span>
    </div>
  </button>
));

// ── DynamicBannerCarousel ──────────────────────────────────────────────────
const DynamicBannerCarousel = () => {
  const navigate                    = useNavigate();
  const [banners, setBanners]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [paused,  setPaused]        = useState(false);
  const resumeTimerRef              = useRef(null);
  const trackRef                    = useRef(null);      // desktop drag-scroll

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/banners`);
        if (!cancelled && res.data.success) setBanners(res.data.banners || []);
      } catch { /* non-critical */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Click / navigate ─────────────────────────────────────────────────────
  const handleClick = useCallback((banner) => {
    const url = buildTargetUrl(banner.target_type, banner.target_id);
    if (!url) return;
    if (banner.target_type === 'url' && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
    }
  }, [navigate]);

  // ── Touch: pause animation while finger is down ──────────────────────────
  const handleTouchStart = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Small delay so the tap registers before animation restarts
    resumeTimerRef.current = setTimeout(() => setPaused(false), 400);
  }, []);

  // ── Desktop drag-to-scroll ───────────────────────────────────────────────
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let isDown = false, startX = 0, scrollLeft = 0;
    const onDown  = (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
    const onUp    = ()  => { isDown = false; el.style.cursor = 'grab'; };
    const onMove  = (...