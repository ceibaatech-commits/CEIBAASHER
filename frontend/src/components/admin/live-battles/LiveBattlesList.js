import React from 'react';
import { Zap, Eye, Ban, RefreshCw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const PlayerAvatar = ({ player }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
      <span className="text-sm font-medium text-blue-600">{player.username?.charAt(0) || '?'}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900">{player.username || 'Unknown'}</p>
      <p className="text-xs text-gray-500">Score: {player.score || 0}</p>
    </div>
  </div>
);

const BattleRow = ({ battle, onView, onTerminate }) => (
  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-green-100 rounded-lg"><Zap className="w-5 h-5 text-green-600" /></div>
        <div>
          <p className="font-medium text-gray-900">{battle.room_id}</p>
          <p className="text-sm text-gray-500">{battle.exam} • {battle.subject}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{battle.players?.length || 2} players</p>
          <StatusBadge status={battle.status} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onView(battle)} className="p-2 hover:bg-white rounded-lg transition-colors" title="View Details">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => onTerminate(battle.id || battle.room_id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Terminate Battle">
            <Ban className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
    {battle.players?.length > 0 && (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex gap-4">
          {battle.players.map((p, idx) => (
            <PlayerAvatar key={p.id || p.userId || `${battle.room_id}-p${idx}`} player={p} />
          ))}
        </div>
      </div>
    )}
  </div>
);

export const LiveBattlesList = ({ battles, onView, onTerminate, onRefresh }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">Active Battles</h3>
      <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        <RefreshCw className="w-4 h-4" />Refresh
      </button>
    </div>
    {battles.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No active battles at the moment</p>
      </div>
    ) : (
      <div className="space-y-3">
        {battles.map(b => (
          <BattleRow key={b.id || b.room_id} battle={b} onView={onView} onTerminate={onTerminate} />
        ))}
      </div>
    )}
  </div>
);
