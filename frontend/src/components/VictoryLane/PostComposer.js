import React from 'react';
import { X, Trophy, HelpCircle, GraduationCap } from 'lucide-react';
import UserAvatar from '../UserAvatar';

const PostComposer = ({
  user,
  newPostContent,
  setNewPostContent,
  mediaSettings,
  selectedPostImage,
  postImagePreview,
  selectedPostVideo,
  postVideoPreview,
  handlePostImageSelect,
  handlePostVideoSelect,
  clearPostMedia,
  handleCreatePost,
  setShowAcademicModal,
  setShowQuizModal,
  setShowQuestionModal
}) => {
  if (!user) return null;

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 p-4">
      <div className="flex gap-3">
        <UserAvatar
          profilePicture={user.profile_picture}
          name={user.name}
          size="md"
        />
        <div className="flex-1">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your study wins, tips, or thoughts..."
            className="w-full border-none outline-none resize-none min-h-[80px] text-base placeholder-gray-400 focus:ring-0 bg-transparent"
            rows={2}
          />
          
          {/* Media Preview */}
          {(postImagePreview || postVideoPreview) && (
            <div className="relative mt-2 mb-3">
              {postImagePreview && (
                <div className="relative inline-block">
                  <img src={postImagePreview} alt="Preview" className="max-h-48 rounded-xl border border-gray-200" />
                  <button
                    onClick={clearPostMedia}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {postVideoPreview && (
                <div className="relative inline-block">
                  <video src={postVideoPreview} className="max-h-48 rounded-xl border border-gray-200" controls />
                  <button
                    onClick={clearPostMedia}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {/* Media Upload Icons (Twitter-style) - only if admin allowed */}
              {mediaSettings.allow_media_posts && (
                <>
                  {mediaSettings.allow_image_posts && (
                    <label className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer" title="Add Image">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                  {mediaSettings.allow_video_posts && (
                    <label className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer" title="Add Video">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M3 5.5C3 4.119 4.12 3 5.5 3h13C19.88 3 21 4.119 21 5.5v13c0 1.381-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.881 3 18.5v-13zM5.5 5c-.28 0-.5.224-.5.5v13c0 .276.22.5.5.5h13c.28 0 .5-.224.5-.5v-13c0-.276-.22-.5-.5-.5h-13zM10 8.5c0-.828.672-1.5 1.5-1.5.318 0 .612.099.856.267l4.6 3.053c.557.369.557 1.191 0 1.56l-4.6 3.053c-.244.168-.538.267-.856.267-.828 0-1.5-.672-1.5-1.5v-5.2z"/>
                      </svg>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handlePostVideoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </>
              )}
              <button
                onClick={() => setShowAcademicModal(true)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition"
                title="Academic Question"
              >
                <GraduationCap className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowQuizModal(true)}
                className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition"
                title="Quiz Room"
              >
                <Trophy className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowQuestionModal(true)}
                className="p-2 text-green-500 hover:bg-green-50 rounded-full transition"
                title="Ask Question"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
