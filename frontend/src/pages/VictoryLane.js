import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Send, MessageCircle, Heart, Repeat2, Bookmark, MoreHorizontal, CheckCircle2, HelpCircle, Trash2, Tag, Play, Users, Clock, X, Plus, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import MathText from '../components/MathText';
import DeletePostModal from '../components/DeletePostModal';
import QuestionPostModal from '../components/QuestionPostModal';
import { useSocialSocket } from '../hooks/useSocialSocket';
import { toast } from 'sonner';
import { 
  PostCard, 
  VictoryLaneHeader, 
  CreatePostFAB, 
  CommentsSection 
} from '../components/VictoryLane';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VictoryLane = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const postRefs = useRef({});
  
  // State
  const [activeTab, setActiveTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  
  // Comments state
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  
  // Delete post state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Dynamic user data
  const [usersData, setUsersData] = useState({});
  const [followingList, setFollowingList] = useState(new Set());
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [sharedPosts, setSharedPosts] = useState(new Set());
  const [myFollowingCount, setMyFollowingCount] = useState(0);
  const [myFollowersCount, setMyFollowersCount] = useState(0);
  
  // Quiz Room Creation State
  const [quizForm, setQuizForm] = useState({
    title: '',
    category: '',
    difficulty: 'Medium',
    timeLimit: 15,
    maxParticipants: 50,
    accessControl: 'public', // 'public' or 'followers'
    questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  });

  // Comprehensive exam categories - All exams from backend
  const categories = [
    // Engineering & Medical
    'JEE Main - Physics',
    'JEE Main - Chemistry',
    'JEE Main - Mathematics',
    'NEET - Physics',
    'NEET - Chemistry',
    'NEET - Biology',
    'GATE - General Aptitude',
    'GATE - Engineering Mathematics',
    'NATA - Drawing & Composition',
    'NATA - General Aptitude',
    
    // UPSC & Civil Services
    'UPSC - General Studies',
    'UPSC - History',
    'UPSC - Geography',
    'UPSC - Polity',
    'UPSC - Economy',
    'UPSC - Science & Technology',
    'UPSC - Current Affairs',
    'IES/ISS - General Studies',
    'IES/ISS - Engineering',
    
    // Defense Services
    'NDA - Mathematics',
    'NDA - General Ability Test',
    'CDS - English',
    'CDS - General Knowledge',
    'CDS - Elementary Mathematics',
    'AFCAT - General Awareness',
    'AFCAT - Verbal Ability',
    'AFCAT - Numerical Ability',
    'AFCAT - Reasoning',
    
    // Banking & Finance
    'IBPS PO - Reasoning Ability',
    'IBPS PO - Quantitative Aptitude',
    'IBPS PO - English Language',
    'IBPS PO - General Awareness',
    'IBPS Clerk - Numerical Ability',
    'IBPS Clerk - Reasoning Ability',
    'IBPS Clerk - English Language',
    'IBPS SO - Reasoning',
    'IBPS SO - English Language',
    'IBPS RRB PO - Reasoning',
    'IBPS RRB PO - Quantitative Aptitude',
    'SBI PO - Reasoning',
    'SBI PO - Quantitative Aptitude',
    'SBI PO - English Language',
    'SBI Clerk - Reasoning',
    'SBI Clerk - Quantitative Aptitude',
    'SBI Clerk - English',
    'RBI Grade B - General Awareness',
    'RBI Grade B - English Language',
    'RBI Grade B - Quantitative Aptitude',
    'NABARD Grade B - Reasoning',
    'NABARD Grade B - Quantitative Aptitude',
    'NABARD Grade B - Economic & Social Issues',
    'LIC AAO - Reasoning',
    'LIC AAO - Quantitative Aptitude',
    'LIC AAO - English Language',
    'LIC ADO - Reasoning',
    'LIC ADO - Numerical Ability',
    'LIC ADO - English Language',
    'EPFO EO/AO - General English',
    'EPFO EO/AO - General Reasoning',
    'EPFO EO/AO - Quantitative Aptitude',
    
    // SSC Exams
    'SSC CGL - General Intelligence',
    'SSC CGL - General Awareness',
    'SSC CGL - Quantitative Aptitude',
    'SSC CGL - English Comprehension',
    'SSC CHSL - English Language',
    'SSC CHSL - General Intelligence',
    'SSC CHSL - Quantitative Aptitude',
    'SSC CHSL - General Awareness',
    'SSC GD - Reasoning',
    'SSC GD - General Knowledge',
    'SSC GD - Mathematics',
    'SSC GD - English',
    
    // Railway Exams
    'RRB NTPC - Mathematics',
    'RRB NTPC - General Intelligence',
    'RRB NTPC - General Awareness',
    'RRB NTPC - General Science',
    
    // Teaching Exams
    'CTET - Child Development',
    'CTET - Language I',
    'CTET - Language II',
    'CTET - Mathematics',
    'CTET - Environmental Studies',
    'CTET - Social Studies',
    'DSSB PGT - Subject Knowledge',
    'DSSB TGT - General Awareness',
    'KVS PRT - General Knowledge',
    'HTET - Child Development',
    'MPSET - General Aptitude',
    
    // Management & Law
    'CAT - Verbal Ability',
    'CAT - Quantitative Aptitude',
    'CAT - Data Interpretation',
    'CAT - Logical Reasoning',
    'CLAT - Legal Reasoning',
    'CLAT - Logical Reasoning',
    'CLAT - English Language',
    'CLAT - Current Affairs',
    'GMAT - Quantitative',
    'GMAT - Verbal',
    'GMAT - Integrated Reasoning',
    
    // University Entrance
    'CUET UG - General Test',
    'CUET UG - Domain Subjects',
    
    // Agriculture
    'Agriculture - Agronomy',
    'Agriculture - Horticulture',
    'Agriculture - Soil Science',
    'Agriculture - Plant Protection',
    
    // State Exams
    'RPSC - General Knowledge',
    'RPSC - Reasoning',
    'RPSC - Mathematics',
    
    // Language Proficiency
    'French - Grammar',
    'French - Vocabulary',
    'Chinese - Grammar',
    'Chinese - Vocabulary',
    'Japanese - Grammar',
    'Japanese - Vocabulary',
    'Korean - Grammar',
    'Korean - Vocabulary',
    'Kannada - Grammar',
    
    // General Categories
    'General Knowledge',
    'Current Affairs',
    'Reasoning & Aptitude',
    'English Grammar',
    'Mathematics',
    'General Science'
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);


  // Real-time socket handlers
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
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, likes_count: data.likes_count };
      }
      return post;
    }));
  }, []);

  const handlePostUnliked = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, likes_count: data.likes_count };
      }
      return post;
    }));
  }, []);

  const handleNewComment = useCallback((data) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === data.post_id) {
        return { ...post, comments_count: data.comments_count };
      }
      return post;
    }));
  }, []);

  const handleNotification = useCallback((notification) => {
    toast(notification.content, {
      icon: notification.notification_type === 'like' ? '❤️' : 
            notification.notification_type === 'comment' ? '💬' :
            notification.notification_type === 'follow' ? '👤' : '🔔',
      duration: 4000
    });
  }, []);

  // Initialize socket connection
  const { isConnected, joinFeed } = useSocialSocket(
    user?.id,
    handleNewPost,
    handlePostLiked,
    handlePostUnliked,
    handleNewComment,
    handleNotification
  );

  // Join feed room when tab changes
  useEffect(() => {
    if (isConnected) {
      joinFeed(activeTab.replace('-', '_'));
    }
  }, [activeTab, isConnected, joinFeed]);
  
  // Infinite scroll observer
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
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  // Fetch my following list
  const fetchMyFollowing = async () => {
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
  };

  // Fetch my followers count
  const fetchMyStats = async () => {
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
  };

  // Fetch feed - Reset on tab change
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchFeed(0, false);
    if (user) {
      fetchMyFollowing();
      fetchMyStats();
    }
  }, [activeTab, user]);

  // Filter posts based on search query and selected tag
  const filteredPosts = posts.filter(post => {
    // Tag filter
    if (selectedTag && (!post.tags || !post.tags.includes(selectedTag))) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contentMatch = post.content?.toLowerCase().includes(query);
      const userMatch = (post.user_name || post.username || '').toLowerCase().includes(query);
      const categoryMatch = post.exam_category?.toLowerCase().includes(query);
      const subjectMatch = post.subject?.toLowerCase().includes(query);
      const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(query));
      
      return contentMatch || userMatch || categoryMatch || subjectMatch || tagsMatch;
    }
    
    return true;
  });

  // Extract all unique tags from posts
  const allTags = [...new Set(posts.flatMap(post => post.tags || []))].filter(Boolean).slice(0, 20);

  // Handle notification navigation - scroll to specific post
  useEffect(() => {
    const postId = searchParams.get('post') || searchParams.get('postId');
    if (postId && posts.length > 0) {
      // Wait for render to complete, then scroll
      setTimeout(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Highlight the post briefly
          postElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
          setTimeout(() => {
            postElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
            // Remove the query parameter after highlight completes
            setSearchParams({});
          }, 2500);
        } else {
          // If post not found, clear parameter immediately
          setSearchParams({});
        }
      }, 300);
    }
  }, [posts, searchParams, setSearchParams]);

  const fetchFeed = useCallback(async (pageNum = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const limit = 20;
      const skip = pageNum * limit;
      
      let endpoint = `${BACKEND_URL}/api/social/feed/for-you?skip=${skip}&limit=${limit}`;
      if (activeTab === 'trending') endpoint = `${BACKEND_URL}/api/social/feed/trending?skip=${skip}&limit=${limit}`;
      if (activeTab === 'following' && user) endpoint = `${BACKEND_URL}/api/social/feed/following?user_id=${user.id}&skip=${skip}&limit=${limit}`;
      
      const response = await axios.get(endpoint);
      if (response.data.success) {
        const postsData = response.data.posts || [];
        const hasMoreData = response.data.has_more || false;
        
        setHasMore(hasMoreData);
        
        if (append) {
          setPosts(prev => [...prev, ...postsData]);
        } else {
          setPosts(postsData);
        }
        
        // Build users data from posts
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
        
        // Initialize liked/bookmarked states from fresh data
        setLikedPosts(prev => {
          const liked = append ? new Set(prev) : new Set();
          postsData.forEach(post => {
            if (post.liked_by?.includes(user?.id) || post.user_liked) liked.add(post.id);
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
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, user]);
  
  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchFeed(nextPage, true);
        return nextPage;
      });
    }
  }, [hasMore, loadingMore, fetchFeed]);

  // Follow/Unfollow user
  const toggleFollow = async (targetUserId) => {
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }
    
    if (targetUserId === user.id) {
      toast.error('You cannot follow yourself');
      return;
    }

    const isFollowing = followingList.has(targetUserId);
    
    // Optimistic update
    setFollowingList(prev => {
      const newSet = new Set(prev);
      if (isFollowing) {
        newSet.delete(targetUserId);
      } else {
        newSet.add(targetUserId);
      }
      return newSet;
    });
    
    // Update following count
    setMyFollowingCount(prev => isFollowing ? prev - 1 : prev + 1);
    
    // Update target user's followers count in usersData
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
        await axios.delete(`${BACKEND_URL}/api/social/user/follow/${targetUserId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/social/user/follow/${targetUserId}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Following!');
      }
    } catch (error) {
      // Revert on error
      setFollowingList(prev => {
        const newSet = new Set(prev);
        if (isFollowing) newSet.add(targetUserId);
        else newSet.delete(targetUserId);
        return newSet;
      });
      setMyFollowingCount(prev => isFollowing ? prev + 1 : prev - 1);
      toast.error('Failed to update follow status');
    }
  };

  // Toggle like
  const toggleLike = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    // Optimistic update
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
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    } catch (error) {
      // Revert on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      toast.error('Failed to update like');
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (postId) => {
    if (!user) {
      toast.error('Please login to bookmark posts');
      return;
    }

    const isBookmarked = bookmarkedPosts.has(postId);
    
    // Optimistic update
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

    // API call would go here for persistence
  };

  // Delete post handler
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
    setOpenMenuId(null); // Close the menu
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete || !user) return;
    
    setDeletingPost(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      await axios.delete(`${BACKEND_URL}/api/social/posts/${postToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove post from state
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


  // Toggle share/repost
  const toggleShare = async (postId) => {
    if (!user) {
      toast.error('Please login to share posts');
      return;
    }

    const isShared = sharedPosts.has(postId);
    
    // For share, we only allow adding (not un-sharing)
    if (isShared) {
      toast.info('You already shared this post');
      return;
    }

    // Optimistic update
    setSharedPosts(prev => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { 
          ...post, 
          shares_count: (post.shares_count || 0) + 1
        };
      }
      return post;
    }));

    try {
      await axios.post(`${BACKEND_URL}/api/social/posts/${postId}/share`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Post shared successfully!');
    } catch (error) {
      // Revert on error
      setSharedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { 
            ...post, 
            shares_count: Math.max((post.shares_count || 1) - 1, 0)
          };
        }
        return post;
      }));
      toast.error('Failed to share post');
    }
  };

  // Toggle comments section
  const toggleComments = async (postId) => {
    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      // Collapse comments
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      // Expand and fetch comments
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

  // Submit a new comment
  const submitComment = async (postId, parentCommentId = null) => {
    const commentText = parentCommentId ? replyContent[parentCommentId]?.trim() : newComment[postId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }
    if (!isAuthenticated() || !user) {
      toast.error('Please login to comment');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/social/posts/${postId}/comment`,
        { content: commentText, parent_comment_id: parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
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
        
        setPosts(posts.map(p => 
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
      const errorMsg = error.response?.data?.detail || 'Failed to post comment';
      toast.error(errorMsg);
    }
  };

  // Open profile modal
  const openProfile = (usernameOrId) => {
    if (!usernameOrId) {
      console.warn('[VictoryLane] openProfile called with empty username:', usernameOrId);
      return;
    }
    // Navigate to profile using username (not userId)
    console.log('[VictoryLane] Navigating to profile:', usernameOrId);
    navigate(`/profile/${usernameOrId}`);
  };

  // Create text post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'general',
        content: newPostContent,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setNewPostContent('');
        toast.success('Post created!');
        fetchFeed();
      }
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  // Create question post
  const handleCreateQuestion = async (questionText) => {
    if (!questionText.trim() || !user) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'question',
        content: questionText,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        toast.success('Question posted!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
      throw error;
    }
  };

  // Create quiz room
  const handleCreateQuizRoom = async () => {
    const validQuestions = quizForm.questions.filter(q => q.question.trim());
    
    // Validation checks
    if (validQuestions.length < 5) {
      toast.error('Minimum 5 questions required');
      return;
    }

    if (validQuestions.length > 50) {
      toast.error('Maximum 50 questions allowed');
      return;
    }

    if (!quizForm.title.trim() || !quizForm.category) {
      toast.error('Please fill in title and category');
      return;
    }

    if (quizForm.maxParticipants < 2 || quizForm.maxParticipants > 100) {
      toast.error('Participants must be between 2 and 100');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/battle/create-room`, {
        hostName: user?.name || 'Quiz Host',
        subject: quizForm.category,
        maxParticipants: quizForm.maxParticipants,
        timePerQuestion: Math.floor((quizForm.timeLimit * 60) / validQuestions.length),
        questions: validQuestions.map((q, idx) => ({
          id: `q${idx + 1}`,
          question: q.question,
          options: q.options.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt })),
          correctAnswer: String.fromCharCode(97 + q.correctAnswer)
        }))
      });

      if (response.data.success) {
        const roomId = response.data.roomId;
        
        // Create social post with quiz room data
        const postResponse = await axios.post(`${BACKEND_URL}/api/social/posts`, {
          post_type: 'quiz_room',
          content: `🎯 Created a new quiz room: ${quizForm.title}`,
          user_id: user.id,
          quiz_details: {
            title: quizForm.title,
            category: quizForm.category,
            difficulty: quizForm.difficulty,
            questions_count: validQuestions.length,
            room_code: roomId,
            time_limit: quizForm.timeLimit,
            max_participants: quizForm.maxParticipants,
            access_control: quizForm.accessControl,
            host_name: user?.name || 'Quiz Host',
            host_id: user?.id
          }
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (postResponse.data.success) {
          // Reset form
          setShowQuizModal(false);
          setQuizForm({
            title: '',
            category: '',
            difficulty: 'Medium',
            timeLimit: 15,
            maxParticipants: 50,
            accessControl: 'public',
            questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
          });
          
          toast.success(`Quiz room created! PIN: ${roomId}`, { duration: 5000 });
          
          // Refresh feed to show new post
          await fetchFeed();
        } else {
          toast.error('Quiz room created but failed to post to feed');
        }
      }
    } catch (error) {
      console.error('Error creating quiz room:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to create quiz room';
      toast.error(errorMsg);
    }
  };

  // Update question in form
  const updateQuestion = (index, field, value) => {
    setQuizForm(prev => {
      const newQuestions = [...prev.questions];
      if (field === 'question') {
        newQuestions[index] = { ...newQuestions[index], question: value };
      } else if (field.startsWith('option')) {
        const optIdx = parseInt(field.replace('option', ''));
        const newOptions = [...newQuestions[index].options];
        newOptions[optIdx] = value;
        newQuestions[index] = { ...newQuestions[index], options: newOptions };
      } else if (field === 'correctAnswer') {
        newQuestions[index] = { ...newQuestions[index], correctAnswer: value };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  // Add more questions
  const addQuestion = () => {
    if (quizForm.questions.length >= 50) {
      toast.error('Maximum 50 questions allowed');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Hard': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Easy': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get gradient color for quiz room
  const getGradientColor = (category) => {
    if (category?.includes('Physics')) return '#8B5CF6';
    if (category?.includes('Chemistry')) return '#10B981';
    if (category?.includes('Mathematics') || category?.includes('Math')) return '#3B82F6';
    if (category?.includes('Biology')) return '#EC4899';
    if (category?.includes('History')) return '#F59E0B';
    if (category?.includes('Geography')) return '#14B8A6';
    return '#6366F1';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Join quiz room
  const handleJoinRoom = async (roomCode) => {
    if (!roomCode) {
      toast.error('Invalid room code');
      return;
    }
    
    // Validate room exists before navigating
    try {
      const response = await axios.get(`${BACKEND_URL}/api/social/quiz-rooms/${roomCode}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.data.success) {
        toast.error('Room not found or expired');
        // Refresh feed to remove invalid posts
        fetchFeed();
        return;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to validate room';
      toast.error(errorMsg);
      // Refresh feed to remove invalid posts
      fetchFeed();
      return;
    }
    
    // Navigate to quiz room for direct quiz attempt
    navigate(`/quiz-room/${roomCode}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />
      
      {/* Victory Lane Header - Refactored Component */}
      <VictoryLaneHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchExpanded={searchExpanded}
        setSearchExpanded={setSearchExpanded}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        allTags={allTags}
        filteredPosts={filteredPosts}
        posts={posts}
        isConnected={isConnected}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Guest CTA Banner (compact version) */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mx-4 mt-4 mb-3 rounded-2xl p-6 text-center shadow-lg">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-90" />
            <h2 className="text-xl font-bold mb-1">Join the Victory Lane!</h2>
            <p className="mb-3 text-sm text-blue-50">Share your wins, create quiz rooms, and compete with others</p>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition text-sm shadow-md"
            >
              Login to Participate
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          /* Feed Posts */
          <div className="divide-y divide-gray-200">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                {searchQuery || selectedTag ? (
                  <p>No posts match your search or filter. Try different keywords!</p>
                ) : (
                  <p>No posts yet. Be the first to share!</p>
                )}
              </div>
            ) : (
              filteredPosts.map(post => (
                <div 
                  key={post.id} 
                  ref={(el) => postRefs.current[post.id] = el}
                  className="bg-white p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  {/* Repost Header */}
                  {post.is_retweet && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 ml-11">
                      <Repeat2 className="w-4 h-4" />
                      <span>
                        <span className="font-semibold text-gray-700">{post.user_name || post.username}</span> reposted
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      {/* User Info with Avatar and Follow Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Avatar and Name Container - Vertically Centered */}
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                            const username = post.is_retweet ? post.original_username : post.username;
                            if (username && username !== 'undefined') {
                              openProfile(username);
                            } else {
                              console.warn('[VictoryLane] User has no username:', post);
                              toast.error('User profile not available');
                            }
                          }}>
                            <UserAvatar
                              profilePicture={post.is_retweet ? post.original_user_avatar : post.user_avatar}
                              name={post.is_retweet ? (post.original_user_name || post.original_username) : (post.user_name || post.username)}
                              size="lg"
                              clickable={false}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 hover:underline">
                                {post.is_retweet ? (post.original_user_name || post.original_username || 'Anonymous') : (post.user_name || post.username || 'Anonymous')}
                              </span>
                              {post.isTeacher && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                  Teacher
                                </span>
                              )}
                              {post.isProfessor && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                  Professor
                                </span>
                              )}
                              {post.isOfficial && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                                  Official
                                </span>
                              )}
                              {post.isInstitute && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#8B2E2E'}}>
                                  Institute
                                </span>
                              )}
                              {post.is_verified && (
                                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                              )}
                            </div>
                          </div>
                          <span className="text-gray-500 text-sm">· {formatTimestamp(post.is_retweet ? post.original_created_at : post.created_at)}</span>
                        </div>
                        
                        {/* Action buttons - Follow or Delete */}
                        {user && (
                          <>
                            {post.user_id !== user.id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFollow(post.user_id);
                                }}
                                className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold transition ${
                                  followingList.has(post.user_id)
                                    ? 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                {followingList.has(post.user_id) ? 'Following' : 'Follow'}
                              </button>
                            ) : (
                              /* Three-dot menu for own posts */
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === post.id ? null : post.id);
                                  }}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                                
                                {/* Dropdown menu */}
                                {openMenuId === post.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(post);
                                      }}
                                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Post
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="text-gray-900 mt-1 mb-3 whitespace-pre-wrap">
                        <MathText text={post.content} />
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 5).map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedTag(selectedTag === tag ? null : tag);
                                setShowFilters(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </button>
                          ))}
                          {post.tags.length > 5 && (
                            <span className="text-xs text-gray-500 py-1">+{post.tags.length - 5} more</span>
                          )}
                        </div>
                      )}

                      {/* Category/Subject Tags */}
                      {(post.exam_category || post.subject) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.exam_category && (
                            <button
                              onClick={() => {
                                setSearchQuery(post.exam_category);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-100 transition"
                            >
                              📚 {post.exam_category}
                            </button>
                          )}
                          {post.subject && post.subject !== post.exam_category && (
                            <button
                              onClick={() => {
                                setSearchQuery(post.subject);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium hover:bg-green-100 transition"
                            >
                              📖 {post.subject}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Question Post Indicator */}
                      {post.post_type === 'question' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-blue-800 font-medium">
                            Comprehensive Question - Answered in comments
                          </span>
                        </div>
                      )}

                      {/* Quiz Room Card */}
                      {(post.post_type === 'quiz_room' || post.quiz_details) && post.quiz_details && (
                        <div 
                          className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition mt-3"
                          style={{ borderColor: `${getGradientColor(post.quiz_details.category)}40` }}
                        >
                          <div 
                            className="h-28 flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${getGradientColor(post.quiz_details.category)} 0%, ${getGradientColor(post.quiz_details.category)}cc 100%)` }}
                          >
                            <Trophy className="w-12 h-12 text-white opacity-80" />
                          </div>
                          <div className="p-4 bg-white">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {post.quiz_details.title || 'Quiz Room'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">{post.quiz_details.category}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Play className="w-4 h-4" />
                                <span>{post.quiz_details.questions_count || post.quiz_details.question_count || 5} questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{post.quiz_details.participants || 0}/{post.quiz_details.max_participants || 50} players</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{post.quiz_details.time_limit || 15} min</span>
                              </div>
                            </div>
                            
                            {/* Access Control Badge */}
                            {post.quiz_details.access_control === 'followers' && (
                              <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit">
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-medium">Followers Only</span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between gap-3">
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(post.quiz_details.difficulty || 'Medium')}`}>
                                {post.quiz_details.difficulty || 'Medium'}
                              </span>
                              {(() => {
                                const isFollowersOnly = post.quiz_details.access_control === 'followers';
                                const isHostFollowed = followingList.has(post.quiz_details.host_id || post.user_id);
                                const isOwnRoom = user && post.user_id === user.id;
                                const canJoin = !isFollowersOnly || isHostFollowed || isOwnRoom;
                                
                                if (!canJoin) {
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Users className="w-4 h-4" />
                                      <span>Follow host to join</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <button 
                                    onClick={() => handleJoinRoom(post.quiz_details.room_code)}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition"
                                  >
                                    Join Room
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Battle Result Card */}
                      {post.post_type === 'battle_victory' && post.battle_data && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            <span className="font-bold text-yellow-700">Battle Victory!</span>
                          </div>
                          <p className="text-gray-700">
                            Won against {post.battle_data.opponent} with score {post.battle_data.score}
                          </p>
                        </div>
                      )}

                      {/* Quiz Result Card */}
                      {post.post_type === 'quiz_result' && post.quiz_result && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-700">Quiz Completed!</span>
                          </div>
                          <p className="text-gray-700">
                            Score: {post.quiz_result.score}/{post.quiz_result.total} ({post.quiz_result.percentage}%)
                          </p>
                        </div>
                      )}

                      {/* Interaction Buttons - Compact Mobile-First Design */}
                      <div className="flex items-center gap-1 mt-3 -mx-2">
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                            expandedComments.has(post.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <MessageCircle className={`w-4 h-4 ${expandedComments.has(post.id) ? 'fill-blue-100' : ''}`} />
                          <span className="text-xs font-medium">{post.comments_count || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                            likedPosts.has(post.id) ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 transition-all ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs font-medium">{post.likes_count || 0}</span>
                        </button>

                        <button 
                          onClick={() => toggleShare(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                            sharedPosts.has(post.id) ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <Repeat2 className={`w-4 h-4 transition-all ${sharedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs font-medium">{post.shares_count || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleBookmark(post.id)}
                          className={`p-1.5 rounded-full transition ml-auto ${
                            bookmarkedPosts.has(post.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 transition-all ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {/* Add Comment Input */}
                          {isAuthenticated() && user && (
                            <div className="flex gap-2 mb-4">
                              <UserAvatar
                                profilePicture={user.profile_picture}
                                name={user.name || user.username}
                                size="md"
                              />
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyPress={(e) => e.key === 'Enter' && submitComment(post.id)}
                                  placeholder="Write a comment..."
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-400"
                                />
                                <button
                                  onClick={() => submitComment(post.id)}
                                  disabled={!newComment[post.id]?.trim()}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Post
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Comments List */}
                          {loadingComments[post.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(postComments[post.id] || []).length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-2">No answers yet. Be the first!</p>
                              ) : (
                                (postComments[post.id] || []).filter(c => !c.parent_comment_id).map((comment) => (
                                  <div key={comment.id} className="space-y-2">
                                    <div className="flex gap-3 items-start">
                                      <UserAvatar
                                        profilePicture={comment.user_avatar}
                                        name={comment.user_name || comment.username}
                                        size="sm"
                                        clickable={true}
                                        onClick={() => openProfile(comment.username)}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="bg-gray-50 rounded-2xl px-3 py-2">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span 
                                              onClick={() => openProfile(comment.username)}
                                              className="font-semibold text-gray-900 text-sm cursor-pointer hover:underline"
                                            >
                                              {comment.user_name || comment.username || 'User'}
                                            </span>
                                            {comment.isTeacher && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                                Teacher
                                              </span>
                                            )}
                                            {comment.isProfessor && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                Professor
                                              </span>
                                            )}
                                            {comment.isOfficial && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                                                Official
                                              </span>
                                            )}
                                            {comment.isInstitute && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#8B2E2E'}}>
                                                Institute
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-gray-700 text-sm mt-0.5">
                                            <MathText text={comment.content} />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 ml-3">
                                          <span className="text-xs text-gray-400">
                                            {formatTimestamp(comment.created_at)}
                                          </span>
                                          {isAuthenticated() && (
                                            <button
                                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                              Reply
                                            </button>
                                          )}
                                        </div>
                                        
                                        {/* Reply Input */}
                                        {replyingTo === comment.id && (
                                          <div className="flex gap-2 mt-2 ml-3">
                                            <UserAvatar
                                              profilePicture={user?.profile_picture}
                                              name={user?.name}
                                              size="xs"
                                            />
                                            <div className="flex-1 flex gap-2">
                                              <input
                                                type="text"
                                                value={replyContent[comment.id] || ''}
                                                onChange={(e) => setReplyContent(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                onKeyPress={(e) => e.key === 'Enter' && submitComment(post.id, comment.id)}
                                                placeholder={`Reply to ${comment.user_name || comment.username}...`}
                                                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-1.5 focus:outline-none focus:border-blue-400"
                                              />
                                              <button
                                                onClick={() => submitComment(post.id, comment.id)}
                                                disabled={!replyContent[comment.id]?.trim()}
                                                className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                <Send className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Nested Replies */}
                                        {(postComments[post.id] || []).filter(r => r.parent_comment_id === comment.id).map((reply) => (
                                          <div key={reply.id} className="flex gap-2 mt-3 ml-8 items-start">
                                            <UserAvatar
                                              profilePicture={reply.user_avatar}
                                              name={reply.user_name || reply.username}
                                              size="xs"
                                              clickable={true}
                                              onClick={() => openProfile(reply.username)}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span 
                                                    onClick={() => openProfile(reply.username)}
                                                    className="font-semibold text-gray-900 text-xs cursor-pointer hover:underline"
                                                  >
                                                    {reply.user_name || reply.username || 'User'}
                                                  </span>
                                                  {reply.isTeacher && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                                      Teacher
                                                    </span>
                                                  )}
                                                  {reply.isProfessor && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                      Professor
                                                    </span>
                                                  )}
                                                  {reply.isOfficial && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                                                      Official
                                                    </span>
                                                  )}
                                                  {reply.isInstitute && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#8B2E2E'}}>
                                                      Institute
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-gray-700 text-xs mt-0.5">{reply.content}</p>
                                              </div>
                                              <span className="text-xs text-gray-400 ml-3 mt-1 inline-block">
                                                {formatTimestamp(reply.created_at)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Infinite Scroll Loader */}
            {!loading && filteredPosts.length > 0 && (
              <div ref={observerTarget} className="py-8 flex justify-center">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading more posts...</span>
                  </div>
                ) : hasMore ? (
                  <div className="text-sm text-gray-400">Scroll to load more</div>
                ) : (
                  <div className="text-sm text-gray-400">You've reached the end</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quiz Creation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Quiz Room</h2>
              <button
                onClick={() => setShowQuizModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-5">
                {/* Quiz Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Thermodynamics Masterclass"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={quizForm.category}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={quizForm.difficulty}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 15 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Max Participants & Access Control */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={quizForm.maxParticipants}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 50 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Max 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Control</label>
                    <select
                      value={quizForm.accessControl}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, accessControl: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="public">Public - Anyone can join</option>
                      <option value="followers">Followers Only</option>
                    </select>
                  </div>
                </div>

                {/* Access Control Info */}
                {quizForm.accessControl === 'followers' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Followers Only:</span> Only users who follow you can join this quiz room
                    </p>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Quiz Room Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Minimum 5 questions required</li>
                      <li>Maximum 50 questions allowed</li>
                      <li>Participant limit: 2-100 users</li>
                    </ul>
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Questions ({quizForm.questions.filter(q => q.question.trim()).length}/{quizForm.questions.length} - Min: 5, Max: 50)
                  </label>
                  <div className="space-y-4">
                    {quizForm.questions.map((q, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                        <p className="text-sm font-medium text-gray-500 mb-2">Question {idx + 1}</p>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="Enter your question..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                            <input
                              key={opt}
                              type="text"
                              value={q.options[optIdx]}
                              onChange={(e) => updateQuestion(idx, `option${optIdx}`, e.target.value)}
                              placeholder={`Option ${opt}`}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ))}
                        </div>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(idx, 'correctAnswer', parseInt(e.target.value))}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Correct: Option A</option>
                          <option value={1}>Correct: Option B</option>
                          <option value={2}>Correct: Option C</option>
                          <option value={3}>Correct: Option D</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  {quizForm.questions.length < 50 ? (
                    <button
                      onClick={addQuestion}
                      className="mt-3 text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add More Questions ({quizForm.questions.length}/50)
                    </button>
                  ) : (
                    <div className="mt-3 text-gray-500 font-medium text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Maximum 50 questions reached
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex gap-4">
              <button
                onClick={() => setShowQuizModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuizRoom}
                disabled={
                  quizForm.questions.filter(q => q.question.trim()).length < 5 || 
                  quizForm.questions.filter(q => q.question.trim()).length > 50 ||
                  !quizForm.title.trim() || 
                  !quizForm.category ||
                  quizForm.maxParticipants < 2 ||
                  quizForm.maxParticipants > 100
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      
      {/* Delete Post Confirmation Modal */}
      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPostToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        postType={postToDelete?.post_type}
        loading={deletingPost}
      />

      {/* Question Post Modal */}
      <QuestionPostModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onSubmit={handleCreateQuestion}
        user={user}
      />

      {/* Floating Action Button - Refactored Component */}
      <CreatePostFAB
        user={user}
        showCreateMenu={showCreateMenu}
        setShowCreateMenu={setShowCreateMenu}
        showQuickPostModal={showQuickPostModal}
        setShowQuickPostModal={setShowQuickPostModal}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        handleCreatePost={handleCreatePost}
        setShowQuizModal={setShowQuizModal}
        setShowQuestionModal={setShowQuestionModal}
      />
    </div>
  );
};

export default VictoryLane;
