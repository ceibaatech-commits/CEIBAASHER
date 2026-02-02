import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Send, MessageCircle, Heart, Repeat2, Bookmark, MoreHorizontal, CheckCircle2, HelpCircle, Trash2, Tag, Play, Users, Clock, X, Plus, AlertCircle, Upload, FileSpreadsheet, Edit3, Link as LinkIcon, GraduationCap, BookOpen } from 'lucide-react';
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import MathText from '../components/MathText';
import DeletePostModal from '../components/DeletePostModal';
import QuestionPostModal from '../components/QuestionPostModal';
import AcademicQuestionModal from '../components/AcademicQuestionModal';
import { useSocialSocket } from '../hooks/useSocialSocket';
import { toast } from 'sonner';
import { FeedSkeleton } from '../components/Skeleton';
import { 
  PostCard, 
  VictoryLaneHeader, 
  CreatePostFAB, 
  CommentsSection,
  PostComposer
} from '../components/VictoryLane';

const BACKEND_URL = window.location.origin;

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
  
  // Academic Question Modal state
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  
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
    maxParticipants: 150,
    accessControl: 'public', // 'public' or 'followers'
    questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  });
  
  // Quiz Input Method State
  const [quizInputMethod, setQuizInputMethod] = useState('manual'); // 'manual', 'image', 'sheet'
  const [selectedQuizImage, setSelectedQuizImage] = useState(null);
  const [quizImagePreview, setQuizImagePreview] = useState(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  
  // Media posting settings (controlled by admin per-user)
  const [mediaSettings, setMediaSettings] = useState({
    allow_media_posts: false,
    allow_image_posts: false,
    allow_video_posts: false
  });
  const [selectedPostImage, setSelectedPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [selectedPostVideo, setSelectedPostVideo] = useState(null);
  const [postVideoPreview, setPostVideoPreview] = useState(null);

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
    
    // RSMSSB Exams (Rajasthan)
    'RSMSSB Patwari - Rajasthan GK',
    'RSMSSB Patwari - General Science',
    'RSMSSB Patwari - Hindi & English',
    'RSMSSB Patwari - Reasoning',
    'RSMSSB Patwari - Computer',
    'Rajasthan Police - Reasoning',
    'Rajasthan Police - GK & Current Affairs',
    'Rajasthan Police - Rajasthan GK',
    'Rajasthan Police - Computer',
    'Rajasthan Police - Women & Children Laws',
    'RPSC SO - Statistics',
    'RPSC SO - Rajasthan GK',
    'RPSC SO - Economics',
    
    // UPPSC Exams (Uttar Pradesh)
    'UP Police - General Knowledge',
    'UP Police - General Hindi',
    'UP Police - Numerical Ability',
    'UP Police - Mental Aptitude',
    'UP Police - Reasoning',
    'UPTET - Child Development',
    'UPTET - Hindi',
    'UPTET - English/Sanskrit',
    'UPTET - Mathematics',
    'UPTET - Environmental Studies',
    
    // CSBC Exams (Bihar)
    'Bihar Police - Bihar GK',
    'Bihar Police - Hindi & English',
    'Bihar Police - General Science',
    'Bihar Police - Social Studies',
    'Bihar Police - Mathematics',
    
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

  // Fetch user's media posting permissions (per-user control by admin)
  useEffect(() => {
    const fetchMediaSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMediaSettings({ allow_media_posts: false, allow_image_posts: false, allow_video_posts: false });
          return;
        }
        
        const response = await axios.get(`${BACKEND_URL}/api/user/media-permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Map user permissions to media settings
        setMediaSettings({
          allow_media_posts: response.data.can_post_images || response.data.can_post_videos,
          allow_image_posts: response.data.can_post_images ?? false,
          allow_video_posts: response.data.can_post_videos ?? false
        });
      } catch (error) {
        console.error('Error fetching media permissions:', error);
        setMediaSettings({ allow_media_posts: false, allow_image_posts: false, allow_video_posts: false });
      }
    };
    fetchMediaSettings();
  }, [user]);

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

  // Handle tag query parameter from URL (for hashtag navigation)
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
      setShowFilters(true);
      // Clear the tag param from URL to avoid refresh issues
      searchParams.delete('tag');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);


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
      
      // Include auth header if user is logged in
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(endpoint, { headers });
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
        
        // Initialize shared/reposted states from fresh data
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

  // Fetch feed - Reset on tab change
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
  }, [activeTab, user, fetchFeed]);

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

  // Filter posts based on search query and selected tag
  const filteredPosts = posts.filter(post => {
    // Tag filter - check both tags array AND hashtags in content
    if (selectedTag) {
      const tagInArray = post.tags && post.tags.some(tag => 
        tag.toLowerCase().replace('#', '') === selectedTag.toLowerCase().replace('#', '')
      );
      const tagInContent = post.content && post.content.toLowerCase().includes(`#${selectedTag.toLowerCase().replace('#', '')}`);
      
      if (!tagInArray && !tagInContent) {
        return false;
      }
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
    
    if (isShared) {
      // Unshare/remove repost
      // Optimistic update
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

      try {
        await axios.delete(`${BACKEND_URL}/api/social/posts/${postId}/unshare`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Repost removed');
      } catch (error) {
        // Revert on error
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
        toast.error('Failed to remove repost');
      }
      return;
    }

    // Share/repost
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
      if (error.response?.data?.detail === "You already shared this post") {
        toast.info('You already shared this post');
        // Add back to shared set since it's actually shared
        setSharedPosts(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
      } else {
        toast.error('Failed to share post');
      }
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
    // Safe check for authentication - handle both function and boolean
    const checkAuth = () => {
      if (typeof isAuthenticated === 'function') {
        return isAuthenticated();
      }
      return !!user;
    };
    
    if (!checkAuth() || !user) {
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

  // Create text post (with optional media)
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      let mediaUrls = [];
      
      // Upload image if selected and allowed
      if (selectedPostImage && mediaSettings.allow_image_posts) {
        const formData = new FormData();
        formData.append('file', selectedPostImage);
        
        const uploadResponse = await axios.post(`${BACKEND_URL}/api/media/upload`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (uploadResponse.data.url) {
          mediaUrls.push(uploadResponse.data.url);
        }
      }
      
      // Upload video if selected and allowed
      if (selectedPostVideo && mediaSettings.allow_video_posts) {
        const formData = new FormData();
        formData.append('file', selectedPostVideo);
        
        const uploadResponse = await axios.post(`${BACKEND_URL}/api/media/upload`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (uploadResponse.data.url) {
          mediaUrls.push(uploadResponse.data.url);
        }
      }
      
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'general',
        content: newPostContent,
        user_id: user.id,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setNewPostContent('');
        setSelectedPostImage(null);
        setPostImagePreview(null);
        setSelectedPostVideo(null);
        setPostVideoPreview(null);
        toast.success('Post created!');
        fetchFeed();
      }
    } catch (error) {
      console.error('Post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create post');
    }
  };
  
  // Handle image selection for post
  const handlePostImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image must be less than 10MB');
        return;
      }
      setSelectedPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };
  
  // Handle video selection for post
  const handlePostVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('Video must be less than 50MB');
        return;
      }
      setSelectedPostVideo(file);
      setPostVideoPreview(URL.createObjectURL(file));
    }
  };
  
  // Clear selected media
  const clearPostMedia = () => {
    setSelectedPostImage(null);
    setPostImagePreview(null);
    setSelectedPostVideo(null);
    setPostVideoPreview(null);
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

  // Create academic question post
  const handleCreateAcademicQuestion = async ({ class_name, subject, chapter, question }) => {
    if (!question.trim() || !user) return;
    
    try {
      // Create hashtags from class, subject, and chapter
      const hashtags = [
        class_name.replace(/\s+/g, ''),
        subject.replace(/\s+/g, ''),
        'AcademicQuestion'
      ];
      
      const response = await axios.post(`${BACKEND_URL}/api/social/posts`, {
        post_type: 'academic_question',
        content: question,
        hashtags: hashtags,
        academic_class: class_name,
        academic_subject: subject,
        academic_chapter: chapter,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        toast.success('Academic question posted! It will also appear on the chapter page.');
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating academic question:', error);
      toast.error('Failed to post academic question');
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

    if (quizForm.maxParticipants < 2 || quizForm.maxParticipants > 150) {
      toast.error('Participants must be between 2 and 150');
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
            maxParticipants: 150,
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

  // Handle Image Extraction
  const handleImageExtraction = async () => {
    if (!selectedQuizImage) {
      toast.error('Please select an image first');
      return;
    }

    setExtractingQuestions(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedQuizImage);

      const response = await axios.post(
        `${BACKEND_URL}/api/victory-lane/extract-questions-from-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success && response.data.questions) {
        const questions = response.data.questions.slice(0, 50); // Limit to 50
        
        if (questions.length > 50) {
          toast.warning(`Extracted ${response.data.questions.length} questions, using first 50`);
        }

        // Format extracted questions - user must select correct answer
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: 0, // Default to first option, user must change
          explanation: q.explanation || ''
        }));

        setExtractedQuestions(formattedQuestions);
        setQuizForm(prev => ({
          ...prev,
          questions: formattedQuestions
        }));

        toast.success(`✅ Extracted ${formattedQuestions.length} questions! Please select correct answers manually.`);
      }
    } catch (error) {
      console.error('Error extracting questions:', error);
      toast.error(error.response?.data?.detail || 'Failed to extract questions from image');
    } finally {
      setExtractingQuestions(false);
    }
  };

  // Handle Google Sheet Extraction
  const handleGoogleSheetExtraction = async () => {
    if (!googleSheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }

    if (!googleSheetUrl.includes('docs.google.com/spreadsheets')) {
      toast.error('Please enter a valid Google Sheets URL');
      return;
    }

    setExtractingQuestions(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/extract-questions-from-sheet`, {
        sheet_url: googleSheetUrl
      });

      if (response.data.success && response.data.questions) {
        const questions = response.data.questions.slice(0, 50); // Limit to 50
        
        if (questions.length > 50) {
          toast.warning(`Extracted ${response.data.questions.length} questions, using first 50`);
        }

        // Format extracted questions from sheet (includes correct answers)
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || ''
        }));

        setExtractedQuestions(formattedQuestions);
        setQuizForm(prev => ({
          ...prev,
          questions: formattedQuestions
        }));

        toast.success(`✅ Extracted ${formattedQuestions.length} questions from Google Sheet!`);
      }
    } catch (error) {
      console.error('Error extracting from sheet:', error);
      toast.error(error.response?.data?.detail || 'Failed to extract questions from Google Sheet');
    } finally {
      setExtractingQuestions(false);
    }
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

        {/* Desktop Post Composer - Twitter Style */}
        <PostComposer
          user={user}
          newPostContent={newPostContent}
          setNewPostContent={setNewPostContent}
          mediaSettings={mediaSettings}
          selectedPostImage={selectedPostImage}
          postImagePreview={postImagePreview}
          selectedPostVideo={selectedPostVideo}
          postVideoPreview={postVideoPreview}
          handlePostImageSelect={handlePostImageSelect}
          handlePostVideoSelect={handlePostVideoSelect}
          clearPostMedia={clearPostMedia}
          handleCreatePost={handleCreatePost}
          setShowAcademicModal={setShowAcademicModal}
          setShowQuizModal={setShowQuizModal}
          setShowQuestionModal={setShowQuestionModal}
        />

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
                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    user={user}
                    postRefs={postRefs}
                    followingList={followingList}
                    likedPosts={likedPosts}
                    sharedPosts={sharedPosts}
                    bookmarkedPosts={bookmarkedPosts}
                    expandedComments={expandedComments}
                    openMenuId={openMenuId}
                    onOpenProfile={openProfile}
                    onToggleFollow={toggleFollow}
                    onToggleLike={toggleLike}
                    onToggleShare={toggleShare}
                    onToggleBookmark={toggleBookmark}
                    onToggleComments={toggleComments}
                    onOpenMenu={setOpenMenuId}
                    onDeletePost={handleDeleteClick}
                    onPostClick={(postId) => navigate(`/post/${postId}`)}
                    onTagClick={(tag) => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                        setShowFilters(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onCategoryClick={(category) => {
                        setSearchQuery(category);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    formatTimestamp={formatTimestamp}
                    getGradientColor={getGradientColor}
                    getDifficultyColor={getDifficultyColor}
                    handleJoinRoom={handleJoinRoom}
                  />
                  {expandedComments.has(post.id) && (
                    <CommentsSection
                        post={post}
                        user={user}
                        isAuthenticated={isAuthenticated}
                        postComments={postComments}
                        loadingComments={loadingComments}
                        submitComment={submitComment}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        openProfile={(userId) => navigate(`/profile/${userId}`)}
                        formatTimestamp={formatTimestamp}
                    />
                  )}
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
                  <div className="text-sm text-gray-400">{"You've reached the end"}</div>
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
                      max="150"
                      value={quizForm.maxParticipants}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 150 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Max 150"
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

                {/* Input Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Add Questions</label>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setQuizInputMethod('manual')}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                        quizInputMethod === 'manual'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Edit3 className="w-4 h-4 inline mr-2" />
                      Manual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizInputMethod('image')}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                        quizInputMethod === 'image'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      From Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizInputMethod('sheet')}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                        quizInputMethod === 'sheet'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                      Google Sheet
                    </button>
                  </div>

                  {/* Image Upload Section */}
                  {quizInputMethod === 'image' && (
                    <div className="bg-purple-50 border-2 border-purple-200 border-dashed rounded-xl p-6 mb-4">
                      {/* Instructions Box */}
                      <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Image Quality Guidelines
                        </h4>
                        <ul className="text-xs text-purple-800 space-y-1.5">
                          <li>✅ <strong>High Resolution:</strong> Use clear, high-quality screenshots</li>
                          <li>✅ <strong>Max Size:</strong> Under 3.8 MB (recommended) to avoid processing errors</li>
                          <li>✅ <strong>Clarity:</strong> Ensure text is readable and not blurred</li>
                          <li>✅ <strong>Format:</strong> PNG or JPEG files work best</li>
                          <li>⚠️ <strong>Note:</strong> AI extracts questions & options only. You must select correct answers manually!</li>
                        </ul>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('Image size must be less than 10MB');
                              return;
                            }
                            if (file.size > 3.8 * 1024 * 1024) {
                              toast.warning('⚠️ Image larger than 3.8 MB may cause processing errors. Consider compressing it.');
                            }
                            setSelectedQuizImage(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setQuizImagePreview(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="quiz-image-upload"
                      />
                      <label htmlFor="quiz-image-upload" className="cursor-pointer block">
                        {quizImagePreview ? (
                          <div className="text-center">
                            <img src={quizImagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md mb-3" />
                            <p className="text-sm text-gray-600 mb-1">{selectedQuizImage?.name}</p>
                            <p className="text-xs text-gray-500 mb-3">
                              Size: {(selectedQuizImage?.size / (1024 * 1024)).toFixed(2)} MB
                              {selectedQuizImage?.size > 3.8 * 1024 * 1024 && 
                                <span className="text-orange-600 font-semibold"> (⚠️ May be too large)</span>
                              }
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageExtraction();
                              }}
                              disabled={extractingQuestions}
                              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              {extractingQuestions ? '⏳ Extracting Questions...' : '🔍 Extract Questions (Max 50)'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-600">
                            <Upload className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                            <p className="text-lg font-semibold mb-1">Click to upload question image</p>
                            <p className="text-sm text-gray-600">PNG, JPG, JPEG supported</p>
                            <p className="text-xs text-purple-700 mt-2 font-medium">📸 Recommended: High-resolution screenshots under 3.8 MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Google Sheet URL Section */}
                  {quizInputMethod === 'sheet' && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet Public Link</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="url"
                            value={googleSheetUrl}
                            onChange={(e) => setGoogleSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          ℹ️ Make sure the sheet is publicly accessible and follows the format: Question | Option A | Option B | Option C | Option D | Correct Answer (0-3)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleSheetExtraction}
                        disabled={extractingQuestions || !googleSheetUrl.trim()}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {extractingQuestions ? 'Extracting...' : '📊 Extract Questions from Sheet (Max 50)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {quizInputMethod === 'image' && extractedQuestions.length > 0 
                      ? '⚠️ Select Correct Answer for Each Question' 
                      : `Questions (${quizForm.questions.filter(q => q.question.trim()).length}/${quizForm.questions.length} - Min: 5, Max: 50)`}
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
                  quizForm.maxParticipants > 150
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
      
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

      {/* Academic Question Modal */}
      <AcademicQuestionModal
        isOpen={showAcademicModal}
        onClose={() => setShowAcademicModal(false)}
        onSubmit={handleCreateAcademicQuestion}
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
        setShowAcademicModal={setShowAcademicModal}
      />
    </div>
  );
};

export default VictoryLane;
