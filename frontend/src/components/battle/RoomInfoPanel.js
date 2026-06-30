import React from 'react';

const RoomInfoPanel = ({ pin, participants }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(pin);
    alert('Room code copied to clipboard! 📋');
  };

  const handleShare = () => {
    const shareText = `Join my Ceibaa quiz battle! 🎮\nRoom Code: ${pin}\n\nJoin now at: ${window.location.origin}/join-room`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Ceibaa Battle',
        text: shareText,
        url: `${window.location.origin}/join-room`
      }).catch(err => console.log('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard! 📋\nPaste it anywhere to invite friends.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 border-2 border-green-200">
      <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
        🔑 Room Code
      </h3>
      <div className="bg-white rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Share this code with friends:</p>
            <p className="text-3xl font-black text-green-600 tracking-wider font-mono" data-testid="room-pin-value">
              {pin}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            data-testid="copy-pin-btn"
            title="Copy Room Code"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
        data-testid="share-room-btn"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share Room</span>
      </button>
      
      {/* Participants Count */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600" data-testid="participants-count">
          👥 <span className="font-bold text-green-700">{participants.length || 1}</span> / 150 players
        </p>
      </div>
    </div>
  );
};

export default RoomInfoPanel;
