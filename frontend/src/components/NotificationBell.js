import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
      title="Notifications"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
