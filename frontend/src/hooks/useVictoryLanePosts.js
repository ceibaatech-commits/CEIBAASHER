import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

/**
 * Custom hook for managing VictoryLane posts and interactions
 */
export const useVictoryLanePosts = (user, activeTab, selectedTag, searchQuery) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // User interaction states
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [sharedPosts, setSharedPosts] = useState(new Set());
  const [followingList, setFollowingList] = useState(new Set());

  const fetchFeed = useCallback(async (pageNum = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const limit = 20;
      const skip = pageNum * limit;
      
      let endpoint = `${BACKEND_URL}/api/social/feed?limit=${limit}&skip=${skip}`;
      if (activeTab === 'following' && user?.id) {
        endpoint = `${BACKEND_URL}/api/social/feed/following/${user.id}?limit=${limit}&skip=${skip}`;
      } else if (activeTab === 'trending') {
        endpoint = `${BACKEND_URL}/api/social/feed/trending?limit=${limit}&skip=${skip}`;
      }
      
      const headers = {};
      
      const response = await axios.get(endpoint, { headers });
      
      if (response.data.success) {
        let postsData = response.data.posts || [];
        
        // Filter by tag if selected
        if (selectedTag) {
          postsData = postsData.filter(post => 
            post.hashtags?.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
          );
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          postsData = postsData.filter(post =>
            post.content?.toLowerCase().includes(query) ||
            post.author_details?.name?.toLowerCase().includes(query) ||
            post.hashtags?.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        if (append) {
          setPosts(prev => [...prev, ...postsData]);
        } else {
          setPosts(postsData);
        }
        
        setHasMore(postsData.length === limit);
        
        // Extract liked/bookmarked posts
        if (user?.id) {
          const liked = new Set();
          const bookmarked = new Set();
          postsData.forEach(post => {
            if (post.liked_by?.includes(user.id)) liked.add(post.id);
            if (post.bookmarked_by?.includes(user.id)) bookmarked.add(post.id);
          });
          if (!append) {
            setLikedPosts(liked);
            setBookmarkedPosts(bookmarked);
          } else {
            setLikedPosts(prev => new Set([...prev, ...liked]));
            setBookmarkedPosts(prev => new Set([...prev, ...bookmarked]));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, user?.id, selectedTag, searchQuery]);

  // Fetch following list
  const fetchFollowing = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${user.id}/following`);
      if (response.data.success) {
        const followingIds = new Set(response.data.following?.map(f => f.id || f.user_id) || []);
        setFollowingList(followingIds);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  }, [user?.id]);

  // Like/Unlike post
  const toggleLike = async (postId) => {
    if (!user?.id) {
      toast.error('Please login to like posts');
      return;
    }
    
    const isLiked = likedPosts.has(postId);
    
    try {
      if (isLiked) {
        await axios.delete(`${BACKEND_URL}/api/posts/${postId}/like`);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p
        ));
      } else {
        await axios.post(`${BACKEND_URL}/api/posts/${postId}/like`, {});
        setLikedPosts(prev => new Set([...prev, postId]));
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  // Bookmark/Unbookmark post
  const toggleBookmark = async (postId) => {
    if (!user?.id) {
      toast.error('Please login to bookmark posts');
      return;
    }
    
    const isBookmarked = bookmarkedPosts.has(postId);
    
    try {
      if (isBookmarked) {
        await axios.delete(`${BACKEND_URL}/api/posts/${postId}/bookmark`);
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast.success('Removed from bookmarks');
      } else {
        await axios.post(`${BACKEND_URL}/api/posts/${postId}/bookmark`, {});
        setBookmarkedPosts(prev => new Set([...prev, postId]));
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  // Share/Repost
  const sharePost = async (postId) => {
    if (!user?.id) {
      toast.error('Please login to share posts');
      return;
    }
    
    
    try {
      await axios.post(`${BACKEND_URL}/api/posts/${postId}/repost`, {});
      setSharedPosts(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p
      ));
      toast.success('Post shared!');
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    }
  };

  // Follow/Unfollow user
  const toggleFollow = async (targetUserId) => {
    if (!user?.id) {
      toast.error('Please login to follow users');
      return;
    }
    
    const isFollowing = followingList.has(targetUserId);
    
    try {
      if (isFollowing) {
        await axios.delete(`${BACKEND_URL}/api/social/unfollow/${targetUserId}`);
        setFollowingList(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
        toast.success('Unfollowed');
      } else {
        await axios.post(`${BACKEND_URL}/api/social/follow/${targetUserId}`, {});
        setFollowingList(prev => new Set([...prev, targetUserId]));
        toast.success('Following!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow');
    }
  };

  // Add new post to feed
  const addPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  // Remove post from feed
  const removePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Update post in feed
  const updatePost = (postId, updates) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  };

  // Load more posts
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  };

  // Reset and refetch
  const refresh = () => {
    setPage(0);
    fetchFeed(0, false);
  };

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    likedPosts,
    bookmarkedPosts,
    sharedPosts,
    followingList,
    fetchFeed,
    fetchFollowing,
    toggleLike,
    toggleBookmark,
    sharePost,
    toggleFollow,
    addPost,
    removePost,
    updatePost,
    loadMore,
    refresh
  };
};

export default useVictoryLanePosts;
