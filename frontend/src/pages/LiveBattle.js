import React from 'react';
import { Pause, SkipForward, X, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

// Import custom hook
import useLiveBattle from '../components/battle/useLiveBattle';

// Import modular battle components
import QuestionDisplay from '../components/battle/QuestionDisplay';
import HostControls from '../components/battle/HostControls';
import AllQuestionsView from '../components/battle/AllQuestionsView';
import LeaderboardPanel from '../components/battle/LeaderboardPanel';
import RoomInfoPanel from '../components/battle/RoomInfoPanel';
import LiveBattleChat from '../components/battle/LiveBattleChat';
import ReactionsOverlay from '../components/battle/ReactionsOverlay';
import GiftMenuModal from '../components/battle/GiftMenuModal';

const LiveBattle = () => {
  const {
    pin,
    playerName,
    user,
    isAuthenticated,
    socket,
    allQuestions,
    currentQuestionIndex,
    currentQuestion,
    setCurrentQuestionIndex,
    setCurrentQuestion,
    questionNumber,
    setQuestionNumber,
    totalQuestions,
    timeLeft,
    selectedAnswer,
    setSelectedAnswer,
    leaderboard,
    myScore,
    isPaused,
    answerResult,
    setAnswerResult,
    participants,
    loading,
    quizStarted,
    chatMessages,
    chatInput,
    setChatInput,
    showChat,
    setShowChat,
    reactions,
    showGiftMenu,
    setShowGiftMenu,
    selectedGiftRecipient,
    setSelectedGiftRecipient,
    giftNotification,
    followingStatus,
    chatEndRef,
    handleAnswerSelect,
    pauseQuiz,
    resumeQuiz,
    skipQuestion,
    performSkipQuestion,
    nextQuestion,
    endQuiz,
    performEndQuiz,
    showQuitConfirm,
    setShowQuitConfirm,
    quitQuiz,
    performQuit,
    handleFollow,
    sendMessage,
    sendReaction,
    sendGift,
    hostActionConfirm,
    setHostActionConfirm,
    isHost,
    myRank,
  } = useLiveBattle();

  if (!currentQuestion) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-4">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Loading State - Questions are being downloaded */}
        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-semibold">Downloading quiz questions...</p>
              <p className="text-gray-500 text-sm mt-2">🚀 Quiz will start automatically once loaded!</p>
              <p className="text-gray-400 text-xs mt-1">No waiting • No ready button • Instant start</p>
            </div>
          </div>
        )}

        {/* Quiz Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Auto-Start Success Banner */}
            {quizStarted && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-semibold">
                      🚀 Quiz is LIVE! Start answering now - no waiting required!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Back/Quit Button */}
            <div className="mb-4">
              <button
                onClick={quitQuiz}
                className="flex items-center text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-semibold">Quit & Back to Home</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* Question Display (Timer, Progress, Question details) */}
                <QuestionDisplay
                  questionNumber={questionNumber}
                  totalQuestions={totalQuestions}
                  timeLeft={timeLeft}
                  currentQuestion={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  answerResult={answerResult}
                  isPaused={isPaused}
                  isHost={isHost}
                  handleAnswerSelect={handleAnswerSelect}
                  sendReaction={sendReaction}
                />

                {/* Host Controls */}
                {isHost && (
                  <HostControls
                    isPaused={isPaused}
                    resumeQuiz={resumeQuiz}
                    pauseQuiz={pauseQuiz}
                    nextQuestion={nextQuestion}
                    skipQuestion={skipQuestion}
                    endQuiz={endQuiz}
                    currentQuestionIndex={currentQuestionIndex}
                    allQuestions={allQuestions}
                  />
                )}

                {/* Pause Overlay for Players */}
                {!isHost && isPaused && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-md p-6 text-center">
                    <Pause className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-yellow-900">Quiz Paused</h3>
                    <p className="text-yellow-700">Waiting for host to resume...</p>
                  </div>
                )}

                {/* All Questions View (Host Only) */}
                {isHost && (
                  <AllQuestionsView
                    allQuestions={allQuestions}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    setCurrentQuestion={setCurrentQuestion}
                    setQuestionNumber={setQuestionNumber}
                    setSelectedAnswer={setSelectedAnswer}
                    setAnswerResult={setAnswerResult}
                  />
                )}

                {/* Gift Notification */}
                {giftNotification && (
                  <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-xl animate-slide-in ${
                    giftNotification.type === 'received' ? 'bg-green-100 border-2 border-green-500' : 'bg-blue-100 border-2 border-blue-500'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">🎁</div>
                      <div>
                        <p className={`font-bold ${giftNotification.type === 'received' ? 'text-green-800' : 'text-blue-800'}`}>
                          {giftNotification.type === 'received' ? '🎁 Gift Received!' : '✨ Gift Sent!'}
                        </p>
                        <p className="text-sm text-gray-700">
                          {giftNotification.type === 'received' 
                            ? `${giftNotification.from} sent you a ${giftNotification.giftType}! +${giftNotification.points} points`
                            : `You sent a ${giftNotification.giftType} to ${giftNotification.to}! -${giftNotification.cost} points`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Section */}
              <div className="space-y-4">
                {/* Live Leaderboard rankings */}
                <LeaderboardPanel
                  myScore={myScore}
                  myRank={myRank}
                  leaderboard={leaderboard}
                  playerName={playerName}
                  isAuthenticated={isAuthenticated}
                  followingStatus={followingStatus}
                  handleFollow={handleFollow}
                  setSelectedGiftRecipient={setSelectedGiftRecipient}
                  setShowGiftMenu={setShowGiftMenu}
                />

                {/* Room Info PIN details */}
                <RoomInfoPanel
                  pin={pin}
                  participants={participants}
                />

                {/* Battle Live Chat */}
                <LiveBattleChat
                  chatMessages={chatMessages}
                  playerName={playerName}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  sendMessage={sendMessage}
                  showChat={showChat}
                  setShowChat={setShowChat}
                  chatEndRef={chatEndRef}
                />

                {/* Scoring Info */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">Scoring System:</h4>
                  <div className="space-y-1 text-xs text-blue-800">
                    <p>✓ Base: 100 points</p>
                    <p>⚡ Time bonus: 2 pts/sec</p>
                    <p>🔥 Streak: +10 pts each</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gift Menu Overlay Modal */}
            <GiftMenuModal
              myScore={myScore}
              selectedGiftRecipient={selectedGiftRecipient}
              setShowGiftMenu={setShowGiftMenu}
              setSelectedGiftRecipient={setSelectedGiftRecipient}
              sendGift={sendGift}
            />
          </>
        )}
      </div>

      {/* Real-time floating reactions renderer */}
      <ReactionsOverlay reactions={reactions} />

      {/* Paused-by-host overlay */}
      {isPaused && !isHost && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 backdrop-blur-[3px] pointer-events-none"
          data-testid="paused-by-host-overlay"
          role="status"
          aria-live="polite"
        >
          <div
            className="bg-white/95 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3 max-w-xs animate-[scaleIn_0.18s_ease-out]"
            style={{ pointerEvents: 'none' }}
          >
            <div className="relative w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Pause className="w-5 h-5 text-amber-700" />
              <span
                className="absolute inset-0 rounded-full"
                style={{ animation: 'pausePulse 1.6s ease-out infinite', boxShadow: '0 0 0 0 rgba(217,119,6,0.4)' }}
              />
              <style>{`@keyframes pausePulse {
                0% { box-shadow: 0 0 0 0 rgba(217,119,6,0.45); }
                70% { box-shadow: 0 0 0 14px rgba(217,119,6,0); }
                100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); }
              }`}</style>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Paused by host</p>
              <p className="text-xs text-gray-600 leading-snug mt-0.5">The quiz will resume in a moment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Host Skip / End confirmation modal */}
      {hostActionConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          data-testid="host-action-confirm-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[scaleIn_0.18s_ease-out]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                {hostActionConfirm.type === 'skip'
                  ? <SkipForward className="w-5 h-5 text-amber-600" />
                  : <X className="w-5 h-5 text-red-600" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{hostActionConfirm.title}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-snug">{hostActionConfirm.body}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHostActionConfirm(null)}
                data-testid="host-action-cancel-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={hostActionConfirm.type === 'skip' ? performSkipQuestion : performEndQuiz}
                data-testid="host-action-confirm-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm shadow-md transition-colors"
              >
                {hostActionConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit Battle confirmation modal */}
      {showQuitConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          data-testid="quit-confirm-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[scaleIn_0.18s_ease-out]">
            <style>{`@keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {isHost ? 'Leave the room?' : 'Quit the battle?'}
                </h3>
                <p className="text-sm text-gray-600 mt-1 leading-snug">
                  {isHost
                    ? 'The room stays open for 24 hours — you can rejoin from your Board anytime.'
                    : 'Your current progress will be lost.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                data-testid="quit-cancel-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold text-sm transition-colors"
              >
                Stay
              </button>
              <button
                onClick={performQuit}
                data-testid="quit-confirm-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm shadow-md transition-colors"
              >
                {isHost ? 'Leave' : 'Quit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBattle;
