import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, Check, X, Download, Share2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RoomDetail = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('ceibaa_user');
    if (!userStr) {
      alert('Please login to view room details');
      navigate('/login');
      return;
    }
    fetchRoomDetail();
  }, [pin]);

  const fetchRoomDetail = async () => {
    try {
      const userStr = localStorage.getItem('ceibaa_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const roomResponse = await axios.get(`${BACKEND_URL}/api/battle/async/rooms/${pin}`);
      const leaderboardResponse = await axios.get(`${BACKEND_URL}/api/battle/async/rooms/${pin}/leaderboard`);
      const submissionResponse = await axios.get(`${BACKEND_URL}/api/battle/async/rooms/${pin}/submission/${user.id}`);

      if (roomResponse.data.success) {
        setRoomData(roomResponse.data.room);
      }
      
      if (leaderboardResponse.data.success) {
        setLeaderboard(leaderboardResponse.data.leaderboard);
      }

      if (submissionResponse.data.success) {
        setMySubmission(submissionResponse.data.submission);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  const shareResults = async () => {
    const text = `Check out my performance in Quiz Room ${pin}! ${mySubmission ? `I scored ${mySubmission.total_score} points!` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quiz Room Details', text });
      } catch (error) {
        navigator.clipboard.writeText(text);
        alert('Results copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Room not found</p>
          <button
            onClick={() => navigate('/profile/board')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            Back to Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/profile/board')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Board
          </button>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={shareResults}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl">
              <div className="text-sm opacity-75">Room PIN</div>
              <div className="text-3xl font-bold font-mono">{pin}</div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{roomData.exam_category}</h1>
              <p className="text-gray-600">{roomData.subject}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-900">{roomData.participant_count}</div>
              <div className="text-sm text-blue-700">Participants</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-900">{roomData.submission_count}</div>
              <div className="text-sm text-green-700">Submissions</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-900">{roomData.questions?.length || 0}</div>
              <div className="text-sm text-purple-700">Questions</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-orange-900">{roomData.time_per_question}s</div>
              <div className="text-sm text-orange-700">Per Question</div>
            </div>
          </div>
        </div>

        {mySubmission && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              My Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-yellow-900 mb-1">#{mySubmission.rank || 'N/A'}</div>
                <div className="text-sm text-yellow-700">Rank</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-900 mb-1">{mySubmission.total_score}</div>
                <div className="text-sm text-blue-700">Total Score</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-900 mb-1">
                  {Math.floor(mySubmission.total_time / 60)}:{(mySubmission.total_time % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-purple-700">Time Taken</div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Question-by-Question Analysis</h3>
            <div className="space-y-3">
              {mySubmission.answers.map((answer, index) => {
                const question = roomData.questions?.find(q => q.id === answer.question_id);
                return (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-4 ${
                      answer.is_correct
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {answer.is_correct ? (
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-2">
                          Q{index + 1}: {question?.question || 'Question not available'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Your Answer: </span>
                            <span className="font-semibold">{question?.options[answer.selected_answer] || 'N/A'}</span>
                          </div>
                          {!answer.is_correct && question && (
                            <div>
                              <span className="text-gray-600">Correct Answer: </span>
                              <span className="font-semibold text-green-700">{question.options[question.correctAnswer] || 'N/A'}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Time: </span>
                            <span className="font-semibold">{answer.time_spent}s</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Points: </span>
                            <span className="font-semibold text-blue-700">+{answer.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Full Leaderboard
          </h2>
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  mySubmission && player.player_id === mySubmission.player_id
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 w-12 text-center">
                  {index === 0 && <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />}
                  {index === 1 && <Trophy className="w-8 h-8 text-gray-400 mx-auto" />}
                  {index === 2 && <Trophy className="w-8 h-8 text-orange-600 mx-auto" />}
                  {index > 2 && <span className="text-lg font-bold text-gray-600">#{index + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{player.player_name}</div>
                  <div className="text-sm text-gray-600">
                    Time: {Math.floor(player.total_time / 60)}:{(player.total_time % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{player.total_score}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
