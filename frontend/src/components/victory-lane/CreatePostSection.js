import React from 'react';
import { Send, Play, Trophy } from 'lucide-react';

const CreatePostSection = ({
  user,
  isAuthenticated,
  newPostContent,
  setNewPostContent,
  onCreatePost,
  onOpenQuizModal,
  onOpenProfile,
  onLogin
}) => {
  if (isAuthenticated && user) {
    return (
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex gap-3">
          <div 
            onClick={() => onOpenProfile(user.id)}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all"
          >
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your victory, challenge friends, or create a quiz room..."
              className="w-full text-lg border-none outline-none resize-none min-h-[60px] placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button 
                onClick={onOpenQuizModal}
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium hover:from-purple-200 hover:to-blue-200 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Create Quiz Room
              </button>
              <button 
                onClick={onCreatePost}
                disabled={!newPostContent.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest View
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-80" />
      <h3 className="text-xl font-bold mb-2">Join the Victory Lane!</h3>
      <p className="text-white/80 mb-4">Share your wins, create quiz rooms, and compete with others</p>
      <button 
        onClick={onLogin}
        className="px-6 py-2 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition"
      >
        Sign in to Post
      </button>
    </div>
  );
};

export default CreatePostSection;
