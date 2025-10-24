import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Trophy, Copy, Check } from 'lucide-react';
import axios from 'axios';

const BATTLE_URL = 'http://localhost:5001';

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

  const goToLobby = () => {
    navigate(`/battle-lobby/${room.pin}`, { state: { isHost: true, hostName } });
  };

  if (room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Created!</h1>
            <p className="text-gray-600">Share this PIN with your friends</p>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6">
            <p className="text-center text-sm text-gray-600 mb-2">Room PIN</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="text-5xl font-black text-purple-600 tracking-widest">
                {room.pin}
              </div>
              <button
                onClick={copyPIN}
                className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exam:</span>
              <span className="font-semibold text-gray-900">{examId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subject:</span>
              <span className="font-semibold text-gray-900">{subject}</span>
            </div>
            {topic && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Topic:</span>
                <span className="font-semibold text-gray-900">{topic}</span>
              </div>
            )}
          </div>

          <button
            onClick={goToLobby}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all"
          >
            Enter Lobby →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Battle Room</h1>
            <p className="text-gray-600">Host a live quiz battle</p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
            <div className="flex items-start space-x-3">
              <Trophy className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">Battle Details:</h3>
                <p className="text-sm text-purple-800">Exam: <strong>{examId}</strong></p>
                <p className="text-sm text-purple-800">Subject: <strong>{subject}</strong></p>
                {topic && <p className="text-sm text-purple-800">Topic: <strong>{topic}</strong></p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Host)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">1</span>
                  <p>Create room and get a 6-digit PIN</p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">2</span>
                  <p>Share PIN with friends</p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">3</span>
                  <p>Wait for players in lobby</p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">4</span>
                  <p>Start quiz and compete in real-time!</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={loading || !hostName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Room...' : 'Create Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;