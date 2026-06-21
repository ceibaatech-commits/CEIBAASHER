import React, { memo } from 'react';
import { GripHorizontal, Maximize2, Minimize2, Phone, X } from 'lucide-react';
import { AgoraErrorBoundary, StableAgoraVideo } from './AgoraVideoOverlay';

const BattleVideoOverlay = memo(function BattleVideoOverlay({
  vcState,
  vcReady,
  vcSize,
  setVcSize,
  vcPos,
  vcDims,
  onDragStart,
  onOverlayClick,
  isDragging,
  agoraAppId,
  AGORA_APP_ID,
  sanitizedChannel,
  agoraToken,
  agoraUid,
  endVC,
  vcRequester,
  declineVC,
  acceptVC,
  C,
}) {
  const showPip = vcState === 'active' && vcReady;

  return (
    <>
      {showPip && (() => {
        const isFull = vcSize === 'full';
        const isMini = vcSize === 'mini';
        const dims = isFull
          ? { left: 0, top: 0, width: '100vw', height: '100vh', borderRadius: 0 }
          : isMini
            ? { left: vcPos.x, top: vcPos.y, width: vcDims.mini.w, height: vcDims.mini.h, borderRadius: 22 }
            : { left: vcPos.x, top: vcPos.y, width: vcDims.pip.w, height: vcDims.pip.h, borderRadius: 18 };

        return (
          <div
            data-testid="vc-pip"
            data-vc-size={vcSize}
            onMouseDown={!isFull ? onDragStart : undefined}
            onTouchStart={!isFull ? onDragStart : undefined}
            onClick={onOverlayClick}
            onDoubleClick={() => setVcSize(isFull ? 'pip' : 'full')}
            style={{
              position: 'fixed',
              zIndex: 70,
              ...dims,
              overflow: 'hidden',
              border: isFull ? 'none' : '2px solid white',
              backgroundColor: '#111',
              boxShadow: isFull ? 'none' : '0 12px 48px rgba(0,0,0,0.5)',
              display: 'block',
              cursor: isFull ? 'default' : (isDragging ? 'grabbing' : 'grab'),
              touchAction: isFull ? 'auto' : 'none',
              transition: isDragging ? 'none' : 'width 0.25s ease, height 0.25s ease, border-radius 0.25s ease, left 0.25s ease, top 0.25s ease',
              userSelect: 'none',
            }}
          >
            <AgoraErrorBoundary onError={() => endVC()}>
              <StableAgoraVideo
                appId={agoraAppId || AGORA_APP_ID}
                channel={sanitizedChannel}
                token={agoraToken}
                uid={agoraUid}
                onEnd={endVC}
                compact={isMini}
              />
            </AgoraErrorBoundary>

            {!isFull && !isMini && (
              <div
                data-vc-control
                style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 9, padding: '4px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', pointerEvents: 'none' }}
              >
                <GripHorizontal size={14} color="#fff" style={{ opacity: 0.7 }} />
              </div>
            )}

            {!isMini && (
              <button
                data-vc-control
                data-testid="vc-toggle-size"
                onClick={(e) => { e.stopPropagation(); setVcSize(isFull ? 'pip' : 'full'); }}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 9,
                }}
              >
                {isFull ? <Minimize2 size={14} color="#fff" /> : <Maximize2 size={14} color="#fff" />}
              </button>
            )}

            {!isMini && (
              <button
                data-vc-control
                data-testid="vc-toggle-mini"
                onClick={(e) => { e.stopPropagation(); setVcSize('mini'); }}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 46,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 9,
                }}
                title="Collapse to bubble"
              >
                <X size={14} color="#fff" />
              </button>
            )}

            {isMini && (
              <div
                data-vc-control
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: '#22c55e',
                  boxShadow: '0 0 0 0 rgba(34,197,94,0.7)',
                  animation: 'vcPulse 1.4s infinite',
                  zIndex: 9,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        );
      })()}

      {vcState === 'active' && (
        <style>{`@keyframes vcPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7);} 70% { box-shadow: 0 0 0 8px rgba(34,197,94,0);} 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0);} }`}</style>
      )}

      {vcState === 'incoming' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: C.blue }}>
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">Video Call Request</h3>
            <p className="text-gray-500 text-sm mb-6">{vcRequester} wants to video call</p>
            <div className="flex gap-3">
              <button onClick={declineVC} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold">Decline</button>
              <button onClick={acceptVC} className="flex-1 py-3 text-white rounded-xl font-semibold" style={{ background: '#22c55e' }}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default BattleVideoOverlay;
