import React from 'react';
import { Trophy, HelpCircle, MessageCircle, X, GraduationCap, ArrowLeft, Image, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <AnimatePresence>
        {showCreateMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowCreateMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Action Menu - Mobile Only */}
      <AnimatePresence>
        {showCreateMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed bottom-24 left-4 sm:left-8 z-50 flex flex-col gap-2"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Post Composer - X/Twitter Style */}
      <AnimatePresence>
        {showQuickPostModal && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0">
              <button
                onClick={() => {
                  setShowQuickPostModal(false);
                  setNewPostContent('');
                }}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              
              <button
                onClick={() => {
                  handleCreatePost();
                  setShowQuickPostModal(false);
                }}
                disabled={!newPostContent.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold text-sm hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>

            {/* Post Composer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex gap-3">
                  <UserAvatar
                    profilePicture={user.profile_picture}
                    name={user.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-2">{user.name}</p>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's happening?"
                      className="w-full border-none outline-none resize-none min-h-[200px] text-lg placeholder-gray-400 focus:ring-0 bg-transparent"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="border-t border-gray-200 px-4 py-3 bg-white sticky bottom-0">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-blue-50 rounded-full transition">
                  <Image className="w-6 h-6 text-blue-500" />
                </button>
                <button className="p-2 hover:bg-blue-50 rounded-full transition">
                  <Video className="w-6 h-6 text-blue-500" />
                </button>
                <div className="flex-1" />
                <span className={`text-sm ${newPostContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                  {newPostContent.length}/280
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button - Mobile Only - Animated Icon */}
      <button
        onClick={() => setShowCreateMenu(!showCreateMenu)}
        className={`md:hidden fixed bottom-6 left-4 sm:left-8 z-50 w-16 h-16 bg-white hover:bg-gray-50 rounded-full shadow-lg hover:shadow-2xl transition-all flex items-center justify-center border-2 border-purple-200 ${
          showCreateMenu ? 'scale-90' : 'scale-100'
        }`}
        style={{ padding: 0 }}
      >
        {showCreateMenu ? (
          <X className="w-7 h-7 text-purple-600" />
        ) : (
          <img 
            src="/images/create-animated.gif" 
            alt="Create" 
            className="w-12 h-12 object-contain"
          />
        )}
      </button>
    </>
  );
};

export default CreatePostFAB;
