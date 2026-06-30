import React from 'react';
import { X, Gift } from 'lucide-react';

const GiftMenuModal = ({
  myScore,
  selectedGiftRecipient,
  setShowGiftMenu,
  setSelectedGiftRecipient,
  sendGift,
}) => {
  if (!selectedGiftRecipient) return null;

  const handleClose = () => {
    setShowGiftMenu(false);
    setSelectedGiftRecipient(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" data-testid="gift-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 relative animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900" data-testid="gift-modal-title">
            Send Gift to {selectedGiftRecipient.name}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-gift-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4" data-testid="gift-modal-my-score">
          Your Score: <span className="font-bold text-purple-600">{myScore}</span> points
        </p>
        
        <div className="grid grid-cols-2 gap-4" data-testid="gift-options-grid">
          {[
            { type: 'star', emoji: '⭐', name: 'Star', cost: 10, value: 5 },
            { type: 'diamond', emoji: '💎', name: 'Diamond', cost: 50, value: 25 },
            { type: 'crown', emoji: '👑', name: 'Crown', cost: 100, value: 50 },
            { type: 'trophy', emoji: '🏆', name: 'Trophy', cost: 200, value: 100 }
          ].map((gift) => {
            const canAfford = myScore >= gift.cost;
            return (
              <button
                key={gift.type}
                onClick={() => sendGift(selectedGiftRecipient.id || selectedGiftRecipient.name, gift.type)}
                disabled={!canAfford}
                data-testid={`send-gift-${gift.type}`}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  canAfford
                    ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer active:scale-95'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-4xl mb-2">{gift.emoji}</div>
                <p className="font-bold text-gray-900">{gift.name}</p>
                <p className="text-xs text-gray-600">Cost: {gift.cost} pts</p>
                <p className="text-xs text-green-600 font-semibold">They get: {gift.value} pts</p>
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
          <p className="text-xs text-yellow-800">
            💡 Sending gifts shows appreciation and gives them bonus points!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GiftMenuModal;
