import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = window.location.origin;

/**
 * Custom hook for managing media settings and permissions
 */
export const useMediaSettings = (user) => {
  const [mediaSettings, setMediaSettings] = useState({
    allow_media: false,
    can_post_images: false,
    can_post_videos: false
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch user's media posting permissions
  useEffect(() => {
    const fetchMediaSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/user/media-permissions`);
        
        if (response.data.success) {
          setMediaSettings(response.data.permissions || {
            allow_media: false,
            can_post_images: false,
            can_post_videos: false
          });
        }
      } catch (error) {
        console.error('Error fetching media settings:', error);
        setMediaSettings({ allow_media: false, can_post_images: false, can_post_videos: false });
      }
    };

    if (user?.id) {
      fetchMediaSettings();
    }
  }, [user?.id]);

  const canPostImages = mediaSettings.allow_media && mediaSettings.can_post_images;
  const canPostVideos = mediaSettings.allow_media && mediaSettings.can_post_videos;

  const addImage = useCallback((file) => {
    if (!canPostImages) return false;
    if (selectedImages.length >= 4) return false;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImages(prev => [...prev, { file, preview: reader.result }]);
    };
    reader.readAsDataURL(file);
    return true;
  }, [canPostImages, selectedImages.length]);

  const removeImage = useCallback((index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addVideo = useCallback((file) => {
    if (!canPostVideos) return false;
    if (selectedVideos.length >= 1) return false;
    
    const url = URL.createObjectURL(file);
    setSelectedVideos(prev => [...prev, { file, preview: url }]);
    return true;
  }, [canPostVideos, selectedVideos.length]);

  const removeVideo = useCallback((index) => {
    setSelectedVideos(prev => {
      const video = prev[index];
      if (video?.preview) URL.revokeObjectURL(video.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearMedia = useCallback(() => {
    selectedVideos.forEach(v => {
      if (v?.preview) URL.revokeObjectURL(v.preview);
    });
    setSelectedImages([]);
    setSelectedVideos([]);
  }, [selectedVideos]);

  const uploadMedia = useCallback(async () => {
    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      return { images: [], videos: [] };
    }

    setUploading(true);
    const uploadedImages = [];
    const uploadedVideos = [];

    try {
      // Upload images
      for (const img of selectedImages) {
        const formData = new FormData();
        formData.append('file', img.file);
        formData.append('type', 'image');
        
        const response = await axios.post(`${BACKEND_URL}/api/media/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          uploadedImages.push(response.data.url);
        }
      }

      // Upload videos
      for (const vid of selectedVideos) {
        const formData = new FormData();
        formData.append('file', vid.file);
        formData.append('type', 'video');
        
        const response = await axios.post(`${BACKEND_URL}/api/media/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          uploadedVideos.push(response.data.url);
        }
      }

      return { images: uploadedImages, videos: uploadedVideos };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [selectedImages, selectedVideos]);

  return {
    mediaSettings,
    canPostImages,
    canPostVideos,
    selectedImages,
    selectedVideos,
    uploading,
    addImage,
    removeImage,
    addVideo,
    removeVideo,
    clearMedia,
    uploadMedia
  };
};

export default useMediaSettings;
