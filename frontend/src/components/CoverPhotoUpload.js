import React, { useState } from 'react';
import axios from 'axios';
import { Camera } from 'lucide-react';

const BACKEND_URL = window.location.origin;

const CoverPhotoUpload = ({ currentCover, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentCover);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setPreviewUrl(base64Image);

        // Upload to backend
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(
            `${BACKEND_URL}/api/profile/update`,
            { cover_photo: base64Image },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.data.success) {
            if (onUploadComplete) {
              onUploadComplete(base64Image);
            }
          }
        } catch (error) {
          console.error('Error uploading cover:', error);
          const errorMessage = typeof error.response?.data?.detail === 'string' 
            ? error.response.data.detail 
            : error.response?.data?.message || error.message || 'Failed to upload cover photo. Please try again.';
          alert(errorMessage);
          setPreviewUrl(currentCover);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setUploading(false);
    }
  };

  return (
    <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600">
      {/* Cover Photo */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Cover"
          className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`}
        />
      ) : (
        <div className={`w-full h-full ${uploading ? 'opacity-50' : ''}`}></div>
      )}

      {/* Upload Button - Only on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center group">
        <button
          type="button"
          onClick={() => document.getElementById('cover-photo-quick-upload').click()}
          disabled={uploading}
          className="
            opacity-0 group-hover:opacity-100 transition-opacity
            px-6 py-3 bg-white bg-opacity-90 rounded-lg
            font-semibold text-gray-800 hover:bg-opacity-100
            flex items-center gap-2 shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-800 border-t-transparent"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span>{previewUrl ? 'Change Cover Photo' : 'Add Cover Photo'}</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        id="cover-photo-quick-upload"
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default CoverPhotoUpload;
