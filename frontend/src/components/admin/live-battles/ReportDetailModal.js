import React from 'react';
import { XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const REPORT_ACTIONS = [
  { label: 'Dismiss',       status: 'dismissed',    action: 'none',           cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { label: 'Warn User',     status: 'action_taken', action: 'warning',        cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { label: '7-Day Ban',     status: 'action_taken', action: 'temp_ban',       cls: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { label: 'Permanent Ban', status: 'action_taken', action: 'permanent_ban',  cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
];

const Field = ({ label, children }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    {children}
  </div>
);

export const ReportDetailModal = ({ report, onClose, onReview }) => {
  if (!report) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="report-modal-close">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Reported User"><p className="font-medium text-gray-900">{report.reported_user?.username}</p></Field>
          <Field label="Reported By"><p className="font-medium text-gray-900">{report.reported_by?.username}</p></Field>
          <Field label="Reason"><p className="font-medium text-gray-900 capitalize">{report.reason?.replace('_', ' ')}</p></Field>
          {report.description && <Field label="Description"><p className="text-gray-700">{report.description}</p></Field>}
          <Field label="Status"><StatusBadge status={report.status} /></Field>

          {report.evidence?.chat_messages?.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Chat Evidence</p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {report.evidence.chat_messages.map((msg, idx) => (
                  <div key={`${msg.sender}-${idx}`} className="text-sm mb-1">
                    <span className="font-medium">{msg.sender}:</span> {msg.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.status === 'pending' && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <p className="text-sm font-medium text-gray-700">Take Action</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => onReview(report.id, a.status, a.action)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${a.cls}`}
                  >{a.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
