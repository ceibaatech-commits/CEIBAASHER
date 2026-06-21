import React, { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const BattleReportModal = memo(function BattleReportModal({
  showReport,
  reportDone,
  setShowReport,
  setReportDone,
  setReportReason,
  setReportDesc,
  reportReason,
  REPORT_REASONS,
  reportDesc,
  submitReport,
  reportSubmitting,
  C,
}) {
  if (!showReport) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {reportDone ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Report Submitted</h3>
            <button
              onClick={() => {
                setShowReport(false);
                setReportDone(false);
                setReportReason('');
                setReportDesc('');
              }}
              className="mt-4 px-6 py-2 rounded-xl text-white font-semibold"
              style={{ background: C.blue }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><h3 className="font-bold">Report User</h3></div>
              <button onClick={() => setShowReport(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${reportReason === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                  <input type="radio" name="rr" checked={reportReason === r.id} onChange={() => setReportReason(r.id)} />
                  <span className="text-sm font-medium">{r.label}</span>
                </label>
              ))}
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Details..." rows={2} className="w-full p-3 border rounded-xl text-sm" />
            </div>
            <div className="p-4 border-t">
              <button onClick={submitReport} disabled={!reportReason || reportSubmitting} className="w-full py-2.5 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50">
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default BattleReportModal;
