/**
 * Hydration Service - X Algorithm Inspired Data Fetching
 * 
 * Similar to X's home-mixer hydration layer, this service fetches
 * engagement metrics independently from the main post content.
 * 
 * Architecture:
 * - Seed: Basic post data (fetched once)
 * - Hydration: Engagement metrics (fetched/refreshed periodically)
 * - Batch Processing: Multiple posts hydrated in single request
 */

import axios from 'axios';
import { hydrateEngagement, updateEngagement, incrementViews } from '../stores/engagementStore';

const BACKEND_URL = window.location.origin;

/**
 * Hydrate engagement metrics for multiple posts
 * Called after initial feed fetch to get fresh engagement data
 */
export const hydratePostEngagement = async (postIds, userId = null) => {
  if (!postIds || postIds.length === 0) return;
  
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${BACKEND_URL}/api/social/posts/hydrate`,
      { post_ids: postIds, user_id: userId },
      { headers }
    );
    
    if (response.data.success && response.data.engagement) {
      // Update engagement store with fresh data
      Object.entries(response.data.engagement).forEach(([postId, metrics]) => {
        updateEngagement(postId, metrics);
      });
    }
  } catch (error) {
    console.error('[Hydration] Failed to hydrate engagement:', error);
  }
};

/**
 * Hydrate a single post's engagement (for single post view)
 */
export const hydrateSinglePost = async (postId, userId = null) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(
      `${BACKEND_URL}/api/social/posts/${postId}/engagement`,
      { 
        params: { user_id: userId },
        headers 
      }
    );
    
    if (response.data.success) {
      updateEngagement(postId, response.data.engagement);
      return response.data.engagement;
    }
  } catch (error) {
    console.error('[Hydration] Failed to hydrate single post:', error);
  }
  return null;
};

/**
 * Hydrate Quiz Room data for a post
 * Fetches fresh room details including room_code, participants, status
 */
export const hydrateQuizRoom = async (roomCode) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(
      `${BACKEND_URL}/api/social/quiz-rooms/${roomCode}`,
      { headers }
    );
    
    if (response.data.success) {
      return response.data.room;
    }
  } catch (error) {
    console.error('[Hydration] Failed to hydrate quiz room:', error);
  }
  return null;
};

/**
 * Batch hydrate quiz rooms for multiple posts
 */
export const hydrateQuizRooms = async (roomCodes) => {
  if (!roomCodes || roomCodes.length === 0) return {};
  
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${BACKEND_URL}/api/social/quiz-rooms/batch`,
      { room_codes: roomCodes },
      { headers }
    );
    
    if (response.data.success) {
      return response.data.rooms || {};
    }
  } catch (error) {
    console.error('[Hydration] Failed to batch hydrate quiz rooms:', error);
  }
  return {};
};

/**
 * Record a view and get updated view count
 */
export const recordView = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${BACKEND_URL}/api/social/posts/${postId}/view`,
      {},
      { headers }
    );
    
    if (response.data.success) {
      incrementViews(postId, response.data.views);
      return response.data.views;
    }
  } catch (error) {
    // Silent fail for view recording
    console.debug('[Hydration] View recording failed:', error);
  }
  return null;
};

/**
 * Setup periodic hydration for visible posts
 * Uses IntersectionObserver pattern for efficiency
 */
export const createHydrationObserver = (onVisible, options = {}) => {
  const { threshold = 0.5, rootMargin = '100px' } = options;
  
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const postId = entry.target.dataset.postId;
          if (postId) {
            onVisible(postId);
          }
        }
      });
    },
    { threshold, rootMargin }
  );
};

/**
 * Hydration Queue - Batch requests for efficiency
 */
class HydrationQueue {
  constructor() {
    this.queue = new Set();
    this.timeoutId = null;
    this.delay = 100; // Debounce delay in ms
  }
  
  add(postId) {
    this.queue.add(postId);
    this.scheduleFlush();
  }
  
  scheduleFlush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  async flush() {
    if (this.queue.size === 0) return;
    
    const postIds = Array.from(this.queue);
    this.queue.clear();
    
    await hydratePostEngagement(postIds);
  }
}

export const hydrationQueue = new HydrationQueue();

export default {
  hydratePostEngagement,
  hydrateSinglePost,
  hydrateQuizRoom,
  hydrateQuizRooms,
  recordView,
  createHydrationObserver,
  hydrationQueue,
};
