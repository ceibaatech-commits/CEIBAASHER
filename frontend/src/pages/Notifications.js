import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Header from '../components/Header';
import { Bell, Heart, MessageCircle, Users, Trophy, Flame, Check, Trash2, ArrowLeft, CheckCheck, Loader2 } from 'lucide-react';

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    loadingMore,
    hasMore,
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
      fetchNotifications(activeFilter, true);
    }
  // eslint-disable-next-line
  }, [user, authLoading, activeFilter, navigate]);

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

  // Distinct colors for different notification types
  const getNotificationStyles = (notification) => {
    const type = notification.notification_type || notification.type;
    switch (type) {
      case 'follow':
      case 'follow_request':
      case 'follow_approved':
        return { bg: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-600' };
      case 'like':
        return { bg: 'bg-pink-500', lightBg: 'bg-pink-50', text: 'text-pink-600' };
      case 'comment':
        return { bg: 'bg-green-500', lightBg: 'bg-green-50', text: 'text-green-600' };
      case 'quiz_created':
      case 'score_beaten':
      case 'challenge':
        return { bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-600' };
      case 'daily_streak':
        return { bg: 'bg-orange-500', lightBg: 'bg-orange-50', text: 'text-orange-600' };
      default:
        return { bg: 'bg-purple-500', lightBg: 'bg-purple-50', text: 'text-purple-600' };
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const filters = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'follow', label: 'Follows', icon: Users },
    { id: 'like', label: 'Likes', icon: Heart },
    { id: 'comment', label: 'Comments', icon: MessageCircle }
  ];

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-2"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-purple-600 font-medium">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="h-10 px-3 flex items-center gap-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 active:scale-95 transition-all text-sm font-semibold"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Read all</span>
              </button>
            )}
          </div>

          {/* Filter Tabs - Horizontal Scroll */}
          <div className="px-4 pb-3">
            <div 
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      flex items-center gap-1.5 px-4 h-9 rounded-full font-medium whitespace-nowrap transition-all active:scale-95
                      ${isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        {notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No notifications</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              When someone likes, comments, or follows you, it will show up here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const styles = getNotificationStyles(notification);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    bg-white rounded-xl border transition-all cursor-pointer
                    active:scale-[0.98] active:bg-gray-50
                    ${!notification.is_read 
                      ? `border-l-4 border-l-purple-500 border-t border-r border-b border-gray-100 ${styles.lightBg}` 
                      : 'border-gray-100 hover:border-gray-200'
                    }
                  `}
                >
                  <div className="p-3 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${styles.bg} flex items-center justify-center text-white flex-shrink-0`}>
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-gray-900 leading-snug pr-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-purple-100 active:bg-purple-200 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-purple-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-100 active:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div className="pt-2 pb-4">
                <button
                  onClick={() => fetchNotifications(activeFilter, false)}
                  disabled={loadingMore}
                  data-testid="load-more-notifications"
                  className="w-full h-11 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-4">You've seen all notifications</p>
            )}
          </div>
        )}
      </div>

      {/* CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Notifications;
