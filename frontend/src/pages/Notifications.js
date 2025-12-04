import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Heart, MessageCircle, Users, Trophy, Flame, Check, Trash2 } from 'lucide-react';

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchNotifications(activeFilter);
    }
  }, [user, authLoading, activeFilter, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Get notification type (support both field names for backwards compatibility)
    const notifType = notification.notification_type || notification.type;
    const postId = notification.post_id || notification.reference_id;
    const fromUserId = notification.from_user_id || notification.actor_id;

    // Navigate based on notification type
    if (notifType === 'follow' || notifType === 'follow_request' || notifType === 'follow_approved') {
      // Navigate to the user who followed/requested
      if (fromUserId) {
        navigate(`/profile/${fromUserId}`);
      }
    } else if (notifType === 'like' || notifType === 'comment') {
      // Navigate to Victory Lane with the post highlighted
      if (postId) {
        navigate(`/victory-lane?post=${postId}`);
      } else {
        navigate('/victory-lane');
      }
    } else if (notifType === 'quiz_created' || notifType === 'score_beaten' || notifType === 'challenge') {
      // Navigate to quiz room
      if (postId) {
        navigate(`/victory-lane?post=${postId}`);
      }
    } else if (notifType === 'daily_streak') {
      navigate('/');
    } else {
      // Default: go to Victory Lane
      navigate('/victory-lane');
    }
  };

  const getNotificationIcon = (notification) => {
    const type = notification.notification_type || notification.type;
    switch (type) {
      case 'follow':
      case 'follow_request':
      case 'follow_approved':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'quiz_created':
      case 'score_beaten':
      case 'challenge':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'daily_streak':
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  const filters = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'follow', label: 'Follows', icon: Users },
    { id: 'like', label: 'Likes', icon: Heart },
    { id: 'comment', label: 'Comments', icon: MessageCircle },
    { id: 'challenge', label: 'Challenges', icon: Trophy }
  ];

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    if (window.confirm('Delete this notification?')) {
      await deleteNotification(notificationId);
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 mb-4 font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-purple-600" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all
                    ${activeFilter === filter.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 font-semibold">No notifications yet</p>
              <p className="text-gray-500 mt-2">
                When you get notifications, they'll show up here
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all hover:shadow-lg
                  ${!notification.is_read ? 'border-l-4 border-purple-600 bg-purple-50' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(notification.from_user_name || notification.actor_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(notification)}
                        <div>
                          <p className="text-gray-900 font-medium">
                            {notification.content}
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this notification?')) {
                              deleteNotification(notification.id);
                            }
                          }}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
