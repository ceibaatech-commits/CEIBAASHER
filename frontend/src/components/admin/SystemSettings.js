import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Image, Video, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, AlertCircle, Users, Search, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SystemSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingUser, setSavingUser] = useState(null);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

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
        can_post_images: user.can_post_images ?? true,
        can_post_videos: user.can_post_videos ?? true,
        is_disabled: user.is_disabled ?? false,
        [field]: value
      };

      const response = await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/permissions`, permissions);
      
      if (response.data.success) {
        // Update local state
        setUsers(prev => prev.map(u => {
          if ((u.id || u.user_id) === userId) {
            return { ...u, [field]: value };
          }
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

  // Filter users by search
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Permissions</h2>
            <p className="text-gray-600">Manage individual user media posting permissions and account status</p>
          </div>
        </div>
      </div>

      {/* User Permissions Management */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Media Permissions
          </h3>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Control which users can post images and videos. Disabled accounts won't appear in the feed.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <span className="flex items-center gap-2">
            <Image className="w-4 h-4 text-green-600" /> Can Post Images
          </span>
          <span className="flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-600" /> Can Post Videos
          </span>
          <span className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-600" /> Account Disabled
          </span>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  <span className="flex items-center justify-center gap-1">
                    <Image className="w-4 h-4" /> Images
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  <span className="flex items-center justify-center gap-1">
                    <Video className="w-4 h-4" /> Videos
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  <span className="flex items-center justify-center gap-1">
                    <UserX className="w-4 h-4" /> Disabled
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userId = user.id || user.user_id;
                const isSaving = savingUser === userId;
                
                return (
                  <tr 
                    key={userId} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${user.is_disabled ? 'bg-red-50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(user.name || user.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || user.username}</p>
                          <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                        </div>
                        {user.is_disabled && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Can Post Images Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateUserPermissions(userId, 'can_post_images', !(user.can_post_images ?? true))}
                        disabled={isSaving}
                        className={`p-2 rounded-full transition ${
                          (user.can_post_images ?? true) 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${isSaving ? 'opacity-50' : ''}`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (user.can_post_images ?? true) ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    
                    {/* Can Post Videos Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateUserPermissions(userId, 'can_post_videos', !(user.can_post_videos ?? true))}
                        disabled={isSaving}
                        className={`p-2 rounded-full transition ${
                          (user.can_post_videos ?? true) 
                            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${isSaving ? 'opacity-50' : ''}`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (user.can_post_videos ?? true) ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    
                    {/* Disabled Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateUserPermissions(userId, 'is_disabled', !(user.is_disabled ?? false))}
                        disabled={isSaving}
                        className={`p-2 rounded-full transition ${
                          (user.is_disabled ?? false) 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${isSaving ? 'opacity-50' : ''}`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (user.is_disabled ?? false) ? (
                          <UserX className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No users found matching your search' : 'No users found'}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
