import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const BATTLE_URL = window.location.origin;
const ROOM_CODE_LENGTH = 6;

const normalizeRoomCode = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);
const getJoinDisplayName = (playerName, user) => playerName.trim() || user?.name || user?.username || 'Player';

const JoinRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const prefilledPin = normalizeRoomCode(location.state?.prefilledPin || '');
  
  const [pin, setPin] = useState(prefilledPin);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication status (isAuthenticated is a function)
  const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Pre-fill player name from user data
  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  // Show login required screen if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <Header />
        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 text-sm mb-5">
              Please login or create an account to join quiz rooms.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                className="w-full h-11 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-all"
              >
                Login to Continue
              </button>
              <button
                onClick={() => navigate('/signup', { state: { from: location.pathname } })}
                className="w-full h-11 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full text-gray-500 py-1.5 text-xs hover:text-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleJoinRoom = async () => {
    // Clear previous errors
    setError('');
    
    // Validation
    const normalizedPin = normalizeRoomCode(pin);

    if (!normalizedPin) {
      setError('Please enter a room code');
      return;
    }

    if (normalizedPin.length !== ROOM_CODE_LENGTH) {
      setError('Room code must be 6 letters or numbers');
      return;
    }

    const joinDisplayName = getJoinDisplayName(playerName, user);

    setLoading(true);
    console.log('[JOIN] Attempting to join room:', normalizedPin);
    
    try {
      // Add timeout to prevent indefinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Check if room exists using NEW REST API
      const response = await axios.get(`${BATTLE_URL}/api/battle/async/rooms/${normalizedPin}`, {
        signal: controller.signal,
        timeout: 10000 // 10 seconds
      });
      
      clearTimeout(timeoutId);
      console.log('[JOIN] Room response:', response.data);
      
      if (response.data.success) {
        console.log('[JOIN] Room found via NEW REST API, navigating directly to quiz (AUTO-START)');
        // AUTO-START: Skip lobby, go directly to quiz with REST API
        navigate(`/live-battle/${normalizedPin}`, { 
          state: { 
            isHost: false, 
            playerName: joinDisplayName,
            autoJoin: true // Triggers REST API join with auto-start
          } 
        });
      } else {
        setError(response.data.message || 'Unable to join room');
        console.error('[JOIN] Room check failed:', response.data);
      }
    } catch (error) {
      console.error('[JOIN ERROR]', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError('Connection timeout. Please check your internet and try again.');
      } else if (error.name === 'AbortError') {
        setError('Request timed out. Server may be slow or unavailable.');
      } else if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const detail = error.response.data?.detail;
        
        if (status === 404) {
          try {
            const socialResponse = await axios.get(`${BATTLE_URL}/api/social/quiz-rooms/${normalizedPin}`, {
              timeout: 10000,
            });

            if (socialResponse.data?.success) {
              navigate(`/quiz-room/${normalizedPin}`, {
                state: {
                  room: socialResponse.data.room,
                  questions: socialResponse.data.room?.questions || [],
                },
              });
              return;
            }
          } catch (socialError) {
            const socialStatus = socialError.response?.status;
            const socialDetail = socialError.response?.data?.detail;

            if (socialStatus === 410) {
              setError(socialDetail || 'This quiz room has expired.');
              return;
            }
            if (socialStatus === 403) {
              setError(socialDetail || 'You do not have access to this quiz room.');
              return;
            }
          }

          setError(`Room ${normalizedPin} not found. Please check the room code.`);
        } else if (status === 410) {
          setError(detail || 'This room has expired or already completed.');
        } else if (status === 403) {
          setError(detail || 'Unable to join this room.');
        } else if (status >= 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError(detail || 'Unable to join room. Please try again.');
        }
      } else if (error.request) {
        // Request made but no response
        setError('Cannot reach server. Please check your internet connection.');
      } else {
        // Something else went wrong
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      <div className="py-8">
      <div className="max-w-md mx-auto px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Room</h1>
            <p className="text-gray-600">Enter a battle PIN or quiz room code to join</p>
          </div>

          <div className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(normalizeRoomCode(e.target.value));
                  setError(''); // Clear error on input
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === ROOM_CODE_LENGTH) {
                    handleJoinRoom();
                  }
                }}
                placeholder="Enter 6-character code"
                maxLength={ROOM_CODE_LENGTH}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-2xl font-bold tracking-widest"
                disabled={loading}
                autoCapitalize="characters"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {pin.length}/{ROOM_CODE_LENGTH} characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (used for battles)
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError(''); // Clear error on input
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === ROOM_CODE_LENGTH) {
                    handleJoinRoom();
                  }
                }}
                placeholder="Optional for quiz rooms"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading || pin.length !== ROOM_CODE_LENGTH}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                'Join Room'
              )}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">Don&apos;t have a PIN?</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Browse Exams
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default JoinRoom;