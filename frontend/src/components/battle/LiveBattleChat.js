import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

const LiveBattleChat = ({
  chatMessages,
  playerName,
  chatInput,
  setChatInput,
  sendMessage,
  showChat,
  setShowChat,
  chatEndRef,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
          Battle Chat
        </h3>
        <button
          onClick={() => setShowChat(!showChat)}
          className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
          data-testid="toggle-chat-visibility"
        >
          {showChat ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showChat && (
        <>
          <div className="h-48 overflow-y-auto mb-3 space-y-2 bg-gray-50 rounded-lg p-2" data-testid="chat-messages-container">
            {chatMessages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8" data-testid="chat-empty-msg">
                No messages yet. Start the conversation!
              </p>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.playerName === playerName;
                return (
                  <div
                    key={msg.id || msg.timestamp || `msg-${index}`}
                    data-testid={`chat-msg-item-${index}`}
                    className={`p-2 rounded-lg ${
                      isMe ? 'bg-purple-100 ml-4' : 'bg-white mr-4'
                    }`}
                  >
                    <p className="font-semibold text-xs text-gray-600">{msg.playerName}</p>
                    <p className="text-sm text-gray-900">{msg.message}</p>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          
          <form onSubmit={sendMessage} className="flex space-x-2" data-testid="chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={100}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              data-testid="chat-message-input"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="chat-send-submit"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default LiveBattleChat;
