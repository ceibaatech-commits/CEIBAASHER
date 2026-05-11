import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

/**
 * Custom hook for managing comments in VictoryLane
 */
export const useComments = (user) => {
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [newComment, setNewComment] = useState({});

  // Fetch comments for a post
  const fetchComments = useCallback(async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/posts/${postId}/comments`, {});
      
      if (response.data.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: response.data.comments || []
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  }, []);

  // Toggle comments visibility
  const toggleComments = useCallback((postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        if (!postComments[postId]) {
          fetchComments(postId);
        }
      }
      return newSet;
    });
  }, [postComments, fetchComments]);

  // Submit a new comment
  const submitComment = useCallback(async (postId, content, onSuccess) => {
    if (!user?.id) {
      toast.error('Please login to comment');
      return;
    }
    
    if (!content?.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/posts/${postId}/comment`,
        { content: content.trim() }
      );
      
      if (response.data.success) {
        const newCommentData = response.data.comment || {
          id: Date.now().toString(),
          content: content.trim(),
          author_id: user.id,
          author_details: {
            id: user.id,
            name: user.name || user.username,
            username: user.username,
            profile_picture: user.profile_picture || user.avatar
          },
          created_at: new Date().toISOString(),
          likes_count: 0
        };
        
        setPostComments(prev => ({
          ...prev,
          [postId]: [newCommentData, ...(prev[postId] || [])]
        }));
        
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        toast.success('Comment posted!');
        
        if (onSuccess) onSuccess(postId);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to post comment';
      toast.error(errorMsg);
    }
  }, [user]);

  // Submit a reply to a comment
  const submitReply = useCallback(async (postId, parentCommentId, content, onSuccess) => {
    if (!user?.id) {
      toast.error('Please login to reply');
      return;
    }
    
    if (!content?.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/posts/${postId}/comment`,
        { 
          content: content.trim(),
          parent_comment_id: parentCommentId
        }
      );
      
      if (response.data.success) {
        // Refresh comments to get the new reply
        await fetchComments(postId);
        setReplyingTo(null);
        setReplyContent(prev => ({ ...prev, [parentCommentId]: '' }));
        toast.success('Reply posted!');
        
        if (onSuccess) onSuccess(postId);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to post reply';
      toast.error(errorMsg);
    }
  }, [user, fetchComments]);

  // Delete a comment
  const deleteComment = useCallback(async (postId, commentId) => {
    if (!user?.id) return;
    
    
    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${postId}/comments/${commentId}`);
      
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
      
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  }, [user]);

  return {
    postComments,
    loadingComments,
    expandedComments,
    replyingTo,
    replyContent,
    newComment,
    setReplyingTo,
    setReplyContent,
    setNewComment,
    fetchComments,
    toggleComments,
    submitComment,
    submitReply,
    deleteComment
  };
};

export default useComments;
