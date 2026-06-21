import React, { memo } from 'react';
import { ArrowLeft, Loader2, Swords } from 'lucide-react';
import Header from '../Header';

export const SetupView = memo(function SetupView({
  isUserAuth,
  user,
  C,
  onBack,
  examId,
  subject,
  topic,
  searchTimedOut,
  playerName,
  setPlayerName,
  startMatchmaking,
}) {
  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      <Header isLoggedIn={isUserAuth} user={user} />
      <div className="px-4 sm:px-12 pt-1 sm:pt-4">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 py-1.5 sm:py-3"><ArrowLeft className="w-5 h-5 mr-2" /> Back</button>
        <div className="w-full sm:max-w-[460px] sm:mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: C.red }}><Swords className="w-10 h-10 text-white" /></div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">1v1 Battle</h1>
            <p className="font-semibold text-lg" style={{ color: C.red }}>{decodeURIComponent(examId)}</p>
            <p className="text-gray-600">{decodeURIComponent(subject)} {topic ? `• ${decodeURIComponent(topic)}` : ''}</p>
            <p className="text-xs text-gray-400 mt-1">You'll be matched with anyone in this exam</p>
          </div>
          {searchTimedOut && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center">
              <p className="font-bold mb-1">No opponent found</p>
              <p className="text-sm">Try again or pick a different subject!</p>
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Battle Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none font-medium"
                data-testid="player-name-input"
              />
            </div>
            <div className="rounded-xl p-4 border-l-4" style={{ background: C.redLight, borderColor: C.red }}>
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: C.red }}><Swords className="w-5 h-5" /> Battle Rules</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>Real-time 1v1 quiz duel</li>
                <li>10 questions, 30 seconds each</li>
                <li>Faster answers = More points</li>
                <li>Optional video call with opponent</li>
              </ul>
            </div>
            <button
              onClick={startMatchmaking}
              disabled={!playerName.trim()}
              className="w-full text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: C.red }}
              data-testid="find-opponent-btn"
            >
              <Swords className="w-5 h-5" /> {searchTimedOut ? 'Try Again' : 'Find Opponent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const SearchingView = memo(function SearchingView({
  isUserAuth,
  user,
  C,
  searchCountdown,
  examId,
  cancelMatchmaking,
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
      <Header isLoggedIn={isUserAuth} user={user} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto" style={{ background: C.red }}><Swords className="w-14 h-14 text-white" /></div>
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-4 animate-ping opacity-20" style={{ borderColor: C.red }} />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-black" style={{ color: C.red }} data-testid="search-countdown">{searchCountdown}</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Finding Opponent</h2>
          <p className="text-gray-500 text-sm mb-1">{decodeURIComponent(examId)} — matching across all topics</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 mt-4 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(searchCountdown / 30) * 100}%`, background: C.red }} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.red }} />
            <span className="text-gray-500 text-sm">{searchCountdown > 20 ? 'Searching...' : searchCountdown > 10 ? 'Still looking...' : 'Expanding search...'}</span>
          </div>
          <button onClick={cancelMatchmaking} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300" data-testid="cancel-search-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
});

export const MatchedView = memo(function MatchedView({
  isUserAuth,
  user,
  C,
  playerName,
  opponent,
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
      <Header isLoggedIn={isUserAuth} user={user} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Match Found!</h2>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.red }}>{playerName.charAt(0).toUpperCase()}</div>
              <p className="font-semibold text-gray-900">{playerName}</p>
            </div>
            <div className="text-4xl font-black" style={{ color: C.red }}>VS</div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" style={{ background: C.blue }}>{opponent?.playerName?.charAt(0).toUpperCase() || '?'}</div>
              <p className="font-semibold text-gray-900">{opponent?.playerName || 'Opponent'}</p>
            </div>
          </div>
          <p className="text-gray-400 animate-pulse">Starting battle...</p>
        </div>
      </div>
    </div>
  );
});
