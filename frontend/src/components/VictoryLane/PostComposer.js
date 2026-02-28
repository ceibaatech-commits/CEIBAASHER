import React, { useCallback, memo } from 'react';
import { X, Trophy, HelpCircle, GraduationCap, Image, Video, AlertCircle } from 'lucide-react';
import UserAvatar from '../UserAvatar';

// Memoized textarea to prevent flickering on typing
const DesktopTextarea = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder="Share your study wins, tips, or thoughts..."
    className="w-full border-none outline-none resize-none min-h-[80px] text-base placeholder-gray-400 focus:ring-0 bg-transparent"
    rows={2}
  />
));

const PostComposer = ({
  user,
  newPostContent,
  setNewPostContent,
  mediaSettings = {},
  selectedPostImages = [],
  setSelectedPostImages,
  selectedPostVideos = [],
  setSelectedPostVideos,
  handleCreatePost,
  setShowAcademicModal,
  setShowQuizModal,
  setShowQuestionModal
}) => {
  if (!user) return null;

  const canPostImages = mediaSettings.allow_media && mediaSettings.can_post_images;
  const canPostVideos = mediaSettings.allow_media && mediaSettings.can_post_videos;

  const handleContentChange = useCallback((e) => {
    setNewPostContent(e.target.value);
  }, [setNewPostContent]);

  const handleImageSelect = useCallback((e) => {
    if (!setSelectedPostImages) return;
    const files = Array.from(e.target.files || []);
    setSelectedPostImages(prev => [...prev, ...files]);
  }, [setSelectedPostImages]);

  const handleVideoSelect = useCallback((e) => {
    if (!setSelectedPostVideos) return;
    const files = Array.from(e.target.files || []);
    setSelectedPostVideos(prev => [...prev, ...files]);
  }, [setSelectedPostVideos]);

  const removeImage = useCallback((idx) => {
    if (setSelectedPostImages) setSelectedPostImages(prev => prev.filter((_, i) => i !== idx));
  }, [setSelectedPostImages]);

  const removeVideo = useCallback((idx) => {
    if (setSelectedPostVideos) setSelectedPostVideos(prev => prev.filter((_, i) => i !== idx));
  }, [setSelectedPostVideos]);

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 p-4">
      <div className="flex gap-3">
        <UserAvatar profilePicture={user.profile_picture} name={user.name} size="md" />
        <div className="flex-1">
          <DesktopTextarea 
            value={newPostContent}
            onChange={handleContentChange}
          />
          
          {/* Media Previews */}
          {(selectedPostImages.length > 0 || selectedPostVideos.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {selectedPostImages.map((file, idx) => (
                <div key={`img-${idx}`} className="relative inline-block">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-48 rounded-xl border border-gray-200" />
                  <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedPostVideos.map((file, idx) => (
                <div key={`vid-${idx}`} className="relative inline-block">
                  <video src={URL.createObjectURL(file)} className="max-h-48 rounded-xl border border-gray-200" controls />
                  <button onClick={() => removeVideo(idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {/* Media Upload - only if admin allowed */}
              {canPostImages && (
                <label className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer" title="Add Image" data-testid="desktop-image-upload">
                  <Image className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" multiple />
                </label>
              )}
              {canPostVideos && (
                <label className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer" title="Add Video" data-testid="desktop-video-upload">
                  <Video className="w-5 h-5" />
                  <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                </label>
              )}
              {!canPostImages && !canPostVideos && (
                <div className="flex items-center gap-1.5 text-gray-400 px-2">
                  <Image className="w-4 h-4" />
                  <Video className="w-4 h-4" />
                  <span className="text-xs">Media disabled</span>
                </div>
              )}
              <button onClick={() => setShowAcademicModal(true)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition" title="Academic Question">
                <GraduationCap className="w-5 h-5" />
              </button>
              <button onClick={() => setShowQuizModal(true)} className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition" title="Quiz Room">
                <Trophy className="w-5 h-5" />
              </button>
              <button onClick={() => setShowQuestionModal(true)} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition" title="Ask Question">
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
