import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocialSocket } from '../../../hooks/useSocialSocket';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const useVictoryLane = (user, isAuthenticated, activeTab, searchQuery, selectedTag) => {
  const navigate = useNavigate();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  // Social state
  const [usersData, setUsersData] = useState({});
  const [followingList, setFollowingList] = useState(new Set());
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [sharedPosts, setSharedPosts] = useState(new Set());
  const [closeFriendIds, setCloseFriendIds] = useState(new Set());
  const [myFollowingCount, setMyFollowingCount] = useState(0);
  const [myFollowersCount, setMyFollowersCount] = useState(0);

  // Comments state
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);

  // Menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Fetch close friend IDs
  useEffect(() => {
    if (!user) return;
    axios.get(`${BACKEND_URL}/api/profile/close-friend-ids`)
      .then(res => {
        if (res.data.success && res.data.friend_ids) {
          setCloseFriendIds(new Set(res.data.friend_ids));
        }
      })
      .catch(() => {});
  }, [user]);

  // --- Socket handlers ---
  const handleNewPost = useCallback((newPostData) => {
    if (activeTab === 'for-you' || activeTab === 'trending') {
      setPosts(prevPosts => {
        if (prevPosts.some(p => p.id === newPostData.id)) return prevPosts;
        return [newPostData, ...prevPosts];
      });
      toast.success('New post in feed!', { duration: 2000 });
    }
  }, [activeTab]);

  const handlePostLiked = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === data.post_id ? { ...post, likes_count: data.likes_count } : post
    ));
  }, []);

  const handlePostUnliked = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === data.post_id ? { ...post, likes_count: data.likes_count } : post
    ));
  }, []);

  const handleNewComment = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === data.post_id ? { ...post, comments_count: data.comments_count } : post
    ));
  }, []);

  const handleNotification = useCallback((notification) => {
    toast(notification.content, {
      icon: notification.notification_type === 'like' ? '❤️' :
            notification.notification_type === 'comment' ? '💬' :
            notification.notification_type === 'follow' ? '👤' : '🔔',
      duration: 4000
    });
  }, []);

  const { isConnected, joinFeed } = useSocialSocket(
    user?.id,
    handleNewPost,
    handlePostLiked,
    handlePostUnliked,
    handleNewComment,
    handleNotification
  );

  useEffect(() => {
    if (isConnected) {
      joinFeed(activeTab.replace('-', '_'));
    }
  }, [activeTab, isConnected, joinFeed]);

  // --- Data fetching ---
  const fetchMyFollowing = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${user.id}/following`);
      if (response.data.success) {
        const followingIds = new Set(response.data.following?.map(f => f.id || f.user_id) || []);
        setFollowingList(followingIds);
        setMyFollowingCount(followingIds.size);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  }, [user]);

  const fetchMyStats = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/user/${user.id}`);
      if (response.data.success) {
        setMyFollowersCount(response.data.user?.followers_count || 0);
        setMyFollowingCount(response.data.user?.following_count || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  const fetchFeed = useCallback(async (pageNum = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const limit = 20;
      const skip = pageNum * limit;

      let endpoint = `${BACKEND_URL}/api/social/feed/for-you?skip=${skip}&limit=${limit}`;
      if (activeTab === 'trending') endpoint = `${BACKEND_URL}/api/social/feed/trending?skip=${skip}&limit=${limit}`;
      if (activeTab === 'following' && user) endpoint = `${BACKEND_URL}/api/social/feed/following?user_id=${user.id}&skip=${skip}&limit=${limit}`;

      const response = await axios.get(endpoint);
      if (response.data.success) {
        const postsData = response.data.posts || [];
        setHasMore(response.data.has_more || false);

        if (append) setPosts(prev => [...prev, ...postsData]);
        else setPosts(postsData);

        // Build users data
        const users = {};
        postsData.forEach(post => {
          if (post.user_id) {
            users[post.user_id] = {
              id: post.user_id,
              name: post.user_name || post.username || 'Anonymous',
              username: post.username || 'user',
              avatar: post.user_avatar,
              is_verified: post.is_verified || false,
              followers_count: post.user_followers_count || 0,
              following_count: post.user_following_count || 0,
              posts_count: post.user_posts_count || 0,
              bio: post.user_bio || '',
              location: post.user_location || '',
              joined_at: post.user_joined_at
            };
          }
        });
        setUsersData(prev => ({ ...prev, ...users }));

        // Initialize liked/bookmarked/shared
        setLikedPosts(prev => {
          const liked = append ? new Set(prev) : new Set();
          postsData.forEach(post => {
            if (post.liked_by?.includes(user?.id) || post.user_liked || post.liked_by_user) liked.add(post.id);
          });
          return liked;
        });

        setBookmarkedPosts(prev => {
          const bookmarked = append ? new Set(prev) : new Set();
          postsData.forEach(post => {
            if (post.bookmarked_by?.includes(user?.id) || post.user_bookmarked) bookmarked.add(post.id);
          });
          return bookmarked;
        });

        setSharedPosts(prev => {
          const shared = append ? new Set(prev) : new Set();
          postsData.forEach(post => {
            if (post.shared_by_user) shared.add(post.id);
          });
          return shared;
        });
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, user]);

  // Reset feed on tab change
  useEffect(() => {
    const loadInitialFeed = async () => {
      setPosts([]);
      setPage(0);
      setHasMore(true);
      await fetchFeed(0, false);
      if (user) {
        fetchMyFollowing();
        fetchMyStats();
      }
    };
    loadInitialFeed();
  }, [activeTab, user, fetchFeed, fetchMyFollowing, fetchMyStats]);

  // Pagination
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchFeed(nextPage, true);
        return nextPage;
      });
    }
  }, [hasMore, loadingMore, fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  // --- Computed values ---
  const filteredPosts = posts.filter(post => {
    if (selectedTag) {
      const tagInArray = post.tags && post.tags.some(tag =>
        tag.toLowerCase().replace('#', '') === selectedTag.toLowerCase().replace('#', '')
      );
      const tagInContent = post.content && post.content.toLowerCase().includes(`#${selectedTag.toLowerCase().replace('#', '')}`);
      if (!tagInArray && !tagInContent) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.content?.toLowerCase().includes(query) ||
        (post.user_name || post.username || '').toLowerCase().includes(query) ||
        post.exam_category?.toLowerCase().includes(query) ||
        post.subject?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const allTags = [...new Set(posts.flatMap(post => post.tags || []))].filter(Boolean).slice(0, 20);

  // --- Social actions ---
  const toggleFollow = async (targetUserId) => {
    if (!user) { toast.error('Please login to follow users'); return; }
    if (targetUserId === user.id) { toast.error('You cannot follow yourself'); return; }

    const isFollowing = followingList.has(targetUserId);

    // Optimistic update
    setFollowingList(prev => {
      const newSet = new Set(prev);
      if (isFollowing) newSet.delete(targetUserId);
      else newSet.add(targetUserId);
      return newSet;
    });
    setMyFollowingCount(prev => isFollowing ? prev - 1 : prev + 1);
    setUsersData(prev => {
      if (prev[targetUserId]) {
        return {
          ...prev,
          [targetUserId]: {
            ...prev[targetUserId],
            followers_count: isFollowing
              ? (prev[targetUserId].followers_count || 1) - 1
              : (prev[targetUserId].followers_count || 0) + 1
          }
        };
      }
      return prev;
    });

    try {
      if (isFollowing) {
        await axios.delete(`${BACKEND_URL}/api/social/user/follow/${targetUserId}`);
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/social/user/follow/${targetUserId}`, {});
        toast.success('Following!');
      }
    } catch (error) {
      // Revert
      setFollowingList(prev => {
        const newSet = new Set(prev);
        if (isFollowing) newSet.add(targetUserId);
        else newSet.delete(targetUserId);
        return newSet;
      });
      setMyFollowingCount(prev => isFollowing ? prev + 1 : prev - 1);
      if (error.response?.status !== 401) {
        toast.error('Failed to update follow status');
      }
    }
  };

  const toggleLike = async (postId) => {
    if (!user) { toast.error('Please login to like posts'); return; }
    const isLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newLikedBy = isLiked
          ? (post.liked_by || []).filter(id => id !== user.id)
          : [...(post.liked_by || []), user.id];
        return {
          ...post,
          likes_count: isLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
          liked_by: newLikedBy
        };
      }
      return post;
    }));

    try {
      if (isLiked) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/like`);
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {});
      }
    } catch (error) {
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      toast.error('Failed to update like');
    }
  };

  const toggleBookmark = async (postId) => {
    if (!user) { toast.error('Please login to bookmark posts'); return; }
    const isBookmarked = bookmarkedPosts.has(postId);

    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.delete(postId);
        toast.success('Removed from bookmarks');
      } else {
        newSet.add(postId);
        toast.success('Added to bookmarks');
      }
      return newSet;
    });
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newBookmarkedBy = isBookmarked
          ? (post.bookmarked_by || []).filter(id => id !== user.id)
          : [...(post.bookmarked_by || []), user.id];
        return { ...post, bookmarked_by: newBookmarkedBy };
      }
      return post;
    }));

    // Persist bookmark to backend
    try {
      if (isBookmarked) {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/bookmark`);
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/bookmark`, {});
      }
    } catch {
      // Revert on failure
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      toast.error('Failed to update bookmark');
    }
  };

  const toggleShare = async (postId) => {
    if (!user) { toast.error('Please login to share posts'); return; }
    const isShared = sharedPosts.has(postId);

    if (isShared) {
      setSharedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(post =>
        post.id === postId ? { ...post, shares_count: Math.max((post.shares_count || 1) - 1, 0) } : post
      ));
      try {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/unshare`);
        toast.success('Repost removed');
      } catch (error) {
        setSharedPosts(prev => { const s = new Set(prev); s.add(postId); return s; });
        setPosts(prev => prev.map(post =>
          post.id === postId ? { ...post, shares_count: (post.shares_count || 0) + 1 } : post
        ));
        toast.error('Failed to remove repost');
      }
      return;
    }

    setSharedPosts(prev => { const s = new Set(prev); s.add(postId); return s; });
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, shares_count: (post.shares_count || 0) + 1 } : post
    ));
    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/share`, {});
      toast.success('Post shared successfully!');
    } catch (error) {
      setSharedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(post =>
        post.id === postId ? { ...post, shares_count: Math.max((post.shares_count || 1) - 1, 0) } : post
      ));
      if (error.response?.data?.detail === "You already shared this post") {
        toast.info('You already shared this post');
        setSharedPosts(prev => { const s = new Set(prev); s.add(postId); return s; });
      } else {
        toast.error('Failed to share post');
      }
    }
  };

  // --- Delete ---
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete || !user) return;
    setDeletingPost(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/social/posts/${postToDelete.id}`);
      setPosts(prev => prev.filter(post => post.id !== postToDelete.id));
      toast.success('Post deleted successfully');
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    } finally {
      setDeletingPost(false);
    }
  };

  // --- Comments ---
  const toggleComments = async (postId) => {
    const isExpanded = expandedComments.has(postId);

    if (isExpanded) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => new Set([...prev, postId]));

      if (!postComments[postId]) {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
          const response = await axios.get(`${BACKEND_URL}/api/social/posts/${postId}/comments`);
          if (response.data.success) {
            setPostComments(prev => ({ ...prev, [postId]: response.data.comments || [] }));
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
          setPostComments(prev => ({ ...prev, [postId]: [] }));
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  const submitComment = async (postId, parentCommentId = null) => {
    const commentText = parentCommentId ? replyContent[parentCommentId]?.trim() : newComment[postId]?.trim();
    if (!commentText) { toast.error('Please enter a comment'); return; }

    const checkAuth = () => typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
    if (!checkAuth() || !user) { toast.error('Please login to comment'); return; }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts/${postId}/comment`,
        { content: commentText, parent_comment_id: parentCommentId }
      );

      if (response.data.success) {
        const newCommentData = response.data.comment || {
          id: Date.now().toString(),
          post_id: postId,
          user_id: user.id,
          username: user.username,
          user_name: user.name,
          user_avatar: user.profile_picture,
          content: commentText,
          parent_comment_id: parentCommentId,
          created_at: new Date().toISOString()
        };

        setPostComments(prev => ({
          ...prev,
          [postId]: [newCommentData, ...(prev[postId] || [])]
        }));

        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        ));

        if (parentCommentId) {
          setReplyContent(prev => ({ ...prev, [parentCommentId]: '' }));
          setReplyingTo(null);
        } else {
          setNewComment(prev => ({ ...prev, [postId]: '' }));
        }
        toast.success('Comment posted!');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.detail || 'Failed to post comment');
    }
  };

  // --- Quiz room navigation ---
  const handleJoinRoom = async (roomCode) => {
    if (!roomCode) { toast.error('Invalid room code'); return; }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}`);
      if (!response.data.success) {
        toast.error('Room not found or expired');
        fetchFeed();
        return;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to validate room');
      fetchFeed();
      return;
    }
    navigate(`/quiz-room/${roomCode}`);
  };

  return {
    // Feed
    posts, loading, loadingMore, hasMore, observerTarget,
    filteredPosts, allTags, fetchFeed,
    // Social
    followingList, likedPosts, bookmarkedPosts, sharedPosts, usersData, closeFriendIds,
    myFollowingCount, myFollowersCount,
    toggleFollow, toggleLike, toggleBookmark, toggleShare,
    // Comments
    expandedComments, replyingTo, setReplyingTo, replyContent, setReplyContent,
    postComments, newComment, setNewComment, loadingComments,
    toggleComments, submitComment,
    // Delete
    showDeleteModal, setShowDeleteModal, postToDelete, deletingPost,
    handleDeleteClick, handleDeleteConfirm,
    // Menu
    openMenuId, setOpenMenuId,
    // Socket
    isConnected,
    // Quiz
    handleJoinRoom,
  };
};

export default useVictoryLane;
/ Quiz
    handleJoinRoom,
  };
};

export default useVictoryLane;
