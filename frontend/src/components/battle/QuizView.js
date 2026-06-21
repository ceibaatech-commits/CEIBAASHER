import React, { memo } from 'react';
import { ArrowLeft, CheckCheck, Flag, Loader2, MessageCircle, MoreVertical, Paperclip, Send, Video } from 'lucide-react';
import Header from '../Header';
import FollowButton from '../FollowButton';
import MathText from '../MathText';
import { toast } from 'sonner';
import LiveScoreboard from './LiveScoreboard';

const QuizView = memo(function QuizView(props) {
  const {
    isUserAuth,
    user,
    C,
    playerName,
    timeLeft,
    handleBattleBack,
    setMobileChatOpen,
    chatMessages,
    setChatMenuOpen,
    chatMenuOpen,
    handleViewProfile,
    opponent,
    handleMuteNotifications,
    notificationsMuted,
    handleReportPlayer,
    liveNotice,
    currentQuestionIndex,
    questions,
    subject,
    selectedAnswer,
    opponentAnswer,
    answerResult,
    handleAnswerSelect,
    mobileChatOpen,
    openProfileNewTab,
    battleState,
    opponentFinishedQuiz,
    opponentOnline,
    requestVC,
    opponentTyping,
    chatEndRef,
    sendQuickReply,
    sendChat,
    chatInput,
    handleChatInputChange,
    setChatInput,
    displayMyScore,
    displayOpponentScore,
    opponentQuestionIndex,
    scorePulse,
    scoreDeltas,
    isPlayerMe,
    isReconnecting,
    topic,
    examId,
    navigate,
    myScore,
    opponentScore,
    vcState,
    setShowReport,
  } = props;

  const q = questions[currentQuestionIndex];
  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.red }} />
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const oppName = opponent?.playerName || 'Opponent';
  const hasChatDraft = chatInput.trim().length > 0;

  return (
    <>
      <div className="md:hidden flex flex-col min-h-screen">
        <Header isLoggedIn={isUserAuth} user={user} />

        <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={handleBattleBack}><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <span className="font-bold text-gray-900 text-sm">{playerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileChatOpen((o) => !o)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:bg-gray-200 transition-colors"
              data-testid="mobile-chat-toggle"
              aria-label="Open chat"
            >
              <MessageCircle className="w-5 h-5" style={{ color: '#374151' }} strokeWidth={1.75} />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center" style={{ background: C.red }}>
                  {chatMessages.length > 9 ? '9+' : chatMessages.length}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setChatMenuOpen((o) => !o)}
                aria-label="Open more options"
                data-testid="mobile-more-menu-toggle"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <MoreVertical className="w-5 h-5" style={{ color: '#374151' }} strokeWidth={1.75} />
              </button>
              {chatMenuOpen && (
                <>
                  <button
                    aria-label="Close menu"
                    onClick={() => setChatMenuOpen(false)}
                    className="fixed inset-0 z-[1] cursor-default"
                  />
                  <div className="absolute right-0 top-11 min-w-[14rem] bg-white rounded-2xl shadow-2xl overflow-hidden z-[2] border border-slate-200" data-testid="chat-more-dropdown">
                    <button
                      onClick={() => {
                        setChatMenuOpen(false);
                        handleViewProfile();
                      }}
                      disabled={!opponent?.username && !opponent?.userId && !opponent?.playerName}
                      data-testid="chat-menu-view-profile"
                      className="w-full px-4 py-3 text-left text-[14px] font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      View profile
                    </button>
                    <button
                      onClick={() => {
                        setChatMenuOpen(false);
                        handleMuteNotifications();
                      }}
                      data-testid="chat-menu-mute"
                      className="w-full px-4 py-3 text-left text-[14px] font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      {notificationsMuted ? 'Unmute notifications' : 'Mute notifications'}
                    </button>
                    <button
                      onClick={() => { setChatMenuOpen(false); handleReportPlayer(); }}
                      data-testid="chat-menu-report"
                      className="w-full px-4 py-3 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                      style={{ borderTop: '1px solid #F3F4F6' }}
                    >
                      Report player
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="px-3 py-1 rounded-full text-white text-sm font-bold" style={{ background: timeLeft <= 10 ? C.red : '#888' }}>{timeLeft}s</div>
          </div>
        </div>

        <div className="h-1.5 mx-4 mt-2 rounded-full overflow-hidden" style={{ background: '#e0d8d0' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} />
        </div>

        {liveNotice && (
          <div className="mx-4 mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800" data-testid="battle-live-notice">
            {liveNotice}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Q{currentQuestionIndex + 1} of {questions.length} • {decodeURIComponent(subject)}</p>
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-5 leading-relaxed"><MathText text={q.question} /></h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const txt = typeof opt === 'object' ? (opt.text || opt.label) : opt;
              const isMine = selectedAnswer === i;
              const isOpp = opponentAnswer === i;
              const isCorrect = answerResult && answerResult.correctAnswer === i;
              const isWrong = isMine && answerResult && !answerResult.isCorrect;
              let border = '#e5e0db';
              let bg = C.white;
              if (answerResult) {
                if (isCorrect) {
                  border = '#22c55e';
                  bg = '#f0fdf4';
                } else if (isWrong) {
                  border = C.red;
                  bg = C.redLight;
                }
              } else if (isMine) {
                border = C.red;
                bg = C.redLight;
              }
              if (isOpp && !answerResult) {
                border = C.blue;
                bg = C.blueLight;
              }
              if (isMine && isOpp && !answerResult) {
                border = '#8b5cf6';
                bg = '#f5f3ff';
              }
              return (
                <button key={`q${currentQuestionIndex}-opt-${i}`} onClick={() => handleAnswerSelect(i)} disabled={selectedAnswer !== null}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all relative" style={{ borderColor: border, background: bg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="flex-1 font-medium text-gray-900 text-sm"><MathText text={txt} /></span>
                    {isCorrect && <span className="text-green-500 font-bold">✓</span>}
                    {isWrong && <span style={{ color: C.red }} className="font-bold">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>
          {answerResult && (
            <div className={`mt-4 p-3 rounded-xl border-2 ${
              answerResult.outcome === 'correct' ? 'bg-green-50 border-green-400' :
              answerResult.outcome === 'wrong' ? 'bg-red-50 border-red-400' :
              'bg-amber-50 border-amber-400'
            }`}>
              <p className={`font-bold text-sm ${
                answerResult.outcome === 'correct' ? 'text-green-800' :
                answerResult.outcome === 'wrong' ? 'text-red-800' :
                'text-amber-800'
              }`}>
                {answerResult.outcome === 'correct' && `✓ Correct! +${answerResult.points} pts`}
                {answerResult.outcome === 'wrong' && `✗ Incorrect — ${answerResult.points} pts`}
                {answerResult.outcome === 'skipped' && `⊘ Time's up — 0 pts`}
              </p>
            </div>
          )}
        </div>

        {mobileChatOpen && (
          <div className="fixed inset-0 z-[60] flex items-end" data-testid="mobile-chat-popup">
            <button
              aria-label="Close chat"
              onClick={() => setMobileChatOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              style={{ animation: 'mcChatFade 0.18s ease-out' }}
            />
            <div
              className="relative w-full bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.22)] flex flex-col"
              style={{
                maxHeight: '85vh',
                height: '560px',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                animation: 'mcChatSlide 0.28s cubic-bezier(0.32,0.72,0.28,1)',
                fontFamily: '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <style>{`
                @keyframes mcChatSlide { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes mcChatFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes mcMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .mc-msg-in { animation: mcMsgIn 0.18s ease-out; }
                @keyframes mcTypingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.6; } 30% { transform: translateY(-4px); opacity: 1; } }
                .mc-typing-dot { animation: mcTypingBounce 1.2s infinite; }
                @media (prefers-reduced-motion: reduce) { .mc-msg-in, .mc-typing-dot { animation: none; } }
              `}</style>

              <div className="pt-2.5 pb-1.5 flex justify-center shrink-0">
                <div className="w-10 h-1.5 rounded-full" style={{ background: '#D1D5DB' }} />
              </div>

              <div className="flex items-center gap-2 px-4 pb-3 shrink-0" style={{ borderBottom: '1px solid #EEEEEE' }}>
                <button
                  onClick={() => setMobileChatOpen(false)}
                  aria-label="Back"
                  data-testid="mobile-chat-back"
                  className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => openProfileNewTab(opponent?.username || opponent?.userId)}
                  aria-label="View opponent profile"
                  data-testid="chat-opponent-avatar"
                  className="relative shrink-0 active:scale-95 transition-transform"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base"
                    style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.red})` }}
                  >
                    {oppName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {opponentOnline && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{ background: '#22C55E', boxShadow: '0 0 0 2px #ffffff' }}
                      aria-label="Online"
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  {opponent?.userId ? (
                    <button
                      type="button"
                      onClick={() => openProfileNewTab(opponent.username || opponent.userId)}
                      data-testid="chat-opponent-name-link"
                      className="text-[16px] font-semibold text-gray-900 leading-tight truncate block text-left hover:underline"
                    >
                      {oppName}
                    </button>
                  ) : (
                    <p className="text-[16px] font-semibold text-gray-900 leading-tight truncate" data-testid="chat-opponent-name">{oppName}</p>
                  )}
                  <p className="text-[12px] leading-tight mt-0.5 text-gray-500">
                    {battleState === 'results' ? 'Battle ended' : (opponentFinishedQuiz ? 'Finished quiz' : (!opponentOnline ? 'Offline' : ''))}
                  </p>
                </div>

                <button
                  onClick={requestVC}
                  aria-label="Video call"
                  data-testid="chat-video-call"
                  className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
                >
                  <Video className="w-5 h-5" style={{ color: '#6B7280' }} strokeWidth={1.75} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setChatMenuOpen((o) => !o)}
                    aria-label="More options"
                    data-testid="chat-more-menu"
                    className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" style={{ color: '#6B7280' }} strokeWidth={1.75} />
                  </button>
                  {chatMenuOpen && (
                    <>
                      <button
                        aria-label="Close menu"
                        onClick={() => setChatMenuOpen(false)}
                        className="fixed inset-0 z-[1] cursor-default"
                      />
                      <div className="absolute right-0 top-11 min-w-[14rem] bg-white rounded-2xl shadow-2xl overflow-hidden z-[2] border border-slate-200" data-testid="chat-more-dropdown">
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            handleViewProfile();
                          }}
                          disabled={!opponent?.username && !opponent?.userId && !opponent?.playerName}
                          data-testid="chat-menu-view-profile"
                          className="w-full px-4 py-3 text-left text-[14px] font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          View profile
                        </button>
                        <button
                          onClick={() => { setChatMenuOpen(false); handleMuteNotifications(); }}
                          data-testid="chat-menu-mute"
                          className="w-full px-4 py-3 text-left text-[14px] font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          {notificationsMuted ? 'Unmute notifications' : 'Mute notifications'}
                        </button>
                        <button
                          onClick={() => {
                            setChatMenuOpen(false);
                            setMobileChatOpen(false);
                            setTimeout(() => handleReportPlayer(), 60);
                          }}
                          data-testid="chat-menu-report"
                          className="w-full px-4 py-3 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                          style={{ borderTop: '1px solid #F3F4F6' }}
                        >
                          Report player
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3" style={{ background: '#FFFFFF' }}>
                {chatMessages.length === 0 && !opponentTyping ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2" data-testid="chat-empty-state">
                    <div className="text-3xl">👋</div>
                    <p className="text-[14px] font-semibold text-gray-900">Say hi to {oppName?.split(' ')[0] || 'your opponent'}</p>
                    <p className="text-[12px] text-gray-500">Keep it sporty — good vibes win games.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-3" data-testid="chat-date-separator">
                      <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: '#F1F1F3', color: '#6B7280' }}>
                        Today
                      </span>
                    </div>

                    {chatMessages.map((m, i) => {
                      const mine = m.playerName === playerName;
                      const prev = i > 0 ? chatMessages[i - 1] : null;
                      const next = i < chatMessages.length - 1 ? chatMessages[i + 1] : null;
                      const isFirstInCluster = !prev || prev.playerName !== m.playerName;
                      const isLastInCluster = !next || next.playerName !== m.playerName;
                      const time = m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                      const opponentHasReplied = chatMessages.slice(i + 1).some((x) => x.playerName !== m.playerName);
                      const isRead = mine && opponentHasReplied;
                      return (
                        <div
                          key={`mc-${m.ts}-${i}`}
                          className={`flex items-end gap-2 mc-msg-in ${mine ? 'justify-end' : 'justify-start'}`}
                          style={{ marginTop: isFirstInCluster ? 12 : 2 }}
                          data-testid={mine ? `chat-message-sent-${i}` : `chat-message-received-${i}`}
                        >
                          {!mine && (
                            <div className="w-8 shrink-0">
                              {isLastInCluster && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.red})` }}>
                                  {m.playerName?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                            {!mine && isFirstInCluster && (
                              <p className="text-[13px] font-semibold text-gray-900 mb-1 px-1">{m.playerName}</p>
                            )}
                            <div
                              className="px-3.5 py-2 text-[15px] leading-[1.4] break-words"
                              style={{
                                background: mine ? '#1FA47C' : '#F1F1F3',
                                color: mine ? '#FFFFFF' : '#1A1A1A',
                                borderRadius: mine
                                  ? `18px 18px ${isLastInCluster ? '4px' : '18px'} 18px`
                                  : `18px 18px 18px ${isLastInCluster ? '4px' : '18px'}`,
                              }}
                            >
                              {m.message}
                            </div>
                            {isLastInCluster && (
                              <div className={`flex items-center gap-1 mt-1 px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[11px] tabular-nums" style={{ color: '#9CA3AF' }}>{time}</span>
                                {mine && (
                                  <CheckCheck
                                    className="w-3.5 h-3.5"
                                    style={{ color: isRead ? '#1FA47C' : '#9CA3AF' }}
                                    data-testid={isRead ? `chat-receipt-read-${i}` : `chat-receipt-delivered-${i}`}
                                    aria-label={isRead ? 'Read' : 'Delivered'}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {opponentTyping && (
                      <div className="flex items-end gap-2 mt-2" data-testid="chat-typing-indicator">
                        <div className="w-8 shrink-0" />
                        <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-[4px]" style={{ background: '#F1F1F3' }}>
                          <span className="mc-typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#6B7280', animationDelay: '0ms' }} />
                          <span className="mc-typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#6B7280', animationDelay: '150ms' }} />
                          <span className="mc-typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#6B7280', animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid #EEEEEE', background: '#FFFFFF' }}>
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  data-testid="chat-quick-replies"
                >
                  <style>{`[data-testid="chat-quick-replies"]::-webkit-scrollbar { display: none; }`}</style>
                  {['👍 Nice!', '🔥 GG!', '😅 Tough one', '👏 Well played', '🚀 Let\'s go!'].map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => sendQuickReply(qr)}
                      data-testid={`quick-reply-${qr.split(' ')[0]}`}
                      className="shrink-0 px-3 h-8 rounded-full text-[13px] font-medium whitespace-nowrap active:scale-95 transition-transform"
                      style={{ background: '#F1F1F3', color: '#1A1A1A' }}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={sendChat} className="flex items-center gap-2 px-3 py-2.5 shrink-0 bg-white" style={{ borderTop: '1px solid #EEEEEE' }}>
                <button
                  type="button"
                  aria-label="Attach"
                  data-testid="chat-attach-btn"
                  onClick={() => toast.info('Attachments coming soon')}
                  className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors shrink-0"
                >
                  <Paperclip className="w-[22px] h-[22px]" style={{ color: '#6B7280' }} strokeWidth={1.75} />
                </button>
                <div className="flex-1 flex items-center gap-1 rounded-full px-3" style={{ background: '#F5F5F7' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={handleChatInputChange}
                    placeholder="Write your message..."
                    inputMode="text"
                    autoFocus
                    data-testid="chat-input"
                    className="flex-1 bg-transparent text-[15px] py-2.5 focus:outline-none"
                    style={{ color: '#1A1A1A' }}
                  />
                </div>
                <button
                  type="submit"
                  aria-label={hasChatDraft ? 'Send message' : 'Type a message'}
                  data-testid="chat-send-button"
                  disabled={!hasChatDraft}
                  className="h-11 min-w-[58px] px-3 rounded-full flex items-center justify-center text-sm font-semibold transition-all shrink-0"
                  style={hasChatDraft
                    ? { background: '#1FA47C', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(31,164,124,0.32)' }
                    : { background: '#E5E7EB', color: '#6B7280' }}
                >
                  {hasChatDraft ? 'Send' : 'Type'}
                </button>
              </form>
            </div>
          </div>
        )}

        <LiveScoreboard
          opponentLabel={opponent?.playerName || 'Opponent'}
          displayMyScore={displayMyScore}
          displayOpponentScore={displayOpponentScore}
          totalQuestions={questions.length}
          currentQuestionIndex={currentQuestionIndex}
          opponentQuestionIndex={opponentQuestionIndex}
          battleState={battleState}
          scorePulse={scorePulse}
          myScoreDeltas={scoreDeltas.filter((item) => isPlayerMe(item.playerId))}
          oppScoreDeltas={scoreDeltas.filter((item) => !isPlayerMe(item.playerId))}
          isReconnecting={isReconnecting}
        />
      </div>

      <div className="hidden md:block">
        <Header isLoggedIn={isUserAuth} user={user} />
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-bold text-gray-900">{playerName}</p>
                <p className="text-xl font-black" style={{ color: C.red }}>{myScore} pts</p>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-black ${timeLeft <= 10 ? 'animate-pulse' : ''}`} style={{ color: timeLeft <= 10 ? C.red : '#374151' }}>{timeLeft}s</div>
              <p className="text-gray-400 text-sm">Q{currentQuestionIndex + 1}/{questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-gray-900">{oppName}</p>
                <p className="text-xl font-black" style={{ color: C.blue }}>{opponentScore} pts</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
            </div>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: '#e0d8d0' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.red}, ${C.blue})` }} />
          </div>

          {liveNotice && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800" data-testid="battle-live-notice-desktop">
              {liveNotice}
            </div>
          )}

          <div className="grid grid-cols-[1fr_240px] gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{decodeURIComponent(subject)} {topic ? `• ${decodeURIComponent(topic)}` : ''}</span>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mt-3 mb-6 leading-relaxed"><MathText text={q.question} /></h2>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  const txt = typeof opt === 'object' ? (opt.text || opt.label) : opt;
                  const isMine = selectedAnswer === i;
                  const isOpp = opponentAnswer === i;
                  const isCorrect = answerResult && answerResult.correctAnswer === i;
                  const isWrong = isMine && answerResult && !answerResult.isCorrect;
                  let border = '#e5e0db';
                  let bg = C.white;
                  if (answerResult) {
                    if (isCorrect) {
                      border = '#22c55e';
                      bg = '#f0fdf4';
                    } else if (isWrong) {
                      border = C.red;
                      bg = C.redLight;
                    }
                  } else if (isMine) {
                    border = C.red;
                    bg = C.redLight;
                  }
                  if (isOpp && !answerResult) {
                    border = C.blue;
                    bg = C.blueLight;
                  }
                  return (
                    <button key={`q${currentQuestionIndex}-d-opt-${i}`} onClick={() => handleAnswerSelect(i)} disabled={selectedAnswer !== null}
                      className="text-left p-4 rounded-xl border-2 transition-all hover:shadow-md relative" style={{ borderColor: border, background: bg }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ background: isCorrect ? '#22c55e' : isWrong ? C.red : isMine ? C.red : isOpp ? C.blue : '#e5e0db', color: (isCorrect || isWrong || isMine || isOpp) ? '#fff' : '#374151' }}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1 font-medium text-gray-900"><MathText text={txt} /></span>
                        {isCorrect && <span className="text-green-500 font-bold text-xl">✓</span>}
                        {isWrong && <span style={{ color: C.red }} className="font-bold text-xl">✗</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {answerResult && (
                <div className={`mt-4 p-4 rounded-xl border-2 ${
                  answerResult.outcome === 'correct' ? 'bg-green-50 border-green-400' :
                  answerResult.outcome === 'wrong' ? 'bg-red-50 border-red-400' :
                  'bg-amber-50 border-amber-400'
                }`}>
                  <p className={`font-bold ${
                    answerResult.outcome === 'correct' ? 'text-green-800' :
                    answerResult.outcome === 'wrong' ? 'text-red-800' :
                    'text-amber-800'
                  }`}>
                    {answerResult.outcome === 'correct' && `✓ Correct! +${answerResult.points} pts`}
                    {answerResult.outcome === 'wrong' && `✗ Incorrect — ${answerResult.points} pts`}
                    {answerResult.outcome === 'skipped' && `⊘ Time's up — 0 pts`}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl p-4 text-center" style={{ background: C.pink }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2" style={{ background: C.blue }}>{oppName.charAt(0).toUpperCase()}</div>
                {opponent?.userId && (battleState === 'results' || battleState === 'setup') ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${opponent.username || opponent.userId}`)}
                    data-testid="desktop-opponent-name-link"
                    className="font-bold text-gray-900 text-sm hover:underline"
                  >
                    {oppName}
                  </button>
                ) : (
                  <p className="font-bold text-gray-900 text-sm" data-testid="desktop-opponent-name">{oppName}</p>
                )}
                <p className="text-xs text-gray-500">{decodeURIComponent(examId)}</p>
                {opponent?.userId && (
                  <div className="mt-2 flex justify-center" data-testid="desktop-opponent-follow">
                    <FollowButton
                      targetUserId={opponent.userId}
                      targetUsername={opponent.username || opponent.playerName}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                {vcState === 'idle' && (
                  <button onClick={requestVC} className="w-full py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.blue }} data-testid="desktop-start-vc">
                    <Video className="w-4 h-4" /> Start Video Call
                  </button>
                )}
                {vcState === 'requesting' && <div className="text-center py-2 text-sm text-gray-500 animate-pulse">Ringing opponent...</div>}
                {vcState === 'active' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold" style={{ color: C.blue }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.blue }} />
                    Live — use video controls below
                  </div>
                )}
                <button onClick={() => setShowReport(true)} className="w-full py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1">
                  <Flag className="w-3 h-3" /> Report
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Battle Info</p>
                <p className="text-xs text-gray-600">{decodeURIComponent(examId)}</p>
                <p className="text-xs text-gray-600">{decodeURIComponent(subject)}</p>
                <p className="text-xs text-gray-500 mt-1">Q{currentQuestionIndex + 1}/{questions.length} • {timeLeft}s left</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '220px' }}>
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: C.blue }} />
                  <span className="text-xs font-bold text-gray-700">Chat</span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ background: '#fafafa' }}>
                  {chatMessages.length === 0
                    ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-1 py-4">
                        <MessageCircle className="w-6 h-6 opacity-30" />
                        <p className="text-xs font-medium">No messages yet</p>
                      </div>
                    )
                    : chatMessages.map((m, i) => {
                      const mine = m.playerName === playerName;
                      return (
                        <div key={`dc-${m.ts}-${i}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] px-3 py-1.5 text-xs leading-snug shadow-sm ${
                              mine ? 'text-white rounded-[16px] rounded-br-md' : 'bg-white text-gray-800 rounded-[16px] rounded-bl-md'
                            }`}
                            style={mine ? { background: C.red } : {}}
                          >
                            {!mine && <p className="text-[9px] opacity-60 font-bold mb-0.5">{m.playerName}</p>}
                            <p className="break-words">{m.message}</p>
                          </div>
                        </div>
                      );
                    })
                  }
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Aa"
                    maxLength={100}
                    data-testid="desktop-chat-input"
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-xs focus:outline-none focus:bg-gray-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    aria-label="Send message"
                    data-testid="desktop-chat-send"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:shadow-none transition-all active:scale-95"
                    style={{ background: chatInput.trim() ? C.red : '#d1d5db' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <LiveScoreboard
          desktop
          opponentLabel={opponent?.playerName || 'Opponent'}
          displayMyScore={displayMyScore}
          displayOpponentScore={displayOpponentScore}
          totalQuestions={questions.length}
          currentQuestionIndex={currentQuestionIndex}
          opponentQuestionIndex={opponentQuestionIndex}
          battleState={battleState}
          scorePulse={scorePulse}
          myScoreDeltas={scoreDeltas.filter((item) => isPlayerMe(item.playerId))}
          oppScoreDeltas={scoreDeltas.filter((item) => !isPlayerMe(item.playerId))}
          isReconnecting={isReconnecting}
        />
      </div>
    </>
  );
});

export default QuizView;
