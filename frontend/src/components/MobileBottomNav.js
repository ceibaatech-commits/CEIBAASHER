import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      path: '/',
      activePaths: ['/']
    },
    { 
      id: 'practice', 
      label: 'Practice', 
      icon: BookOpen, 
      path: '/chapter-tests',
      activePaths: ['/chapter-tests', '/exam', '/topic-quiz', '/solo-practice']
    },
    { 
      id: 'victory', 
      label: 'Victory', 
      icon: Trophy, 
      path: '/victory-lane',
      activePaths: ['/victory-lane']
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: isAuthenticated() ? `/profile/${user?.id}` : '/login',
      activePaths: ['/profile', '/login', '/signup']
    },
  ];

  const isActive = (item) => {
    if (item.id === 'home') {
      return location.pathname === '/';
    }
    return item.activePaths.some(path => location.pathname.startsWith(path));
  };

  return (
    <nav data-mobile-bottom-nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                active 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                <Icon 
                  className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} 
                  fill={active ? 'currentColor' : 'none'}
                />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
