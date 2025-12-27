import React from 'react';
import { Plus, Trophy, HelpCircle, MessageCircle, X, GraduationCap } from 'lucide-react';
import UserAvatar from '../UserAvatar';

const CreatePostFAB = ({
  user,
  showCreateMenu,
  setShowCreateMenu,
  showQuickPostModal,
  setShowQuickPostModal,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  setShowQuizModal,
  setShowQuestionModal,
  setShowAcademicModal
}) => {
  if (!user) return null;

  return (
    <>
      {/* Backdrop when menu is open - Mobile Only */}
      {showCreateMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setShowCreateMenu(false)}
        />
      )}

      {/* Quick Action Menu - Mobile Only */}
      {showCreateMenu && (
        <div className="md:hidden fixed bottom-24 left-4 sm:left-8 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Academic Question Button */}
          <button
            onClick={() => {
              setShowAcademicModal(true);
              setShowCreateMenu(false);
            }}
            className="flex items-center gap-3 bg-white hover:bg-blue-50 text-gray-900 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sm pr-2">Ask Academic Question</span>
          </button>

          {/* Quiz Room Button */}
          <button
            onClick={() => {
              setShowQuizModal(true);
              setShowCreateMenu(false);
            }}
            className="flex items-center gap-3 bg-white hover:bg-purple-50 text-gray-900 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sm pr-2">Create Quiz Room</span>
          </button>

          {/* Question Button */}
          <button
            onClick={() => {
              setShowQuestionModal(true);
              setShowCreateMenu(false);
            }}
            className="flex items-center gap-3 bg-white hover:bg-green-50 text-gray-900 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sm pr-2">Ask General Question</span>
          </button>

          {/* General Post Button */}
          <button
            onClick={() => {
              setShowQuickPostModal(true);
              setShowCreateMenu(false);
            }}
            className="flex items-center gap-3 bg-white hover:bg-orange-50 text-gray-900 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sm pr-2">Create Post</span>
          </button>
        </div>
      )}

      {/* Quick Post Modal */}
      {showQuickPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
              <button
                onClick={() => {
                  setShowQuickPostModal(false);
                  setNewPostContent('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <UserAvatar
                  profilePicture={user.profile_picture}
                  name={user.name}
                  size="md"
                />
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your study wins, tips, or thoughts..."
                  className="flex-1 border-none outline-none resize-none min-h-[120px] text-base placeholder-gray-400 focus:ring-0"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  handleCreatePost();
                  setShowQuickPostModal(false);
                }}
                disabled={!newPostContent.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main FAB Button - Mobile Only */}
      <button
        onClick={() => setShowCreateMenu(!showCreateMenu)}
        className={`md:hidden fixed bottom-6 left-4 sm:left-8 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-2xl transition-all flex items-center justify-center ${
          showCreateMenu ? 'rotate-45' : 'rotate-0'
        }`}
      >
        <Plus className="w-7 h-7" />
      </button>
    </>
  );
};

export default CreatePostFAB;
