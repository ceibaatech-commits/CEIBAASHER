import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import {
  Flag, X, AlertTriangle, Minimize2, Maximize2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const ZEGO_APP_ID = Number(process.env.REACT_APP_ZEGO_APP_ID);
const ZEGO_SERVER_SECRET = process.env.REACT_APP_ZEGO_SERVER_SECRET;

const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity / Sexual Content', description: 'Showing private parts or sexual behaviour' },
  { id: 'harassment', label: 'Harassment / Bullying', description: 'Verbal abuse or threatening behaviour' },
  { id: 'offensive_content', label: 'Offensive Content', description: 'Hate speech, slurs, or discriminatory behaviour' },
  { id: 'cheating', label: 'Cheating', description: 'Using unfair means to win' },
  { id: 'inappropriate_behavior', label: 'Other Inappropriate Behaviour', description: 'Any other concerning behaviour' },
];

const BattleVideoChat = ({ socket, roomId, playerName, opponentName, opponentId }) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const initDone = useRef(false);

  // Start EXPANDED so ZegoCloud has a proper container to render into
  const [minimised, setMinimised] = useState(false);

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportId, setReportId] = useState(null);

  // Initialize ZegoCloud
  const initZego = useCallback(() => {
    if (initDone.current || !containerRef.current || !roomId || !playerName) return;
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      console.error('[ZegoCloud] Credentials missing - ZEGO_APP_ID:', ZEGO_APP_ID, 'SECRET present:', !!ZEGO_SERVER_SECRET);
      return;
    }

    initDone.current = true;

    // Unique userID per session — must be different for each player
    const userID = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    // ZegoCloud room IDs must be alphanumeric, max 128 chars
    const zegoRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 128) || 'defaultroom';

    console.log('[ZegoCloud] Initializing:', { appID: ZEGO_APP_ID, zegoRoomId, userID, playerName });

    try {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        ZEGO_APP_ID,
        ZEGO_SERVER_SECRET,
        zegoRoomId,
        userID,
        playerName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: containerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        showPreJoinView: false,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        showRoomTimer: false,
        showLayoutButton: false,
        showScreenSharingButton: false,
        onJoinRoom: () => {
          console.log('[ZegoCloud] Joined room successfully');
        },
        onLeaveRoom: () => {
          console.log('[ZegoCloud] Left room');
        },
      });

      console.log('[ZegoCloud] joinRoom called');
    } catch (err) {
      console.error('[ZegoCloud] Init error:', err);
      initDone.current = false;
    }
  }, [roomId, playerName]);

  // Run init once container + props are ready
  useEffect(() => {
    // Small delay to ensure container is rendered at full size
    const timer = setTimeout(() => initZego(), 300);
    return () => {
      clearTimeout(timer);
      if (zpRef.current) {
        try { zpRef.current.destroy(); } catch (e) { /* ignore */ }
        zpRef.current = null;
        initDone.current = false;
      }
    };
  }, [initZego]);

  // Report submission
  const submitReport = async () => {
    if (!reportReason) { toast.error('Please select a reason'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/admin/battles/report`,
        {
          battle_id: roomId, room_id: roomId,
          reported_user_id: opponentId || 'unknown',
          reported_username: opponentName || 'Opponent',
          reason: reportReason, description: reportDesc, chat_messages: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { setReportId(res.data.report_id); setReportDone(true); }
    } catch (e) {
      console.error('Failed to submit report:', e);
      toast.error('Failed to submit report.');
    } finally { setSubmitting(false); }
  };

  const closeReport = () => {
    setShowReport(false); setReportDone(false);
    setReportId(null); setReportReason(''); setReportDesc('');
  };

  // Don't render until socket + roomId are available
  if (!socket || !roomId) return null;

  return (
    <>
      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4" data-testid="report-modal">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            {reportDone ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Your report against <strong>{opponentName || 'this user'}</strong> has been received.
                </p>
                {reportId && (
                  <p className="font-mono text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block mb-4">
                    Ref: {String(reportId).slice(0, 8).toUpperCase()}
                  </p>
                )}
                <button onClick={closeReport} className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition" data-testid="report-close-btn">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-full"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                    <h3 className="font-bold text-gray-900">Report User</h3>
                  </div>
                  <button onClick={closeReport} className="p-1.5 hover:bg-gray-100 rounded-full" data-testid="report-close-x"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-600">Report <strong>{opponentName || 'this user'}</strong> for inappropriate behaviour.</p>
                  <div className="space-y-2">
                    {REPORT_REASONS.map(r => (
                      <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="report_reason" value={r.id} checked={reportReason === r.id} onChange={e => setReportReason(e.target.value)} className="mt-0.5 text-red-500" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{r.label}</p>
                          <p className="text-xs text-gray-500">{r.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Additional details (optional)" rows={3}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" data-testid="report-description" />
                </div>
                <div className="flex gap-3 p-4 border-t">
                  <button onClick={closeReport} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition" data-testid="report-cancel-btn">Cancel</button>
                  <button onClick={submitReport} disabled={!reportReason || submitting}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50" data-testid="report-submit-btn">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video widget — fixed bottom-right */}
      <div
        className={`fixed z-[70] transition-all duration-300 ease-in-out ${
          minimised
            ? 'bottom-4 right-4'
            : 'bottom-4 right-4'
        }`}
        data-testid="video-chat-widget"
      >
        {/* Overlay controls: minimize/report */}
        <div className="absolute top-2 left-2 z-10 flex gap-1.5" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setMinimised(m => !m)}
            className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-black/80 transition"
            title={minimised ? 'Expand' : 'Minimise'}
            data-testid="video-toggle-size"
          >
            {minimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="p-1.5 bg-orange-500/80 backdrop-blur rounded-lg text-white hover:bg-orange-600 transition"
            title="Report user"
            data-testid="video-report-btn"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ZegoCloud container — always mounted at a usable size */}
        <div
          ref={containerRef}
          className={`rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 transition-all duration-300 ease-in-out ${
            minimised ? 'cursor-pointer' : ''
          }`}
          style={{
            width: minimised ? '140px' : '340px',
            height: minimised ? '105px' : '280px',
          }}
          onClick={minimised ? () => setMinimised(false) : undefined}
          data-testid={minimised ? 'video-minimised' : 'video-expanded'}
        />
      </div>
    </>
  );
};

export default BattleVideoChat;
