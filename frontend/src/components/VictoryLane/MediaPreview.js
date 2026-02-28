import React, { useState, useEffect, memo } from 'react';
import { X, Play, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Single Media Item Preview with upload progress
 */
const MediaItem = memo(({ 
  item, 
  index, 
  onRemove, 
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

  const getStatusIcon = () => {
    if (item.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (item.uploaded) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (item.uploading) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative group"
      data-testid={`media-preview-${type}-${index}`}
    >
      {/* Media Thumbnail */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
        {type === 'image' ? (
          <img 
            src={item.previewUrl} 
            alt={`Preview ${index + 1}`} 
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
          />
        ) : (
          <div className="relative w-24 h-24 sm:w-28 sm:h-28">
            <video 
              src={item.previewUrl} 
              className="w-full h-full object-cover"
              muted
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            {/* Duration badge */}
            {videoMeta && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                {formatDuration(videoMeta.duration)}
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Overlay */}
        {item.uploading && item.progress !== undefined && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <div className="w-16 h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-white text-xs mt-1 font-medium">{item.progress}%</span>
          </div>
        )}

        {/* Error Overlay */}
        {item.error && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center p-2">
            <span className="text-red-700 text-xs text-center font-medium line-clamp-2">
              {item.error}
            </span>
          </div>
        )}

        {/* Uploaded Success Indicator */}
        {item.uploaded && !item.error && (
          <div className="absolute top-1 left-1">
            <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Remove Button */}
      {!isUploading && (
        <button
          onClick={() => onRemove(index)}
          className="absolute -top-2 -right-2 p-1 bg-gray-800 hover:bg-red-500 text-white rounded-full shadow-lg transition-colors z-10"
          data-testid={`remove-media-${type}-${index}`}
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Video Metadata Badge */}
      {type === 'video' && videoMeta && !item.uploading && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded-full whitespace-nowrap">
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
        <div className="flex flex-wrap gap-2">
          {/* Image Previews */}
          {images.map((item, idx) => (
            <MediaItem
              key={`img-${item.id || idx}`}
              item={item}
              index={idx}
              type="image"
              onRemove={(i) => onRemove(i, 'image')}
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
              isUploading={isUploading}
            />
          ))}
        </div>
      </AnimatePresence>

      {/* Media Limits Info */}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        {images.length > 0 && (
          <span data-testid="image-count">
            Images: {images.length}/{maxImages}
          </span>
        )}
        {videos.length > 0 && (
          <span data-testid="video-count">
            Videos: {videos.length}/{maxVideos}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(MediaPreview);
