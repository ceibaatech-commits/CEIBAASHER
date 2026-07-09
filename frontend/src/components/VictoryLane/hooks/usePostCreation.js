import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { uploadImage, uploadVideo, validateFile, validateVideoDuration, getVideoDuration } from '../../../utils/cloudinaryUpload';

const BACKEND_URL = window.location.origin;

const normalizeMediaPermissions = (data = {}) => ({
  allow_media: Boolean(data.allow_media),
  can_post_images: Boolean(data.can_post_images),
  can_post_videos: Boolean(data.can_post_videos)
});

// Generate unique ID for media items
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const usePostCreation = (user, fetchFeed) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  
  // Enhanced media state with preview URLs and upload progress
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [mediaSettings, setMediaSettings] = useState({
    allow_media: false,
    can_post_images: false,
    can_post_videos: false
  });

  // Legacy state for backward compatibility
  const [selectedPostImages, setSelectedPostImages] = useState([]);
  const [selectedPostVideos, setSelectedPostVideos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user media permissions
  useEffect(() => {
    const fetchMediaSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/user/media-permissions`);
        setMediaSettings(normalizeMediaPermissions(response.data));
      } catch (error) {
        console.error('Error fetching media permissions:', error);
        setMediaSettings(normalizeMediaPermissions());
      }
    };
    fetchMediaSettings();
  }, [user]);

  // Add image files with preview
  const addImages = useCallback(async (files) => {
    if (!mediaSettings.can_post_images) {
      toast.error('Image uploads are not enabled for your account');
      return;
    }

    const currentImages = mediaFiles.filter(f => f.type === 'image');
    const remainingSlots = 4 - currentImages.length;
    
    if (remainingSlots <= 0) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newMediaItems = [];

    for (const file of filesToAdd) {
      // Validate file
      const validation = validateFile(file, 'image');
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newMediaItems.push({
        id: generateId(),
        type: 'image',
        file,
        previewUrl,
        progress: 0,
        uploading: false,
        uploaded: false,
        uploadedUrl: null,
        error: null
      });
    }

    setMediaFiles(prev => [...prev, ...newMediaItems]);
    setUploadComplete(false);
  }, [mediaSettings.can_post_images, mediaFiles]);

  // Add video file with preview and validation
  const addVideo = useCallback(async (file) => {
    if (!mediaSettings.can_post_videos) {
      toast.error('Video uploads are not enabled for your account');
      return;
    }

    const currentVideos = mediaFiles.filter(f => f.type === 'video');
    if (currentVideos.length >= 1) {
      toast.error('Maximum 1 video allowed per post');
      return;
    }

    // Validate file format and size
    const validation = validateFile(file, 'video');
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Check video duration
    try {
      const duration = await getVideoDuration(file);
      const durationValidation = validateVideoDuration(duration);
      if (!durationValidation.valid) {
        toast.error(durationValidation.error);
        return;
      }
    } catch (err) {
      console.warn('Could not validate video duration:', err);
    }

    const previewUrl = URL.createObjectURL(file);
    const newMediaItem = {
      id: generateId(),
      type: 'video',
      file,
      previewUrl,
      progress: 0,
      uploading: false,
      uploaded: false,
      uploadedUrl: null,
      error: null
    };

    setMediaFiles(prev => [...prev, newMediaItem]);
    setUploadComplete(false);
  }, [mediaSettings.can_post_videos, mediaFiles]);

  // Remove media by index and type
  const removeMedia = useCallback((index, type) => {
    setMediaFiles(prev => {
      const filtered = prev.filter(f => f.type === type);
      const itemToRemove = filtered[index];
      
      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }

      return prev.filter((f, i) => {
        if (f.type !== type) return true;
        const typeIndex = prev.filter(pf => pf.type === type).indexOf(f);
        return typeIndex !== index;
      });
    });
    setUploadComplete(false);
  }, []);

  // Clear all media
  const clearMedia = useCallback(() => {
    mediaFiles.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setMediaFiles([]);
    setUploadComplete(false);
  }, [mediaFiles]);

  // Upload all media to Cloudinary
  const uploadAllMedia = useCallback(async () => {
    if (mediaFiles.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls = [];

    // Mark all as uploading
    setMediaFiles(prev => prev.map(f => ({ ...f, uploading: true, progress: 0 })));

    for (let i = 0; i < mediaFiles.length; i++) {
      const item = mediaFiles[i];
      
      try {
        const uploadFn = item.type === 'image' ? uploadImage : uploadVideo;
        
        const result = await uploadFn(item.file, 'posts/', (progress) => {
          setMediaFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress } : f
          ));
        });

        if (result.secure_url) {
          uploadedUrls.push(result.secure_url);
          setMediaFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, uploading: false, uploaded: true, uploadedUrl: result.secure_url } : f
          ));
        }
      } catch (err) {
        console.error(`Upload error for ${item.type}:`, err);
        setMediaFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: false, error: err.message || 'Upload failed' } : f
        ));
        toast.error(`Failed to upload ${item.type}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setUploadComplete(true);
    return uploadedUrls;
  }, [mediaFiles]);

  // Retry a single failed upload
  const retryUpload = useCallback(async (index, type) => {
    // Find the item to retry
    const itemsOfType = mediaFiles.filter(f => f.type === type);
    const item = itemsOfType[index];
    
    if (!item || !item.error) return;

    // Get the actual index in mediaFiles array
    const actualIndex = mediaFiles.findIndex(f => f.id === item.id);
    if (actualIndex === -1) return;

    // Reset the item state
    setMediaFiles(prev => prev.map((f, idx) => 
      idx === actualIndex ? { ...f, uploading: true, progress: 0, error: null } : f
    ));

    try {
      const uploadFn = item.type === 'image' ? uploadImage : uploadVideo;
      
      const result = await uploadFn(item.file, 'posts/', (progress) => {
        setMediaFiles(prev => prev.map((f, idx) => 
          idx === actualIndex ? { ...f, progress } : f
        ));
      });

      if (result.secure_url) {
        setMediaFiles(prev => prev.map((f, idx) => 
          idx === actualIndex ? { ...f, uploading: false, uploaded: true, uploadedUrl: result.secure_url, error: null } : f
        ));
        toast.success(`${item.type === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
      }
    } catch (err) {
      console.error(`Retry upload error for ${item.type}:`, err);
      setMediaFiles(prev => prev.map((f, idx) => 
        idx === actualIndex ? { ...f, uploading: false, error: err.message || 'Upload failed' } : f
      ));
      toast.error(`Failed to upload ${item.type}: ${err.message}`);
    }
  }, [mediaFiles]);

  // Check if post can be submitted
  const canSubmitPost = useCallback(() => {
    const hasContent = newPostContent.trim().length > 0;
    const hasMedia = mediaFiles.length > 0;
    const allUploaded = mediaFiles.every(f => f.uploaded || f.error);
    const noErrors = !mediaFiles.some(f => f.error);
    
    // Can submit if: has content AND (no media OR all media uploaded without errors)
    if (!hasContent) return false;
    if (!hasMedia) return true;
    if (isUploading) return false;
    
    return allUploaded && noErrors;
  }, [newPostContent, mediaFiles, isUploading]);

  // Get button state info
  const getPostButtonState = useCallback(() => {
    const hasContent = newPostContent.trim().length > 0;
    const hasMedia = mediaFiles.length > 0;
    const pendingUploads = mediaFiles.filter(f => !f.uploaded && !f.error);
    const hasErrors = mediaFiles.some(f => f.error);

    if (!hasContent) {
      return { disabled: true, text: 'Post', tooltip: 'Enter some content' };
    }
    if (isUploading) {
      return { disabled: true, text: 'Uploading...', tooltip: 'Please wait for uploads to complete' };
    }
    if (hasMedia && pendingUploads.length > 0) {
      return { disabled: true, text: 'Upload Media', tooltip: 'Click to upload media before posting' };
    }
    if (hasErrors) {
      return { disabled: true, text: 'Post', tooltip: 'Please remove failed uploads' };
    }
    return { disabled: false, text: 'Post', tooltip: '' };
  }, [newPostContent, mediaFiles, isUploading]);

  // Create text post (with optional media via Cloudinary)
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;

    try {
      let mediaUrls = [];
      
      // If there are pending media uploads, upload them first
      const pendingUploads = mediaFiles.filter(f => !f.uploaded && !f.error);
      if (pendingUploads.length > 0) {
        mediaUrls = await uploadAllMedia();
      } else {
        // Use already uploaded URLs
        mediaUrls = mediaFiles.filter(f => f.uploaded && f.uploadedUrl).map(f => f.uploadedUrl);
      }

      // Filter out any nulls/undefined
      mediaUrls = mediaUrls.filter(Boolean);

      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'general',
        content: newPostContent,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      });

      if (response.data.success) {
        // Clear state
        setNewPostContent('');
        clearMedia();
        setShowQuickPostModal(false);
        toast.success('Post created!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Post error:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again to create a post');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create post');
      }
    }
  };

  // Create question post
  const handleCreateQuestion = async (questionText) => {
    if (!questionText.trim() || !user) return;

    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'question',
        content: questionText
      });

      if (response.data.success) {
        toast.success('Question posted!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating question:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again to post');
      } else {
        toast.error('Failed to create question');
      }
      throw error;
    }
  };

  // Create academic question post
  const handleCreateAcademicQuestion = async ({ class_name, subject, chapter, question }) => {
    if (!question.trim() || !user) return;

    try {
      const hashtags = [
        class_name.replace(/\s+/g, ''),
        subject.replace(/\s+/g, ''),
        'AcademicQuestion'
      ];

      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'academic_question',
        content: question,
        hashtags: hashtags,
        academic_class: class_name,
        academic_subject: subject,
        academic_chapter: chapter
      });

      if (response.data.success) {
        toast.success('Academic question posted! It will also appear on the chapter page.');
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating academic question:', error);
      toast.error('Failed to post academic question');
      throw error;
    }
  };

  // Handle image selection (wrapper for file input)
  const handleImageSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [addImages]);

  // Handle video selection (wrapper for file input)
  const handleVideoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      addVideo(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [addVideo]);

  return {
    // Content state
    newPostContent, setNewPostContent,
    
    // Modal states
    showQuizModal, setShowQuizModal,
    showQuestionModal, setShowQuestionModal,
    showAcademicModal, setShowAcademicModal,
    showCreateMenu, setShowCreateMenu,
    showQuickPostModal, setShowQuickPostModal,
    
    // Media permissions
    mediaSettings,
    
    // Enhanced media state
    mediaFiles,
    isUploading,
    uploadComplete,
    
    // Media actions
    addImages,
    addVideo,
    removeMedia,
    clearMedia,
    uploadAllMedia,
    retryUpload,
    handleImageSelect,
    handleVideoSelect,
    
    // Post button helpers
    canSubmitPost,
    getPostButtonState,
    
    // Legacy compatibility
    selectedPostImages, setSelectedPostImages,
    selectedPostVideos, setSelectedPostVideos,
    uploadProgress,
    
    // Post actions
    handleCreatePost,
    handleCreateQuestion,
    handleCreateAcademicQuestion,
  };
};

export default usePostCreation;
