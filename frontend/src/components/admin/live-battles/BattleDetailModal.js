import React from 'react';
import { XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const PlayerPill = ({ player }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-blue-600">{player.username?.charAt(0) || '?'}</span>
      </div>
      <span className="font-medium text-gray-900">{player.username}</span>
    </div>
    <span className="text-sm text-gray-600">Score: {player.score || 0}</span>
  </div>
);

export const BattleDetailModal = ({ battle, onClose, onTerminate }) => {
  if (!battle) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Battle Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="battle-modal-close">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Room ID</p>
            <p className="font-medium text-gray-900">{battle.room_id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Exam</p><p className="font-medium text-gray-900">{battle.exam}</p></div>
            <div><p className="text-sm text-gray-500">Subject</p><p className="font-medium text-gray-900">{battle.subject}</p></div>
          </div>
          <div><p className="text-sm text-gray-500">Status</p><StatusBadge status={battle.status} /></div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Players</p>
            <div className="space-y-2">
              {battle.players?.map((p, idx) => (
                <PlayerPill key={p.id || p.userId || `${battle.room_id}-p${idx}`} player={p} />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            <button
              onClick={() => { onTerminate(battle.id || battle.room_id); onClose(); }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >Terminate Battle</button>
          </div>
        </div>
      </div>
    </div>
  );
};
