import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Trophy, Copy, Check } from 'lucide-react';
import axios from 'axios';

const BATTLE_URL = process.env.REACT_APP_BACKEND_URL;

const CreateRoom = () => {
  const { examId, subject, topic } = useParams();
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      alert('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BATTLE_URL}/api/battle/create-room`, {
        hostName,
        examId,
        subject,
        topic
      });

      if (response.data.success) {
        setRoom(response.data);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPIN = () => {
    navigator.clipboard.writeText(room.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinLobby = () => {
    navigate(`/battle-lobby/${room.pin}`, {
      state: { hostName, isHost: true }
    });
  };

  if (room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Created!</h1>
              <p className="text-gray-600">Share this PIN with your friends</p>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Room PIN</p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-5xl font-bold text-purple-600 tracking-wider">
                    {room.pin}
                  </div>
                  <button
                    onClick={copyPIN}
                    className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-purple-600" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Battle Details</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>📚 <strong>Exam:</strong> {examId}</p>
                <p>📖 <strong>Subject:</strong> {subject}</p>
                <p>🎯 <strong>Topic:</strong> {topic}</p>
                <p>👤 <strong>Host:</strong> {hostName}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">How it works:</h4>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Share the PIN with your friends</li>
                <li>Wait for them to join in the lobby</li>
                <li>Start the quiz when everyone is ready</li>
                <li>Compete in real-time and see who wins!</li>
              </ol>
            </div>

            <button
              onClick={joinLobby}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Enter Lobby →
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 text-gray-600 hover:text-gray-900 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Battle Room</h1>
            <p className="text-gray-600">Host a multiplayer quiz battle</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Battle Details</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>📚 <strong>Exam:</strong> {examId}</p>
              <p>📖 <strong>Subject:</strong> {subject}</p>
              <p>🎯 <strong>Topic:</strong> {topic}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Host)
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              autoFocus
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={loading || !hostName.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating Room...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
