import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Image, Video, ToggleLeft, ToggleRight, Save, Loader2, AlertCircle, Users, Search, UserX, UserCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const SystemSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingUser, setSavingUser] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({
    allow_media_posts: false,
    allow_image_posts: false,
    allow_video_posts: false,
  });
  const [savingGlobal, setSavingGlobal] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/settings/media-allowed`);
      setGlobalSettings({
        allow_media_posts: res.data.allow_media_posts ?? false,
        allow_image_posts: res.data.allow_image_posts ?? false,
        allow_video_posts: res.data.allow_video_posts ?? false,
      });
    } catch (err) {
      console.error('Error fetching global settings:', err);
    }
  };

  const saveGlobalSettings = async (newSettings) => {
    setSavingGlobal(true);
    try {
      await axios.post(`${BACKEND_URL}/api/admin/settings`, newSettings);
      setGlobalSettings(newSettings);
      toast.success('Global media settings updated');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSavingGlobal(false);
    }
  };

  const toggleGlobal = (field) => {
    const updated = { ...globalSettings, [field]: !globalSettings[field] };
    // If master toggle is turned off, turn off sub-toggles
    if (field === 'allow_media_posts' && !updated.allow_media_posts) {
      updated.allow_image_posts = false;
      updated.allow_video_posts = false;
    }
    // If a sub-toggle is turned on, ensure master is on
    if ((field === 'allow_image_posts' || field === 'allow_video_posts') && updated[field]) {
      updated.allow_media_posts = true;
    }
    saveGlobalSettings(updated);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (userId, field, value) => {
    setSavingUser(userId);
    try {
      const user = users.find(u => (u.id || u.user_id) === userId);
      const permissions = {
        can_post_images: user.can_post_images ?? false,
        can_post_videos: user.can_post_videos ?? false,
        is_disabled: user.is_disabled ?? false,
        [field]: value
      };
      const response = await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/permissions`, permissions);
      if (response.data.success) {
        setUsers(prev => prev.map(u => {
          if ((u.id || u.user_id) === userId) return { ...u, [field]: value };
          return u;
        }));
        toast.success('User permissions updated');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSavingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const name = (user.name || user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Media Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Global Media Settings</h2>
            <p className="text-sm text-gray-500">Controls media uploads for ALL users. Default: Disabled.</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Master Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${globalSettings.allow_media_posts ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <p className="font-semibold text-gray-900">Allow Media Uploads</p>
              <p className="text-sm text-gray-500">Master switch — must be ON for any media uploads</p>
            </div>
            <button
              onClick={() => toggleGlobal('allow_media_posts')}
              disabled={savingGlobal}
              className={`p-2 rounded-full transition ${globalSettings.allow_media_posts ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}
              data-testid="toggle-global-media"
            >
              {savingGlobal ? <Loader2 className="w-6 h-6 animate-spin" /> : globalSettings.allow_media_posts ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>

          {/* Sub-Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
            <div className={`flex items-center justify-between p-3 rounded-lg border transition ${globalSettings.allow_image_posts ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">Allow Images</span>
              </div>
              <button
                onClick={() => toggleGlobal('allow_image_posts')}
                disabled={savingGlobal}
                className={`p-1.5 rounded-full transition ${globalSettings.allow_image_posts ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-400'}`}
                data-testid="toggle-global-images"
              >
                {globalSettings.allow_image_posts ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg border transition ${globalSettings.allow_video_posts ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-800">Allow Videos</span>
              </div>
              <button
                onClick={() => toggleGlobal('allow_video_posts')}
                disabled={savingGlobal}
                className={`p-1.5 rounded-full transition ${globalSettings.allow_video_posts ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-400'}`}
                data-testid="toggle-global-videos"
              >
                {globalSettings.allow_video_posts ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!globalSettings.allow_media_posts && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">Media uploads are disabled globally. No user can upload images or videos regardless of their individual permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-User Permissions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Per-User Permissions</h3>
              <p className="text-sm text-gray-500">Individual user media access {!globalSettings.allow_media_posts && '(inactive — global media is OFF)'}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 text-sm"
            />
          </div>
        </div>

        <div className={`overflow-x-auto ${!globalSettings.allow_media_posts ? 'opacity-50 pointer-events-none' : ''}`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">User</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                  <span className="flex items-center justify-center gap-1"><Image className="w-4 h-4" /> Images</span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                  <span className="flex items-center justify-center gap-1"><Video className="w-4 h-4" /> Videos</span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                  <span className="flex items-center justify-center gap-1"><UserX className="w-4 h-4" /> Disabled</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userId = user.id || user.user_id;
                const isSaving = savingUser === userId;
                return (
                  <tr key={userId} className={`border-b border-gray-100 hover:bg-gray-50 transition ${user.is_disabled ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(user.name || user.username || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{user.name || user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PermToggle on={user.can_post_images ?? false} saving={isSaving} onClick={() => updateUserPermissions(userId, 'can_post_images', !(user.can_post_images ?? false))} colorOn="green" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PermToggle on={user.can_post_videos ?? false} saving={isSaving} onClick={() => updateUserPermissions(userId, 'can_post_videos', !(user.can_post_videos ?? false))} colorOn="purple" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PermToggle on={user.is_disabled ?? false} saving={isSaving} onClick={() => updateUserPermissions(userId, 'is_disabled', !(user.is_disabled ?? false))} colorOn="red" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery ? 'No users found matching your search' : 'No users found'}
          </div>
        )}
        <p className="mt-3 text-xs text-gray-400">Showing {filteredUsers.length} of {users.length} users</p>
      </div>
    </div>
  );
};

const PermToggle = ({ on, saving, onClick, colorOn }) => (
  <button
    onClick={onClick}
    disabled={saving}
    className={`p-2 rounded-full transition ${on ? `bg-${colorOn}-100 text-${colorOn}-600 hover:bg-${colorOn}-200` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} ${saving ? 'opacity-50' : ''}`}
  >
    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : on ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
  </button>
);

export default SystemSettings;
