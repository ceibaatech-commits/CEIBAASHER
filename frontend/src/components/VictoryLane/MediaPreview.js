import React, { useState, useEffect, memo } from 'react';
import { X, Play, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Single Media Item Preview with upload progress
 */
const MediaItem = memo(({ 
  item, 
  index, 
  onRemove, 
  onRetry,
  type,
  isUploading 
}) => {
  const [videoMeta, setVideoMeta] = useState(null);
  
  // Get video metadata (duration, resolution)
  useEffect(() => {
    if (type === 'video' && item.previewUrl) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoMeta({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      video.src = item.previewUrl;
    }
  }, [type, item.previewUrl]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage for display
  const progressPercent = item.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative group"
      data-testid={`media-preview-${type}-${index}`}
    >
      {/* Media Thumbnail Container */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 w-28 h-28 sm:w-32 sm:h-32">
        {type === 'image' ? (
          <img 
            src={item.previewUrl} 
            alt={`Preview ${index + 1}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <video 
              src={item.previewUrl} 
              className="w-full h-full object-cover"
              muted
            />
            {/* Play icon overlay (only when not uploading) */}
            {!item.uploading && !item.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
              </div>
            )}
            {/* Duration badge */}
            {videoMeta && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
                {formatDuration(videoMeta.duration)}
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Overlay - Styled Progress Bar */}
        {item.uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
            {/* Circular progress indicator */}
            <div className="relative w-12 h-12 mb-2">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 1.256} 125.6`}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                {progressPercent}%
              </span>
            </div>
            
            {/* Linear progress bar */}
            <div className="w-full px-2">
              <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-white/80 text-xs mt-1">Uploading...</span>
          </div>
        )}

        {/* Error State with Retry Button */}
        {item.error && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2">
            <button
              onClick={() => onRetry && onRetry(index, type)}
              className="flex flex-col items-center gap-1 text-white hover:text-blue-300 transition-colors"
              data-testid={`retry-upload-${type}-${index}`}
            >
              <RotateCcw className="w-6 h-6" />
              <span className="text-xs font-medium">Retry</span>
            </button>
            <span className="text-red-300 text-[10px] mt-1 text-center line-clamp-2 px-1">
              {item.error}
            </span>
          </div>
        )}

        {/* Upload Success Indicator */}
        {item.uploaded && !item.error && !item.uploading && (
          <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Remove Button - Always visible except during upload */}
      {!item.uploading && (
        <button
          onClick={() => onRemove(index)}
          className="absolute -top-2 -right-2 p-1.5 bg-gray-800 hover:bg-red-500 text-white rounded-full shadow-lg transition-colors z-10"
          data-testid={`remove-media-${type}-${index}`}
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Video Resolution Badge */}
      {type === 'video' && videoMeta && !item.uploading && !item.error && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded-full whitespace-nowrap font-medium">
          {videoMeta.width}×{videoMeta.height}
        </div>
      )}
    </motion.div>
  );
});

/**
 * Media Preview Grid Component
 * Displays selected images and videos with previews, progress, and remove buttons
 */
const MediaPreview = ({ 
  mediaFiles = [], 
  onRemove,
  onRetry,
  isUploading = false,
  maxImages = 4,
  maxVideos = 1 
}) => {
  if (mediaFiles.length === 0) return null;

  const images = mediaFiles.filter(f => f.type === 'image');
  const videos = mediaFiles.filter(f => f.type === 'video');

  return (
    <div className="mt-3 mb-2" data-testid="media-preview-container">
      <AnimatePresence mode="popLayout">
        <div className="flex flex-wrap gap-3">
          {/* Image Previews */}
          {images.map((item, idx) => (
            <MediaItem
              key={`img-${item.id || idx}`}
              item={item}
              index={idx}
              type="image"
              onRemove={(i) => onRemove(i, 'image')}
              onRetry={onRetry}
              isUploading={isUploading}
            />
          ))}
          
          {/* Video Previews */}
          {videos.map((item, idx) => (
            <MediaItem
              key={`vid-${item.id || idx}`}
              item={item}
              index={idx}
              type="video"
              onRemove={(i) => onRemove(i, 'video')}
              onRetry={onRetry}
              isUploading={isUploading}
            />
          ))}
        </div>
      </AnimatePresence>

      {/* Media Limits Info */}
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        {images.length > 0 && (
          <span data-testid="image-count" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Images: {images.length}/{maxImages}
          </span>
        )}
        {videos.length > 0 && (
          <span data-testid="video-count" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Videos: {videos.length}/{maxVideos}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(MediaPreview);
