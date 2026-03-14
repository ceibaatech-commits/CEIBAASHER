import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/* Global: only one video plays at a time */
let currentlyPlayingVideo = null;

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* Transform Cloudinary video URL to MP4 and generate thumbnail */
const getCloudinaryUrls = (src) => {
  if (!src) return { videoUrl: src, posterUrl: '' };

  // Check if it's a Cloudinary URL
  const cloudinaryMatch = src.match(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(v\d+\/.+)$/
  );

  if (cloudinaryMatch) {
    const base = cloudinaryMatch[1];
    const path = cloudinaryMatch[2];
    const pathNoExt = path.replace(/\.\w+$/, '');
    return {
      videoUrl: `${base}f_mp4,q_auto/${pathNoExt}.mp4`,
      posterUrl: `${base}so_0,w_640,c_limit,f_jpg,q_60/${pathNoExt}.jpg`,
    };
  }

  return { videoUrl: src, posterUrl: '' };
};

const VideoPost = ({ src, className = '' }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const { videoUrl, posterUrl } = getCloudinaryUrls(src);

  // IntersectionObserver: auto-play/pause on scroll
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (currentlyPlayingVideo && currentlyPlayingVideo !== video) {
              currentlyPlayingVideo.pause();
            }
            currentlyPlayingVideo = video;
            video.play().catch(() => {});
          } else {
            if (currentlyPlayingVideo === video) {
              video.pause();
              currentlyPlayingVideo = null;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (currentlyPlayingVideo === video) {
        video.pause();
        currentlyPlayingVideo = null;
      }
    };
  }, []);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => { setDuration(video.duration); setHasLoaded(true); };
    const onTime = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { video.currentTime = 0; video.play().catch(() => {}); };
    const onError = () => setLoadError(true);

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, []);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (currentlyPlayingVideo && currentlyPlayingVideo !== video) currentlyPlayingVideo.pause();
      currentlyPlayingVideo = video;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio: '16/9' }}
      data-testid="video-post-container"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        muted={muted}
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain ${loadError ? 'hidden' : ''}`}
        onClick={togglePlay}
        data-testid="video-post-player"
      />

      {/* Fallback: show poster if video fails to load */}
      {loadError && posterUrl && (
        <img src={posterUrl} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-contain" />
      )}

      {/* Mute/Unmute — top right */}
      <button
        onClick={toggleMute}
        className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 z-10"
        data-testid="video-mute-btn"
      >
        {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>

      {/* Duration — bottom right */}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] text-white font-mono z-10" data-testid="video-duration">
        {formatDuration(duration)}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
        <div className="h-full bg-white/80 transition-all duration-200" style={{ width: `${progress}%` }} />
      </div>

      {/* Paused play indicator */}
      {!isPlaying && hasLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPost;
