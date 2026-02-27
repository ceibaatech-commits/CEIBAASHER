import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { uploadImage, uploadVideo, validateFile } from '../../../utils/cloudinaryUpload';

const BACKEND_URL = window.location.origin;

const usePostCreation = (user, fetchFeed) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [mediaSettings, setMediaSettings] = useState({
    allow_media: false,
    can_post_images: false,
    can_post_videos: false
  });
  const [selectedPostImages, setSelectedPostImages] = useState([]);
  const [selectedPostVideos, setSelectedPostVideos] = useState([]);

  // Fetch user media permissions
  useEffect(() => {
    const fetchMediaSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMediaSettings({ allow_media: false, can_post_images: false, can_post_videos: false });
          return;
        }
        const response = await axios.get(`${BACKEND_URL}/api/user/media-permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMediaSettings({
          allow_media: !response.data.media_disabled_globally,
          can_post_images: response.data.can_post_images || false,
          can_post_videos: response.data.can_post_videos || false
        });
      } catch (error) {
        console.error('Error fetching media permissions:', error);
        setMediaSettings({ allow_media: false, can_post_images: false, can_post_videos: false });
      }
    };
    fetchMediaSettings();
  }, [user]);

  // Create text post (with optional media via Cloudinary)
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      toast.error('Please log in again to create a post');
      return;
    }

    try {
      let mediaUrls = [];
      const totalFiles = selectedPostImages.length + selectedPostVideos.length;
      let uploadedCount = 0;

      // Upload images to Cloudinary
      if (selectedPostImages.length > 0 && mediaSettings.can_post_images) {
        setIsUploading(true);
        for (const img of selectedPostImages) {
          // Validate file
          const validation = validateFile(img, 'image');
          if (!validation.valid) {
            toast.error(validation.error);
            continue;
          }

          try {
            const result = await uploadImage(img, 'posts/', (progress) => {
              const overallProgress = ((uploadedCount + progress / 100) / totalFiles) * 100;
              setUploadProgress(Math.round(overallProgress));
            });
            
            // Use the secure_url from Cloudinary
            if (result.secure_url) {
              mediaUrls.push(result.secure_url);
            }
            uploadedCount++;
          } catch (uploadErr) {
            console.error('Image upload error:', uploadErr);
            toast.error(`Failed to upload image: ${uploadErr.message}`);
          }
        }
      }

      // Upload videos to Cloudinary
      if (selectedPostVideos.length > 0 && mediaSettings.can_post_videos) {
        setIsUploading(true);
        for (const vid of selectedPostVideos) {
          // Validate file
          const validation = validateFile(vid, 'video');
          if (!validation.valid) {
            toast.error(validation.error);
            continue;
          }

          try {
            const result = await uploadVideo(vid, 'posts/', (progress) => {
              const overallProgress = ((uploadedCount + progress / 100) / totalFiles) * 100;
              setUploadProgress(Math.round(overallProgress));
            });
            
            // Use the secure_url from Cloudinary
            if (result.secure_url) {
              mediaUrls.push(result.secure_url);
            }
            uploadedCount++;
          } catch (uploadErr) {
            console.error('Video upload error:', uploadErr);
            toast.error(`Failed to upload video: ${uploadErr.message}`);
          }
        }
      }

      setIsUploading(false);
      setUploadProgress(0);

      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'general',
        content: newPostContent,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNewPostContent('');
        setSelectedPostImages([]);
        setSelectedPostVideos([]);
        toast.success('Post created!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create post');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Create question post
  const handleCreateQuestion = async (questionText) => {
    if (!questionText.trim() || !user) return;

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      toast.error('Please log in again to create a post');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'question',
        content: questionText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Question posted!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
      throw error;
    }
  };

  // Create academic question post
  const handleCreateAcademicQuestion = async ({ class_name, subject, chapter, question }) => {
    if (!question.trim() || !user) return;

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      toast.error('Please log in again to create a post');
      return;
    }

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
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

  return {
    newPostContent, setNewPostContent,
    showQuizModal, setShowQuizModal,
    showQuestionModal, setShowQuestionModal,
    showAcademicModal, setShowAcademicModal,
    showCreateMenu, setShowCreateMenu,
    showQuickPostModal, setShowQuickPostModal,
    mediaSettings,
    selectedPostImages, setSelectedPostImages,
    selectedPostVideos, setSelectedPostVideos,
    uploadProgress,
    isUploading,
    handleCreatePost,
    handleCreateQuestion,
    handleCreateAcademicQuestion,
  };
};

export default usePostCreation;
