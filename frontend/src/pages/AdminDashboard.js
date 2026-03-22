import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, DollarSign, Settings, 
  LogOut, Menu, X, TrendingUp, Activity, Shield, Bell,
  BookOpen, MessageSquare, BarChart3, Globe, Award, GraduationCap,
  AlertCircle, CheckCircle, Clock, Zap, Target, Layers, Briefcase
} from 'lucide-react';

// Import dashboard sections (we'll create these)
import OverviewDashboard from '../components/admin/OverviewDashboard';
import UserManagement from '../components/admin/UserManagement';
import ContentModeration from '../components/admin/ContentModeration';
import RevenueManagement from '../components/admin/RevenueManagement';
import SystemSettings from '../components/admin/SystemSettings';
import ExamSheetManager from '../components/admin/ExamSheetManager';
import ExamCategoryManager from '../components/admin/ExamCategoryManager';
import SupportPanel from '../components/admin/SupportPanel';
import EmployeeManager from '../components/admin/EmployeeManager';
import LiveBattlesManager from '../components/admin/LiveBattlesManager';
import ProgramsManager from '../components/admin/ProgramsManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [adminUser, setAdminUser] = useState(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('ceibaa_admin_token');
    const user = localStorage.getItem('ceibaa_admin_user');
    
    if (!token) {
      navigate('/admin');
      return;
    }
    
    if (user) {
      try {
        setAdminUser(JSON.parse(user));
      } catch(e) {
        navigate('/admin');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('ceibaa_admin_token');
      localStorage.removeItem('ceibaa_admin_user');
      navigate('/admin');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'blue' },
    { id: 'users', label: 'User Management', icon: Users, color: 'green' },
    { id: 'employees', label: 'Employee Portal', icon: Briefcase, color: 'violet' },
    { id: 'sheets', label: 'Exam Sheet Manager', icon: BookOpen, color: 'indigo' },
    { id: 'exams', label: 'Exam & Categories', icon: Layers, color: 'purple' },
    { id: 'content', label: 'Content Moderation', icon: FileText, color: 'purple' },
    { id: 'revenue', label: 'Revenue & Finance', icon: DollarSign, color: 'yellow' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'pink' },
    { id: 'battles', label: 'Live Battles', icon: Zap, color: 'red' },
    { id: 'programs', label: 'Programs', icon: GraduationCap, color: 'violet' },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare, color: 'teal' },
    { id: 'settings', label: 'System Settings', icon: Settings, color: 'gray' },
  ];

  const renderSection = () => {
    switch(activeSection) {
      case 'overview':
        return <OverviewDashboard />;
      case 'users':
        return <UserManagement />;
      case 'employees':
        return <EmployeeManager />;
      case 'sheets':
        return <ExamSheetManager />;
      case 'exams':
        return <ExamCategoryManager />;
      case 'content':
        return <ContentModeration />;
      case 'revenue':
        return <RevenueManagement />;
      case 'battles':
        return <LiveBattlesManager />;
      case 'programs':
        return <ProgramsManager />;
      case 'support':
        return <SupportPanel />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <OverviewDashboard />;
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-500" />
                <span className="text-white font-bold text-lg">Ceibaa Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white border-r-4 border-blue-400' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Admin Profile & Logout */}
        <div className="border-t border-gray-800 p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-white font-semibold text-sm">{adminUser.username}</p>
                <p className="text-gray-400 text-xs">{adminUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-white mx-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-500 text-sm">Manage and monitor your platform</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">System Status</p>
                  <p className="text-sm font-bold text-green-600">All Systems Operational</p>
                </div>
              </div>
              
              <button className="relative p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
