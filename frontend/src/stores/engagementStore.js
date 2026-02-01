/**
 * Simple Engagement Store - Fallback for reactive engagement updates
 */

import { useCallback, useState, useEffect } from 'react';

// Simple hook that returns the engagement data from the post itself
export const useEngagement = (postId) => {
  // Return a default engagement object - the actual data comes from props
  return {
    likes_count: 0,
    views: 0,
    share_count: 0,
    comment_count: 0,
    liked_by_user: false,
    shared_by_user: false,
    bookmarked_by_user: false,
  };
};

export default { useEngagement };
