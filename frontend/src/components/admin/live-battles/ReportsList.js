import React from 'react';
import { Flag, ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const ReportRow = ({ report, onSelect }) => (
  <div
    className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer ${
      report.status === 'pending' ? 'border-l-4 border-orange-500' : ''
    }`}
    onClick={() => onSelect(report)}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${report.status === 'pending' ? 'bg-orange-100' : 'bg-gray-200'}`}>
          <Flag className={`w-5 h-5 ${report.status === 'pending' ? 'text-orange-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{report.reported_user?.username || 'Unknown User'}</p>
          <p className="text-sm text-gray-500">Reported by: {report.reported_by?.username || 'Anonymous'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700 capitalize">{report.reason?.replace('_', ' ')}</p>
          <StatusBadge status={report.status} />
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </div>
    </div>
    {report.description && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{report.description}</p>}
  </div>
);

export const ReportsList = ({ reports, filteredReports, filterStatus, setFilterStatus, onSelect }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">Battle Reports</h3>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="reviewed">Reviewed</option>
        <option value="action_taken">Action Taken</option>
        <option value="dismissed">Dismissed</option>
      </select>
    </div>
    {reports.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No reports found</p>
      </div>
    ) : (
      <div className="space-y-3">
        {filteredReports.map(r => <ReportRow key={r.id} report={r} onSelect={onSelect} />)}
      </div>
    )}
  </div>
);
