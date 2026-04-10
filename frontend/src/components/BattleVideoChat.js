import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import {
  Flag, X, AlertTriangle, Minimize2, Maximize2, Loader2
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

  const [minimised, setMinimised] = useState(true);
  const [ready, setReady] = useState(false);

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportId, setReportId] = useState(null);

  // Initialize ZegoCloud once when roomId + playerName + container are all available
  useEffect(() => {
    if (!roomId || !playerName || !containerRef.current) return;
    if (initDone.current) return;
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      console.error('ZegoCloud credentials missing');
      return;
    }

    initDone.current = true;

    // Generate a stable-ish userID from playerName + timestamp
    const userID = `${playerName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    // ZegoCloud room IDs must be alphanumeric
    const zegoRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '');

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
        showRoomTimer: true,
        onLeaveRoom: () => {
          setReady(false);
        },
        onJoinRoom: () => {
          setReady(true);
        },
      });

      setReady(true);
    } catch (err) {
      console.error('ZegoCloud init error:', err);
      toast.error('Failed to start video call');
    }

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
        initDone.current = false;
      }
    };
  }, [roomId, playerName]);

  // Report submission
  const submitReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/admin/battles/report`,
        {
          battle_id: roomId,
          room_id: roomId,
          reported_user_id: opponentId || 'unknown',
          reported_username: opponentName || 'Opponent',
          reason: reportReason,
          description: reportDesc,
          chat_messages: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReportId(res.data.report_id);
        setReportDone(true);
      }
    } catch (e) {
      console.error('Failed to submit report:', e);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportDone(false);
    setReportId(null);
    setReportReason('');
    setReportDesc('');
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

      {/* Video widget */}
      <div className="fixed bottom-4 right-4 z-[70]" data-testid="video-chat-widget">
        {/* Top controls: minimize/maximize + report */}
        <div className="flex justify-end mb-1.5 gap-1.5">
          <button
            onClick={() => setMinimised(m => !m)}
            className="p-2 bg-gray-800/80 backdrop-blur rounded-full text-white hover:bg-gray-700 transition shadow-lg"
            title={minimised ? 'Expand video' : 'Minimise video'}
            data-testid="video-toggle-size"
          >
            {minimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="p-2 bg-orange-500/80 backdrop-blur rounded-full text-white hover:bg-orange-600 transition shadow-lg"
            title="Report user"
            data-testid="video-report-btn"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* ZegoCloud container — always mounted, CSS controls size */}
        <div
          ref={containerRef}
          className={`rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 transition-all duration-300 ease-in-out ${
            minimised
              ? 'w-32 h-24 cursor-pointer'
              : 'w-[340px] sm:w-[420px]'
          }`}
          style={minimised ? {} : { height: '320px' }}
          onClick={minimised ? () => setMinimised(false) : undefined}
          data-testid={minimised ? 'video-minimised' : 'video-expanded'}
        >
          {/* Loading state before ZegoCloud renders */}
          {!ready && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BattleVideoChat;
