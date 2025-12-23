import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Heart, MessageCircle, Users, Trophy, Flame, Check, Trash2, ArrowLeft } from 'lucide-react';

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
  }, [user, authLoading, activeFilter, fetchNotifications, navigate]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const notifType = notification.notification_type || notification.type;
    const postId = notification.post_id || notification.reference_id;
    const fromUserId = notification.from_user_id || notification.actor_id;

    if (notifType === 'follow' || notifType === 'follow_request' || notifType === 'follow_approved') {
      if (fromUserId) {
        navigate(`/profile/${fromUserId}`);
      }
    } else if (notifType === 'like' || notifType === 'comment') {
      if (postId) {
        navigate(`/victory-lane?post=${postId}`);
      } else {
        navigate('/victory-lane');
      }
    } else if (notifType === 'quiz_created' || notifType === 'score_beaten' || notifType === 'challenge') {
      if (postId) {
        navigate(`/victory-lane?post=${postId}`);
      }
    } else if (notifType === 'daily_streak') {
      navigate('/');
    } else {
      navigate('/victory-lane');
    }
  };

  const getNotificationIcon = (notification) => {
    const type = notification.notification_type || notification.type;
    switch (type) {
      case 'follow':
      case 'follow_request':
      case 'follow_approved':
        return <Users className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5" />;
      case 'quiz_created':
      case 'score_beaten':
      case 'challenge':
        return <Trophy className="w-5 h-5" />;
      case 'daily_streak':
        return <Flame className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (notification) => {
    const type = notification.notification_type || notification.type;
    switch (type) {
      case 'follow':
      case 'follow_request':
      case 'follow_approved':
        return 'from-blue-400 to-blue-600';
      case 'like':
        return 'from-red-400 to-pink-600';
      case 'comment':
        return 'from-green-400 to-emerald-600';
      case 'quiz_created':
      case 'score_beaten':
      case 'challenge':
        return 'from-yellow-400 to-orange-600';
      case 'daily_streak':
        return 'from-orange-400 to-red-600';
      default:
        return 'from-gray-400 to-gray-600';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 sm:mb-6 font-medium transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm sm:text-base">Back</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                </div>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm sm:text-base text-gray-600 mt-2 ml-0 sm:ml-14">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    {unreadCount} unread
                  </span>
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
              >
                <Check className="w-4 h-4" />
                <span className="hidden xs:inline">Mark all read</span>
                <span className="xs:hidden">Mark all</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all text-sm
                    ${activeFilter === filter.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <p className="text-lg sm:text-xl text-gray-900 font-bold">No notifications yet</p>
              <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-sm mx-auto">
                When you get notifications, they will show up here
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  bg-white rounded-xl shadow-md border transition-all hover:shadow-lg cursor-pointer
                  ${!notification.is_read 
                    ? 'border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white' 
                    : 'border border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon Badge */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${getNotificationColor(notification)} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-gray-900 font-semibold leading-snug mb-1">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">
                              {getTimeAgo(notification.created_at)}
                            </p>
                            {!notification.is_read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-start flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors group"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                          </button>
                        </div>
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