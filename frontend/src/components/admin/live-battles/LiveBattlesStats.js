import React from 'react';
import { Zap, Users, Clock, Flag } from 'lucide-react';

const StatCard = ({ Icon, iconBg, iconColor, value, label }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${iconBg} rounded-lg`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

export const LiveBattlesStats = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard Icon={Zap}   iconBg="bg-green-100"  iconColor="text-green-600"  value={stats.active_battles}    label="Active Battles" />
      <StatCard Icon={Users} iconBg="bg-blue-100"   iconColor="text-blue-600"   value={stats.battles_today}     label="Today" />
      <StatCard Icon={Clock} iconBg="bg-purple-100" iconColor="text-purple-600" value={stats.battles_this_week} label="This Week" />
      <StatCard Icon={Flag}  iconBg="bg-red-100"    iconColor="text-red-600"    value={stats.pending_reports}   label="Pending Reports" />
    </div>
  );
};
