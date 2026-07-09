import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, Hash, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BATTLE_URL = window.location.origin;
const ROOM_CODE_LENGTH = 6;
const normalizeRoomCode = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [showRoomSheet, setShowRoomSheet] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const leftNavItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/', activePaths: ['/'] },
    { id: 'practice', label: 'Practice', icon: BookOpen, path: '/chapter-tests', activePaths: ['/chapter-tests', '/exam', '/topic-quiz', '/solo-practice'] },
  ];
  const rightNavItems = [
    { id: 'capazoo', label: 'Capazoo', icon: Trophy, path: '/capazoo', activePaths: ['/capazoo', '/victory-lane'] },
    { id: 'profile', label: 'Profile', icon: User, path: typeof isAuthenticated === 'function' && isAuthenticated() ? `/profile/${user?.id}` : '/login', activePaths: ['/profile', '/login', '/signup'] },
  ];

  const isActive = (item) => {
    if (item.id === 'home') return location.pathname === '/';
    return item.activePaths.some(p => location.pathname.startsWith(p));
  };

  const isHome = location.pathname === '/';
  const isCapazoo = location.pathname.startsWith('/capazoo') || location.pathname.startsWith('/victory-lane');

  const centerLabel = isHome ? 'Join Room' : isCapazoo ? 'Create' : 'Create';
  const CenterIcon = isHome ? Hash : Plus;

  const handleCenterAction = () => {
    if (isHome) {
      setRoomCode('');
      setJoinError('');
      setShowRoomSheet(true);
    } else if (isCapazoo) {
      window.dispatchEvent(new CustomEvent('ceibaa:toggle-create-menu'));
    } else {
      navigate('/capazoo');
    }
  };

  const handleJoinRoom = async () => {
    setJoinError('');
    const code = normalizeRoomCode(roomCode);
    if (!code) { setJoinError('Enter a room code'); return; }
    if (code.length !== ROOM_CODE_LENGTH) { setJoinError('Room code must be 6 characters'); return; }

    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
    if (!isAuth) {
      setShowRoomSheet(false);
      navigate('/login', { state: { from: '/' } });
      return;
    }

    setJoining(true);
    try {
      const res = await axios.get(`${BATTLE_URL}/api/battle/async/rooms/${code}`, { timeout: 10000 });
      if (res.data.success) {
        setShowRoomSheet(false);
        navigate(`/live-battle/${code}`, {
          state: { isHost: false, playerName: user?.name || user?.username || 'Player', autoJoin: true },
        });
      } else {
        setJoinError(res.data.message || 'Room not found');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const socialRes = await axios.get(`${BATTLE_URL}/api/social/quiz-rooms/${code}`, { timeout: 10000 });
          if (socialRes.data?.success) {
            setShowRoomSheet(false);
            navigate(`/quiz-room/${code}`, {
              state: {
                room: socialRes.data.room,
                questions: socialRes.data.room?.questions || [],
              },
            });
            return;
          }
        } catch (socialErr) {
          if (socialErr.response?.status === 410) {
            setJoinError(socialErr.response?.data?.detail || 'This quiz room has expired.');
            return;
          }
          if (socialErr.response?.status === 403) {
            setJoinError(socialErr.response?.data?.detail || 'You do not have access to this quiz room.');
            return;
          }
        }
        setJoinError('Room not found. Check the code.');
      } else {
        setJoinError('Could not connect. Try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            active ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
          <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} fill={active ? 'currentColor' : 'none'} />
          {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600" />}
        </div>
        <span className={`text-[10px] mt-1 font-medium ${active ? 'text-violet-600' : 'text-gray-400'}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Room Code Bottom Sheet — Home only */}
      <AnimatePresence>
        {showRoomSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setShowRoomSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Join a Quiz Room</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Enter the 6-character room code</p>
                </div>
                <button
                  onClick={() => setShowRoomSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center -mt-1"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(normalizeRoomCode(e.target.value))}
                placeholder="• • • • • •"
                className="w-full text-center text-3xl font-black tracking-[0.5em] border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-2xl py-4 px-3 outline-none bg-gray-50 uppercase transition-colors mb-3"
                maxLength={ROOM_CODE_LENGTH}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />

              {joinError && (
                <p className="text-red-500 text-sm text-center mb-3 font-medium">{joinError}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleJoinRoom}
                disabled={joining || roomCode.length !== ROOM_CODE_LENGTH}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ boxShadow: '0 4px 18px rgba(109,40,217,0.35)' }}
              >
                {joining ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                ) : (
                  <><span className="text-xl leading-none">🪂</span> Join Room</>
                )}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav
        data-mobile-bottom-nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom"
        style={{ overflow: 'visible' }}
      >
        {/* Center action button — sits half above the nav border */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ top: '-26px' }}
        >
          <motion.button
            onClick={handleCenterAction}
            whileTap={{ scale: 0.88 }}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-600 relative"
            style={{ boxShadow: '0 4px 18px rgba(147,51,234,0.45)' }}
            aria-label={centerLabel}
          >
            <CenterIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.button>
          <span className="text-[9px] font-semibold text-purple-600 mt-1 leading-none">{centerLabel}</span>
        </div>

        {/* Nav row: Left items | spacer | Right items */}
        <div className="flex items-center h-16 px-1">
          {leftNavItems.map(renderNavItem)}
          <div className="w-20 flex-shrink-0" />
          {rightNavItems.map(renderNavItem)}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
