import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfilePictureUpload = ({ currentPicture, onUploadComplete, size = 'large' }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPicture);

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
            { profile_picture: base64Image },
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
          console.error('Error uploading image:', error);
          alert('Failed to upload image');
          setPreviewUrl(currentPicture);
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

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const buttonSize = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-2'
  };

  const iconSize = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-4 h-4'
  };

  return (
    <div className="relative inline-block">
      {/* Profile Picture */}
      <img
        src={previewUrl || currentPicture || 'https://ui-avatars.com/api/?name=User&background=random&size=200'}
        alt="Profile"
        className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white shadow-xl ${uploading ? 'opacity-50' : ''}`}
      />

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => document.getElementById('quick-profile-upload').click()}
        disabled={uploading}
        className={`
          absolute bottom-0 right-0 ${buttonSize[size]}
          bg-purple-600 text-white rounded-full 
          hover:bg-purple-700 transition-all shadow-lg
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Change profile picture"
      >
        {uploading ? (
          <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${iconSize[size]}`}></div>
        ) : (
          <Camera className={iconSize[size]} />
        )}
      </button>

      {/* Hidden File Input */}
      <input
        id="quick-profile-upload"
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default ProfilePictureUpload;
