import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BATTLE_URL = process.env.REACT_APP_BACKEND_URL;

const JoinRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledPin = location.state?.prefilledPin || '';
  
  const [pin, setPin] = useState(prefilledPin);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async () => {
    // Clear previous errors
    setError('');
    
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Please login to join a room');
      navigate('/login');
      return;
    }
    
    // Validation
    if (!pin.trim() || !playerName.trim()) {
      setError('Please enter both PIN and your name');
      return;
    }

    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    console.log('[JOIN] Attempting to join room:', pin);
    
    try {
      // Add timeout to prevent indefinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Check if room exists using NEW REST API
      const response = await axios.get(`${BATTLE_URL}/api/battle/async/rooms/${pin}`, {
        signal: controller.signal,
        timeout: 10000 // 10 seconds
      });
      
      clearTimeout(timeoutId);
      console.log('[JOIN] Room response:', response.data);
      
      if (response.data.success) {
        console.log('[JOIN] Room found via NEW REST API, navigating directly to quiz (AUTO-START)');
        // AUTO-START: Skip lobby, go directly to quiz with REST API
        navigate(`/live-battle/${pin}`, { 
          state: { 
            isHost: false, 
            playerName: playerName,
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
          setError(`Room ${pin} not found. Please check the PIN.`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Battle</h1>
            <p className="text-gray-600">Enter the room PIN to join</p>
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
                Room PIN
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError(''); // Clear error on input
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === 6 && playerName.trim()) {
                    handleJoinRoom();
                  }
                }}
                placeholder="Enter 6-digit PIN"
                maxLength="6"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-2xl font-bold tracking-widest"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {pin.length}/6 digits
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError(''); // Clear error on input
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === 6 && playerName.trim()) {
                    handleJoinRoom();
                  }
                }}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading || pin.length !== 6 || !playerName.trim()}
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
            <p className="text-center text-sm text-gray-600 mb-4">Don't have a PIN?</p>
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
  );
};

export default JoinRoom;