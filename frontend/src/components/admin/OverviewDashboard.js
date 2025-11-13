import React from 'react';
import { TrendingUp, Users, FileText, Award } from 'lucide-react';

const OverviewDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Posts</p>
              <p className="text-2xl font-bold">567</p>
            </div>
            <FileText className="w-10 h-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Battles</p>
              <p className="text-2xl font-bold">89</p>
            </div>
            <Award className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Growth</p>
              <p className="text-2xl font-bold">+12%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-600">Overview dashboard content coming soon...</p>
      </div>
    </div>
  );
};

export default OverviewDashboard;
