import React from 'react';
import { Users as UsersIcon, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const StatCard = ({ label, value, Icon, borderColor, iconBg, iconColor, testId }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${borderColor}`} data-testid={testId}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  </div>
);

export const UserStatsCards = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <StatCard label="Total Users" value={stats.total} Icon={UsersIcon}
      borderColor="border-blue-500" iconBg="bg-blue-100" iconColor="text-blue-600"
      testId="stat-total-users" />
    <StatCard label="Online Now" value={stats.online} Icon={CheckCircle}
      borderColor="border-green-500" iconBg="bg-green-100" iconColor="text-green-600"
      testId="stat-online-users" />
    <StatCard label="Offline" value={stats.offline} Icon={XCircle}
      borderColor="border-gray-500" iconBg="bg-gray-100" iconColor="text-gray-600"
      testId="stat-offline-users" />
    <StatCard label="New Today" value={stats.newToday} Icon={TrendingUp}
      borderColor="border-purple-500" iconBg="bg-purple-100" iconColor="text-purple-600"
      testId="stat-new-today-users" />
  </div>
);
