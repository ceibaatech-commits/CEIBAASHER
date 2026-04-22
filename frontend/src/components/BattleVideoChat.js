import React, { useState, useEffect } from 'react';
import AgoraUIKit from 'agora-react-uikit';
import { Flag, X, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const AGORA_APP_ID = 'f512a6c76b5a4e0abd193119f3ba22fe';

const REPORT_REASONS = [
  { id: 'nudity', label: 'Nudity / Sexual Content', description: 'Showing private parts or sexual behaviour' },
  { id: 'harassment', label: 'Harassment / Bullying', description: 'Verbal abuse or threatening behaviour' },
  { id: 'offensive_content', label: 'Offensive Content', description: 'Hate speech, slurs, or discriminatory behaviour' },
  { id: 'cheating', label: 'Cheating', description: 'Using unfair means to win' },
  { id: 'inappropriate_behavior', label: 'Other Inappropriate Behaviour', description: 'Any other concerning behaviour' },
];

const BattleVideoChat = ({ socket, roomId, playerName, opponentName, opponentId }) => {
  const [minimised, setMinimised] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportId, setReportId] = useState(null);
  
  const [agoraToken, setAgoraToken] = useState(null);
  const [vcReady, setVcReady] = useState(false);

  const sanitizedChannel = roomId?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64) || '';

  useEffect(() => {
    let isMounted = true; // Guard to prevent state updates after unmount
    if (!sanitizedChannel) return;
    
    const fetchToken = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.get(`${API_URL}/api/agora/token?channel=${sanitizedChannel}`, { headers });
        
        if (isMounted) {
          if (data && data.token) {
            setAgoraToken(data.token);
            setVcReady(true);
          } else {
            console.warn('[Agora] Received empty token from server');
            setVcReady(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Agora] Token fetch failed:', err);
          setAgoraToken(null);
          setVcReady(false);
        }
      }
    };

    fetchToken();

    return () => {
      isMounted = false; // Set to false when component unmounts
      setVcReady(false);
      setAgoraToken(null);
    };
  }, [sanitizedChannel]);

  const rtcProps = {
    appId: AGORA_APP_ID,
    channel: sanitizedChannel || 'loading-room',
    token: agoraToken,
    role: 'host',
    layout: 1,
  };

  const callbacks = {
    EndCall: () => {
      setVcReady(false);
    },
  };

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
      toast.error('Failed to submit report.');
    } finally { setSubmitting(false); }
  };

  const closeReport = () => {
    setShowReport(false); setReportDone(false);
    setReportId(null); setReportReason(''); setReportDesc('');
  };

  if (!socket) return null;

  return (
    <>
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                {reportDone ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
                        <button onClick={closeReport} className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <h3 className="font-bold">Report User</h3>
                            </div>
                            <button onClick={closeReport}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-4 space-y-3 text-left">
                            {REPORT_REASONS.map(r => (
                                <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                    <input type="radio" name="report_reason" checked={reportReason === r.id} onChange={() => setReportReason(r.id)} />
                                    <div>
                                        <p className="font-medium text-sm">{r.label}</p>
                                        <p className="text-xs text-gray-500">{r.description}</p>
                                    </div>
                                </label>
                            ))}
                            <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Additional details..." rows={3} className="w-full p-3 border rounded-xl text-sm" />
                        </div>
                        <div className="flex gap-3 p-4 border-t">
                            <button onClick={submitReport} disabled={!reportReason || submitting} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium">
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[70]">
        <div className="absolute top-2 left-2 z-[80] flex gap-1.5">
          <button onClick={() => setMinimised(!minimised)} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white">
            {minimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setShowReport(true)} className="p-1.5 bg-orange-500/80 backdrop-blur rounded-lg text-white">
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 transition-all duration-300"
          style={{ width: minimised ? '140px' : '340px', height: minimised ? '105px' : '280px' }}
        >
          {vcReady && agoraToken ? (
            <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-xs px-4 text-center">
              <div className="space-y-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Establishing secure connection...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BattleVideoChat;