import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Camera, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EditProfileModal = ({ isOpen, onClose, currentProfile, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    exam_focus: [],
    website: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        bio: currentProfile.bio || '',
        location: currentProfile.location || '',
        exam_focus: currentProfile.exam_focus || [],
        website: currentProfile.website || '',
        profile_picture: currentProfile.profile_picture || ''
      });
      setCharCount((currentProfile.bio || '').length);
    }
  }, [currentProfile]);

  const examOptions = [
    'JEE', 'NEET', 'SSC', 'UPSC', 'CAT', 'GATE', 'Banking', 'Railways',
    'B.Com', 'M.Com', 'B.Tech', 'M.Tech', 'B.Ed', 'MBA', 'BSc', 'BBA', 'M.A.', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'bio') {
      if (value.length <= 150) {
        setFormData({ ...formData, [name]: value });
        setCharCount(value.length);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleExamFocusToggle = (exam) => {
    setFormData(prev => {
      const currentExams = prev.exam_focus || [];
      if (currentExams.includes(exam)) {
        return { ...prev, exam_focus: currentExams.filter(e => e !== exam) };
      } else {
        return { ...prev, exam_focus: [...currentExams, exam] };
      }
    });
  };

  const handleImageUpload = (e, field) => {
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

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [field]: reader.result
      }));
    };
    reader.onerror = () => {
      alert('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('Token from localStorage:', token);
      console.log('Token length:', token ? token.length : 0);
      console.log('Token parts count:', token ? token.split('.').length : 0);
      
      if (!token) {
        alert('You are not logged in. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.put(
        `${BACKEND_URL}/api/profile/update`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Close modal first
        onClose();
        
        // Update profile state in parent
        if (onProfileUpdated) {
          onProfileUpdated({ ...currentProfile, ...formData });
        }
        
        // Show success message after a brief delay
        setTimeout(() => {
          alert('Profile updated successfully!');
        }, 300);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to update profile';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              {/* Profile Picture Preview */}
              <div className="relative">
                <img
                  src={formData.profile_picture || `https://ui-avatars.com/api/?name=${formData.name}&background=random&size=200`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-picture-input').click()}
                  className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* File Input (Hidden) */}
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'profile_picture')}
                className="hidden"
              />

              {/* Upload Button */}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-picture-input').click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">Choose from Gallery</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG, PNG or GIF (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio ({charCount}/150)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Exam Focus */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {examOptions.map(exam => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => handleExamFocusToggle(exam)}
                  className={`
                    px-4 py-2 rounded-full font-medium text-sm transition-all
                    ${(formData.exam_focus || []).includes(exam)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website (Optional)
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`
                flex-1 py-3 rounded-lg font-bold text-white
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }
                transition-all
              `}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
