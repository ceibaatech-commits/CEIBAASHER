import React, { useCallback, memo } from 'react';
import { Trophy, HelpCircle, MessageCircle, X, GraduationCap, ArrowLeft, Image, Video, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../UserAvatar';

// Memoized textarea to prevent flickering
const PostTextarea = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder="What's happening?"
    className="w-full border-none outline-none resize-none min-h-[200px] text-lg placeholder-gray-400 focus:ring-0 bg-transparent"
    autoFocus
  />
));

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
  setShowAcademicModal,
  mediaSettings = {},
  selectedPostImages,
  setSelectedPostImages,
  selectedPostVideos,
  setSelectedPostVideos,
}) => {
  if (!user) return null;

  const canPostImages = mediaSettings.allow_media && mediaSettings.can_post_images;
  const canPostVideos = mediaSettings.allow_media && mediaSettings.can_post_videos;

  const handleImageSelect = useCallback((e) => {
    if (!canPostImages || !setSelectedPostImages) return;
    const files = Array.from(e.target.files || []);
    setSelectedPostImages(prev => [...(prev || []), ...files]);
  }, [canPostImages, setSelectedPostImages]);

  const handleVideoSelect = useCallback((e) => {
    if (!canPostVideos || !setSelectedPostVideos) return;
    const files = Array.from(e.target.files || []);
    setSelectedPostVideos(prev => [...(prev || []), ...files]);
  }, [canPostVideos, setSelectedPostVideos]);

  const handleContentChange = useCallback((e) => {
    setNewPostContent(e.target.value);
  }, [setNewPostContent]);

  return (
    <>
      {/* Backdrop when menu is open - Mobile Only */}
      <AnimatePresence mode="wait">
        {showCreateMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowCreateMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Action Menu - Mobile Only */}
      <AnimatePresence mode="wait">
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
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-100"
              data-testid="create-academic-btn"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/images/icons/requirements.gif" alt="Academic" className="w-10 h-10 object-cover" />
              </div>
              <span className="font-medium text-gray-800 text-sm">Academic Question</span>
            </button>

            {/* Quiz Room Button */}
            <button
              onClick={() => {
                setShowQuizModal(true);
                setShowCreateMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-100"
              data-testid="create-quiz-btn"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/images/icons/integration.gif" alt="Quiz Room" className="w-10 h-10 object-cover" />
              </div>
              <span className="font-medium text-gray-800 text-sm">Quiz Room</span>
            </button>

            {/* Quick Post Button */}
            <button
              onClick={() => {
                setShowQuickPostModal(true);
                setShowCreateMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-100"
              data-testid="create-quick-post-btn"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/images/icons/talk.gif" alt="Quick Post" className="w-10 h-10 object-cover" />
              </div>
              <span className="font-medium text-gray-800 text-sm">Quick Post</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Post Composer */}
      <AnimatePresence>
        {showQuickPostModal && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[70] bg-white flex flex-col"
          >
            {/* Composer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
              <button
                onClick={() => {
                  setShowQuickPostModal(false);
                  setNewPostContent('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                data-testid="close-composer-btn"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                  newPostContent.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="submit-post-btn"
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
                    <PostTextarea 
                      value={newPostContent}
                      onChange={handleContentChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="border-t border-gray-200 px-4 py-3 bg-white sticky bottom-0">
              {canPostImages || canPostVideos ? (
                <div className="flex items-center gap-4">
                  {canPostImages && (
                    <label className="p-2 hover:bg-blue-50 rounded-full transition cursor-pointer" data-testid="image-upload-btn">
                      <Image className="w-6 h-6 text-blue-500" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} multiple />
                    </label>
                  )}
                  {canPostVideos && (
                    <label className="p-2 hover:bg-blue-50 rounded-full transition cursor-pointer" data-testid="video-upload-btn">
                      <Video className="w-6 h-6 text-blue-500" />
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                    </label>
                  )}
                  <div className="flex-1" />
                  <span className={`text-sm ${newPostContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                    {newPostContent.length}/280
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Image className="w-5 h-5" />
                    <Video className="w-5 h-5" />
                    <span className="text-xs">Media uploads disabled by administrator</span>
                  </div>
                  <div className="flex-1" />
                  <span className={`text-sm ${newPostContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                    {newPostContent.length}/280
                  </span>
                </div>
              )}
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
        data-testid="create-post-fab"
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
