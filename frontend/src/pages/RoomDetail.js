import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, Check, X, Download, Share2, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';

const BACKEND_URL = window.location.origin;

const RoomDetail = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [followStatus, setFollowStatus] = useState({});
  const [actionBusy, setActionBusy] = useState({});

  useEffect(() => {
    const userStr = localStorage.getItem('ceibaa_user');
    if (!userStr) {
      alert('Please login to view room details');
      navigate('/login');
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch (err) {
      console.error('Error parsing user:', err);
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

      // Pre-fetch follow status for everyone in the leaderboard (excluding self)
      try {
        const lb = leaderboardResponse.data.leaderboard || [];
        if (user) {
          const others = lb.filter(p => p.player_id && p.player_id !== user.id);
          const statusEntries = await Promise.all(
            others.map(async (p) => {
              try {
                const r = await axios.get(`${BACKEND_URL}/api/profile/follow-status/${p.player_id}`);
                return [p.player_id, r.data?.status || null];
              } catch (_e) {
                return [p.player_id, null];
              }
            })
          );
          setFollowStatus(Object.fromEntries(statusEntries));
        }
      } catch (statusErr) {
        console.warn('Could not pre-fetch follow status:', statusErr);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!targetUserId || targetUserId === user?.id) return;
    if (!user) {
      alert('Please login to follow users');
      navigate('/login');
      return;
    }
    setActionBusy((prev) => ({ ...prev, [`follow-${targetUserId}`]: true }));
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/profile/follow`,
        { target_user_id: targetUserId }
      );
      if (res.data?.success !== false) {
        const newStatus = res.data?.status || 'approved';
        setFollowStatus((prev) => ({ ...prev, [targetUserId]: newStatus }));
      } else if (res.data?.message) {
        alert(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to follow user';
      alert(msg);
    } finally {
      setActionBusy((prev) => ({ ...prev, [`follow-${targetUserId}`]: false }));
    }
  };

  const handleMessage = async (targetUserId) => {
    if (!targetUserId || targetUserId === user?.id) return;
    if (!user) {
      alert('Please login to message users');
      navigate('/login');
      return;
    }
    setActionBusy((prev) => ({ ...prev, [`msg-${targetUserId}`]: true }));
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/messages/conversations`,
        { target_user_id: targetUserId }
      );
      const convId = res.data?.conversation?.id;
      if (convId) {
        navigate(`/messages/${convId}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to open conversation';
      alert(msg);
    } finally {
      setActionBusy((prev) => ({ ...prev, [`msg-${targetUserId}`]: false }));
    }
  };

  const downloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  const shareResults = async () => {
    const text = `Check out my performance in Quiz Room ${pin}! ${mySubmission ? `I scored ${mySubmission.total_score} points!` : ''}`;
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quiz Room Details', text });
        return;
      } catch (error) {
        console.log('Share failed, will try clipboard');
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    } catch (error) {
      // Fallback for clipboard permission denied
      console.error('Clipboard error:', error);
      // Create temporary textarea for manual copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('Results copied to clipboard!');
      } catch (err) {
        alert('Please manually copy: ' + text);
      }
      document.body.removeChild(textarea);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header isLoggedIn={!!user} user={user} onLogout={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('ceibaa_user'); navigate('/login'); }} />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header isLoggedIn={!!user} user={user} onLogout={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('ceibaa_user'); navigate('/login'); }} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-xl text-gray-700 mb-4">Room not found</p>
            <button
              onClick={() => navigate('/profile/board')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
              data-testid="room-not-found-back-btn"
            >
              Back to Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header isLoggedIn={!!user} user={user} onLogout={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('ceibaa_user'); navigate('/login'); }} />
      <div className="max-w-6xl mx-auto py-8 px-4" data-testid="room-detail-container">
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
                    key={answer.question_id || `answer-${index}`}
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
            {leaderboard.map((player, index) => {
              const isSelf = player.player_id && user?.id === player.player_id;
              const fStatus = followStatus[player.player_id];
              const followBusy = !!actionBusy[`follow-${player.player_id}`];
              const msgBusy = !!actionBusy[`msg-${player.player_id}`];
              const followLabel = fStatus === 'approved'
                ? 'Following'
                : fStatus === 'pending'
                  ? 'Requested'
                  : 'Follow';
              const FollowIcon = fStatus === 'approved' ? UserCheck : UserPlus;
              return (
                <div
                  key={player.player_id || `lb-${index}`}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-all ${
                    mySubmission && player.player_id === mySubmission.player_id
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400'
                      : 'bg-gray-50'
                  }`}
                  data-testid={`leaderboard-row-${index}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 text-center">
                      {index === 0 && <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />}
                      {index === 1 && <Trophy className="w-8 h-8 text-gray-400 mx-auto" />}
                      {index === 2 && <Trophy className="w-8 h-8 text-orange-600 mx-auto" />}
                      {index > 2 && <span className="text-lg font-bold text-gray-600">#{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {player.player_name}
                        {isSelf && <span className="ml-2 text-xs font-normal text-purple-700">(You)</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        Time: {Math.floor(player.total_time / 60)}:{(player.total_time % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-900">{player.total_score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>

                  {/* Follow + Message actions for non-self players */}
                  {!isSelf && player.player_id && (
                    <div className="flex gap-2 sm:ml-2 flex-shrink-0" data-testid={`leaderboard-actions-${index}`}>
                      <button
                        type="button"
                        onClick={() => handleFollow(player.player_id)}
                        disabled={followBusy || fStatus === 'approved' || fStatus === 'pending'}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          fStatus === 'approved'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : fStatus === 'pending'
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50'
                        }`}
                        data-testid={`follow-btn-${index}`}
                      >
                        <FollowIcon className="w-4 h-4" />
                        {followBusy ? '...' : followLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMessage(player.player_id)}
                        disabled={msgBusy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        data-testid={`message-btn-${index}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {msgBusy ? '...' : 'Message'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
