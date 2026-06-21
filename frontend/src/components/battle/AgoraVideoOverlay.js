/**
 * AgoraVideoOverlay.js
 *
 * Isolates all Agora SDK code so the main battle page only imports a single
 * component instead of pulling in AgoraUIKit at the top level.  React.memo
 * prevents the heavy Agora subtree from re-rendering on every keystroke.
 */
import React, { useState, useEffect, Component } from 'react';
import AgoraUIKit from 'agora-react-uikit';
import { toast } from 'sonner';

// ─── Error boundaries ────────────────────────────────────────────────────────

/** Catches AgoraUIKit crashes (invalid token, gateway errors). */
class AgoraErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, msg: '' }; }

  static getDerivedStateFromError(err) {
    return { crashed: true, msg: err?.message || 'Video call unavailable' };
  }

  componentDidCatch(err) {
    console.warn('[AgoraErrorBoundary] caught:', err?.message);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0a0a0a',
          color: '#aaa', fontSize: 13, gap: 8, padding: 16, textAlign: 'center',
        }}>
          <span style={{ fontSize: 24 }}>📵</span>
          <span>Video unavailable</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{this.state.msg}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Catches uncaught AgoraUIKit subtree errors and shows a graceful toast. */
class VideoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // audio-only toggle injected via onError prop
  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.onError && prevProps.onError !== this.props.onError) {
      // no-op: onError was already called in componentDidCatch
    }
  }

  componentDidCatch(error, info) {
    console.error('[VideoCall] Crashed:', error, info);
    try { toast.error('Video call dropped — quiz continues.'); } catch (_) { /* ignore */ }
    if (this.props.onError) {
      try { this.props.onError(error); } catch (_) {}
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#111', color: '#fff', padding: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#5B8FD4',
              animation: 'vcConnSpin 0.9s linear infinite', margin: '0 auto 8px',
            }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Video unavailable</p>
            <style>{`@keyframes vcConnSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── StableAgoraVideo ────────────────────────────────────────────────────────

/**
 * Lightweight wrapper around AgoraUIKit.
 * - uid passed as 0 (not undefined) — avoids Agora join errors.
 * - audioOnly fallback activates when camera is blocked or video errors out.
 * - Provides a visible end-call button that always works.
 *
 * @param {{ appId, channel, token, uid, onEnd, compact, audioOnly }} props
 */
const StableAgoraVideo = React.memo(({ appId, channel, token, uid, onEnd, compact, audioOnly = false }) => {
  const [joined, setJoined] = useState(false);
  const [useAudioOnly, setUseAudioOnly] = useState(!!audioOnly);
  const normalizedUid = Number.isFinite(Number(uid)) ? Number(uid) : 0;
  useEffect(() => { setJoined(!!appId && !!channel); }, [appId, channel]);

  if (joined) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#0a0a0a' }}>
        <style>{`
          [data-vc-stage] video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        `}</style>
        <VideoErrorBoundary onError={() => { if (!useAudioOnly) setUseAudioOnly(true); }}>
          <AgoraUIKit
            rtcProps={{
              appId,
              channel,
              ...(token ? { token } : {}),
              uid: normalizedUid,
              role: 'host',
              layout: 1,
              disableRtm: true,
              enableVideo: !useAudioOnly,
              enableAudio: true,
            }}
            rtmProps={null}
            callbacks={{ EndCall: onEnd }}
            styleProps={{
              UIKitContainer: { width: '100%', height: '100%', position: 'absolute', inset: 0, backgroundColor: '#0a0a0a' },
              videoMode: { max: 'cover', min: 'cover' },
              minViewContainer: { display: 'none', width: 0, height: 0, opacity: 0, pointerEvents: 'none' },
              maxViewContainer: { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 },
            }}
            data-vc-stage
          />
        </VideoErrorBoundary>

        {/* Always-visible end-call button — works even if Agora controls fail */}
        <button
          data-vc-control
          onClick={(e) => { e.stopPropagation(); if (onEnd) onEnd(); }}
          title="End call"
          aria-label="End call"
          style={{
            position: 'absolute', bottom: compact ? 6 : 12, right: compact ? 6 : 12,
            zIndex: 40, width: compact ? 30 : 40, height: compact ? 30 : 40,
            borderRadius: '50%', background: '#ef4444', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 17.5C22.7 16.1 21.7 15 20.3 14.6l-3.2-.8a1 1 0 00-1 .4l-1.4 2a15.3 15.3 0 01-6.9-6.9l2-1.4a1 1 0 00.4-1L9.4 3.7C9 2.3 7.9 1.3 6.5 1 4.5.6 2 2 2 4.5c0 9.7 7.8 17.5 17.5 17.5 2.5 0 3.9-2.5 3.5-4.5z" />
          </svg>
        </button>

        {useAudioOnly && (
          <div style={{
            position: 'absolute', top: compact ? 4 : 8, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            borderRadius: 12, padding: compact ? '2px 8px' : '4px 12px',
            color: '#fff', fontSize: compact ? 9 : 11, fontWeight: 600,
            zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            🎙 Audio only
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#111', color: '#fff',
      padding: compact ? 8 : 20, textAlign: 'center',
    }}>
      <div style={{
        width: compact ? 28 : 56, height: compact ? 28 : 56, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#5B8FD4',
        animation: 'vcConnSpin 0.9s linear infinite', marginRight: 12,
      }} />
      <p style={{ fontSize: compact ? 10 : 13, fontWeight: 600, opacity: 0.9, margin: 0 }}>
        {compact ? 'Connecting…' : 'Connecting to opponent…'}
      </p>
      <style>{`@keyframes vcConnSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});
StableAgoraVideo.displayName = 'StableAgoraVideo';

export { AgoraErrorBoundary, StableAgoraVideo };
