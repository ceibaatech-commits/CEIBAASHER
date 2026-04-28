import React from 'react';
import { Zap, Flag, Clock } from 'lucide-react';

export const LiveBattlesTabs = ({ activeTab, setActiveTab, liveCount, pendingReportsCount }) => {
  const tabs = [
    { id: 'live',    label: 'Live Battles', icon: Zap,   count: liveCount },
    { id: 'reports', label: 'Reports',      icon: Flag,  count: pendingReportsCount },
    { id: 'history', label: 'History',      icon: Clock },
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              isActive ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid={`live-battles-tab-${tab.id}`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
