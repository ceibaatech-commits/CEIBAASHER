import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Image, Video, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    allow_media_posts: false,
    allow_image_posts: false,
    allow_video_posts: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/settings`);
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/settings`, settings);
      if (response.data.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      
      // If turning off media posts, turn off both image and video
      if (key === 'allow_media_posts' && !newSettings.allow_media_posts) {
        newSettings.allow_image_posts = false;
        newSettings.allow_video_posts = false;
      }
      
      // If turning on image or video, ensure media posts is also on
      if ((key === 'allow_image_posts' || key === 'allow_video_posts') && newSettings[key]) {
        newSettings.allow_media_posts = true;
      }
      
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600">Configure platform-wide settings</p>
          </div>
        </div>
      </div>

      {/* Victory Lane Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span> Victory Lane Settings
        </h3>
        <p className="text-gray-600 mb-6">
          Control what users can post in Victory Lane. When enabled, users can upload images and videos with their posts.
        </p>

        <div className="space-y-4">
          {/* Master Toggle - Allow Media Posts */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Allow Media Posts</h4>
                <p className="text-sm text-gray-600">Master switch - Enable/disable all media uploads</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('allow_media_posts')}
              className={`p-2 rounded-full transition-colors ${
                settings.allow_media_posts ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.allow_media_posts ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Sub-settings (only visible when master is ON) */}
          {settings.allow_media_posts && (
            <div className="ml-6 space-y-3">
              {/* Allow Image Posts */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Image className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Image Posts</h4>
                    <p className="text-sm text-gray-600">Users can upload images (JPG, PNG, GIF)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('allow_image_posts')}
                  className={`p-1.5 rounded-full transition-colors ${
                    settings.allow_image_posts ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {settings.allow_image_posts ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Allow Video Posts */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Video Posts</h4>
                    <p className="text-sm text-gray-600">Users can upload videos (MP4, WebM)</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('allow_video_posts')}
                  className={`p-1.5 rounded-full transition-colors ${
                    settings.allow_video_posts ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {settings.allow_video_posts ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-700 mb-2">Current Status:</h4>
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              settings.allow_media_posts ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {settings.allow_media_posts ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              Media: {settings.allow_media_posts ? 'Enabled' : 'Disabled'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              settings.allow_image_posts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <Image className="w-4 h-4" />
              Images: {settings.allow_image_posts ? 'Allowed' : 'Not Allowed'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              settings.allow_video_posts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <Video className="w-4 h-4" />
              Videos: {settings.allow_video_posts ? 'Allowed' : 'Not Allowed'}
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
