import React from 'react';

const ReactionsOverlay = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50" data-testid="reactions-overlay-container">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute animate-bounce"
          style={{
            left: reaction.left !== undefined ? reaction.left : `${Math.random() * 80 + 10}%`,
            top: reaction.top !== undefined ? reaction.top : `${Math.random() * 60 + 20}%`,
            animation: 'float 3s ease-out forwards'
          }}
          data-testid={`floating-reaction-${reaction.id}`}
        >
          <div className="bg-white rounded-full shadow-lg p-3">
            <div
              className="text-3xl"
              style={{
                fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Android Emoji","Twemoji Mozilla",sans-serif',
                lineHeight: 1,
              }}
            >
              {reaction.emoji || reaction.reaction}
            </div>
            <div className="text-xs text-gray-600 text-center mt-1">
              {reaction.username || reaction.playerName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReactionsOverlay;
