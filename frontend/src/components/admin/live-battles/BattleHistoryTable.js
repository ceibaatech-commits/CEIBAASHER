import React from 'react';
import { Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const HEADERS = ['Room ID', 'Players', 'Exam', 'Status', 'Duration', 'Date'];

export const BattleHistoryTable = ({ history, filterStatus, setFilterStatus }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">Battle History</h3>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="completed">Completed</option>
        <option value="terminated">Terminated</option>
      </select>
    </div>
    {history.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No battle history found</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
              {HEADERS.map(h => <th key={h} className="pb-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="py-3 text-sm font-medium text-gray-900">{b.room_id?.slice(0, 15)}...</td>
                <td className="py-3 text-sm text-gray-600">{b.players?.length || 0} players</td>
                <td className="py-3 text-sm text-gray-600">{b.exam}</td>
                <td className="py-3"><StatusBadge status={b.status} /></td>
                <td className="py-3 text-sm text-gray-600">{b.duration_seconds ? `${Math.floor(b.duration_seconds / 60)}m` : '-'}</td>
                <td className="py-3 text-sm text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
