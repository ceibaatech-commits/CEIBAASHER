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
    profile_picture: '',
    cover_photo: ''
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
        profile_picture: currentProfile.profile_picture || '',
        cover_photo: currentProfile.cover_photo || ''
      });
      setCharCount((currentProfile.bio || '').length);
    }
  }, [currentProfile]);

  const examOptions = ['JEE', 'NEET', 'SSC', 'UPSC', 'CAT', 'GATE', 'Banking', 'Railways', 'Other'];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BACKEND_URL}/api/profile/update`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Profile updated successfully!');
        if (onProfileUpdated) {
          onProfileUpdated({ ...currentProfile, ...formData });
        }
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.detail || 'Failed to update profile');
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
              Profile Picture URL
            </label>
            <div className="flex items-center gap-4">
              {formData.profile_picture && (
                <img
                  src={formData.profile_picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <input
                type="text"
                name="profile_picture"
                value={formData.profile_picture}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cover Photo URL
            </label>
            <input
              type="text"
              name="cover_photo"
              value={formData.cover_photo}
              onChange={handleInputChange}
              placeholder="https://example.com/cover.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {formData.cover_photo && (
              <img
                src={formData.cover_photo}
                alt="Cover"
                className="mt-2 w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
            )}
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
