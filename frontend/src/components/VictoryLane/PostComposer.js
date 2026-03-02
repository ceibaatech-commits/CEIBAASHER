import React, { useCallback, memo } from 'react';
import { Trophy, HelpCircle, GraduationCap, Image, Video, Loader2 } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import MediaPreview from './MediaPreview';

// Memoized textarea to prevent flickering on typing
const DesktopTextarea = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder="Share your study wins, tips, or thoughts..."
    className="w-full border-none outline-none resize-none min-h-[80px] text-base placeholder-gray-400 focus:ring-0 bg-transparent"
    rows={2}
    data-testid="post-content-input"
  />
));

const PostComposer = ({
  user,
  newPostContent,
  setNewPostContent,
  mediaSettings = {},
  mediaFiles = [],
  removeMedia,
  retryUpload,
  handleImageSelect,
  handleVideoSelect,
  isUploading = false,
  getPostButtonState,
  handleCreatePost,
  uploadAllMedia,
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

  // Get button state
  const buttonState = getPostButtonState ? getPostButtonState() : { disabled: !newPostContent.trim(), text: 'Post' };

  // Handle post click - upload if needed, then post
  const onPostClick = async () => {
    const pendingUploads = mediaFiles.filter(f => !f.uploaded && !f.error);
    
    if (pendingUploads.length > 0 && uploadAllMedia) {
      // First upload media
      await uploadAllMedia();
    } else {
      // Then create post
      handleCreatePost();
    }
  };

  // Check if we need to show "Upload" vs "Post"
  const pendingUploads = mediaFiles.filter(f => !f.uploaded && !f.error);
  const showUploadButton = pendingUploads.length > 0 && !isUploading;

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 p-4" data-testid="desktop-post-composer">
      <div className="flex gap-3">
        <UserAvatar profilePicture={user.profile_picture} name={user.name} size="md" />
        <div className="flex-1">
          <DesktopTextarea 
            value={newPostContent}
            onChange={handleContentChange}
          />
          
          {/* Enhanced Media Previews */}
          {mediaFiles.length > 0 && (
            <MediaPreview
              mediaFiles={mediaFiles}
              onRemove={removeMedia}
              isUploading={isUploading}
              maxImages={4}
              maxVideos={1}
            />
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {/* Media Upload - only if admin allowed */}
              {canPostImages && (
                <label 
                  className={`p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} 
                  title="Add Image (max 4)" 
                  data-testid="desktop-image-upload"
                >
                  <Image className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp" 
                    onChange={handleImageSelect} 
                    className="hidden" 
                    multiple 
                    disabled={isUploading}
                  />
                </label>
              )}
              {canPostVideos && (
                <label 
                  className={`p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} 
                  title="Add Video (max 90s)" 
                  data-testid="desktop-video-upload"
                >
                  <Video className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/quicktime" 
                    onChange={handleVideoSelect} 
                    className="hidden" 
                    disabled={isUploading}
                  />
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
            
            {/* Post/Upload Button */}
            <div className="flex items-center gap-2">
              {/* Character count */}
              <span className={`text-xs ${newPostContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                {newPostContent.length}/280
              </span>
              
              {/* Upload button (shows when media is pending) */}
              {showUploadButton && (
                <button
                  onClick={uploadAllMedia}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition text-sm flex items-center gap-2"
                  data-testid="upload-media-btn"
                >
                  <Image className="w-4 h-4" />
                  Upload {pendingUploads.length} file{pendingUploads.length > 1 ? 's' : ''}
                </button>
              )}
              
              {/* Post button */}
              <button
                onClick={handleCreatePost}
                disabled={buttonState.disabled || isUploading}
                className={`px-5 py-2 rounded-full font-semibold transition text-sm flex items-center gap-2 ${
                  buttonState.disabled || isUploading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                }`}
                data-testid="submit-post-btn"
                title={buttonState.tooltip}
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {buttonState.text}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
