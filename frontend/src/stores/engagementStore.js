/**
 * Engagement Store - X Algorithm Inspired Reactive State Management
 * 
 * Similar to X's unified-user-actions and tweetypie services, this store
 * manages engagement metrics (likes, views, shares) independently from post content.
 * 
 * Architecture Pattern:
 * - Candidate Seed: Basic post data (id, content, author)
 * - Hydration Layer: Engagement metrics fetched/updated separately
 * - Reactive Updates: Real-time changes via signals/subscriptions
 */

import { useCallback, useSyncExternalStore } from 'react';

// Engagement data structure
const engagementStore = {
  // Map of postId -> engagement metrics
  metrics: new Map(),
  // Map of postId -> Set of subscriber callbacks
  subscribers: new Map(),
  // Global subscribers for any engagement change
  globalSubscribers: new Set(),
};

// Get or initialize engagement metrics for a post
const getMetrics = (postId) => {
  if (!engagementStore.metrics.has(postId)) {
    engagementStore.metrics.set(postId, {
      likes_count: 0,
      views: 0,
      share_count: 0,
      comment_count: 0,
      liked_by_user: false,
      shared_by_user: false,
      bookmarked_by_user: false,
      last_updated: null,
    });
  }
  return engagementStore.metrics.get(postId);
};

// Notify subscribers of a specific post
const notifySubscribers = (postId) => {
  const postSubscribers = engagementStore.subscribers.get(postId);
  if (postSubscribers) {
    postSubscribers.forEach(callback => callback());
  }
  // Also notify global subscribers
  engagementStore.globalSubscribers.forEach(callback => callback());
};

/**
 * Hydrate engagement metrics from post data (batch initialization)
 * Called when posts are first fetched from the feed API
 */
export const hydrateEngagement = (posts) => {
  posts.forEach(post => {
    const metrics = getMetrics(post.id);
    Object.assign(metrics, {
      likes_count: post.likes_count || post.like_count || 0,
      views: post.views || 0,
      share_count: post.share_count || 0,
      comment_count: post.comment_count || 0,
      liked_by_user: post.liked_by_user || post.user_liked || false,
      shared_by_user: post.shared_by_user || false,
      bookmarked_by_user: post.bookmarked_by_user || post.user_bookmarked || false,
      last_updated: Date.now(),
    });
    notifySubscribers(post.id);
  });
};

/**
 * Update a single engagement metric
 * Called from socket events or API responses
 */
export const updateEngagement = (postId, updates) => {
  const metrics = getMetrics(postId);
  Object.assign(metrics, {
    ...updates,
    last_updated: Date.now(),
  });
  notifySubscribers(postId);
};

/**
 * Optimistic like update - immediate UI feedback
 */
export const optimisticLike = (postId, isLiking, userId) => {
  const metrics = getMetrics(postId);
  metrics.liked_by_user = isLiking;
  metrics.likes_count = Math.max(0, metrics.likes_count + (isLiking ? 1 : -1));
  metrics.last_updated = Date.now();
  notifySubscribers(postId);
};

/**
 * Optimistic share/repost update
 */
export const optimisticShare = (postId, isSharing) => {
  const metrics = getMetrics(postId);
  metrics.shared_by_user = isSharing;
  metrics.share_count = Math.max(0, metrics.share_count + (isSharing ? 1 : -1));
  metrics.last_updated = Date.now();
  notifySubscribers(postId);
};

/**
 * Optimistic bookmark update
 */
export const optimisticBookmark = (postId, isBookmarking) => {
  const metrics = getMetrics(postId);
  metrics.bookmarked_by_user = isBookmarking;
  metrics.last_updated = Date.now();
  notifySubscribers(postId);
};

/**
 * Increment view count
 */
export const incrementViews = (postId, newViewCount) => {
  const metrics = getMetrics(postId);
  metrics.views = newViewCount;
  metrics.last_updated = Date.now();
  notifySubscribers(postId);
};

/**
 * Handle real-time like event from socket
 */
export const handleLikeEvent = (data) => {
  const { post_id, likes_count, user_id, action } = data;
  const metrics = getMetrics(post_id);
  metrics.likes_count = likes_count;
  // Only update liked_by_user if we know who the current user is
  // This is handled by the component based on userId match
  metrics.last_updated = Date.now();
  notifySubscribers(post_id);
};

/**
 * Handle real-time comment event from socket
 */
export const handleCommentEvent = (data) => {
  const { post_id, comments_count } = data;
  const metrics = getMetrics(post_id);
  metrics.comment_count = comments_count;
  metrics.last_updated = Date.now();
  notifySubscribers(post_id);
};

/**
 * Handle real-time share event from socket
 */
export const handleShareEvent = (data) => {
  const { post_id, share_count } = data;
  const metrics = getMetrics(post_id);
  metrics.share_count = share_count;
  metrics.last_updated = Date.now();
  notifySubscribers(post_id);
};

/**
 * React Hook - Subscribe to engagement metrics for a specific post
 * Uses useSyncExternalStore for tear-free reads
 */
export const useEngagement = (postId) => {
  const subscribe = useCallback((callback) => {
    if (!engagementStore.subscribers.has(postId)) {
      engagementStore.subscribers.set(postId, new Set());
    }
    engagementStore.subscribers.get(postId).add(callback);
    
    return () => {
      const subs = engagementStore.subscribers.get(postId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          engagementStore.subscribers.delete(postId);
        }
      }
    };
  }, [postId]);
  
  const getSnapshot = useCallback(() => {
    return getMetrics(postId);
  }, [postId]);
  
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * React Hook - Subscribe to any engagement change (for debugging/logging)
 */
export const useGlobalEngagement = () => {
  const subscribe = useCallback((callback) => {
    engagementStore.globalSubscribers.add(callback);
    return () => {
      engagementStore.globalSubscribers.delete(callback);
    };
  }, []);
  
  const getSnapshot = useCallback(() => {
    return engagementStore.metrics;
  }, []);
  
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Get engagement metrics synchronously (for non-hook contexts)
 */
export const getEngagementSync = (postId) => {
  return getMetrics(postId);
};

/**
 * Bulk get engagement metrics
 */
export const getBulkEngagement = (postIds) => {
  return postIds.reduce((acc, id) => {
    acc[id] = getMetrics(id);
    return acc;
  }, {});
};

export default {
  hydrateEngagement,
  updateEngagement,
  optimisticLike,
  optimisticShare,
  optimisticBookmark,
  incrementViews,
  handleLikeEvent,
  handleCommentEvent,
  handleShareEvent,
  useEngagement,
  useGlobalEngagement,
  getEngagementSync,
  getBulkEngagement,
};
