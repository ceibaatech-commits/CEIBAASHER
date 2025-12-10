import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FollowListModal = ({ isOpen, onClose, userId, type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'followers' 
        ? `/api/social/user/${userId}/followers`
        : `/api/social/user/${userId}/following`;
      
      const response = await axios.get(`${BACKEND_URL}${endpoint}`);
      
      if (response.data.success) {
        const userList = response.data[type] || [];
        setUsers(userList);
        setTotal(userList.length);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  if (!isOpen) return null;

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold">{title}</h2>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
              {total}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-semibold">No {type} yet</p>
              <p className="text-sm">Be the first to connect!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.username)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Picture */}
                    <img
                      src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    {/* View Profile Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user.username);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {users.length > 0 && (
          <div className="border-t border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {users.length} of {total} {type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowListModal;
