import React from 'react';
import { Send } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import MathText from '../MathText';

const CommentsSection = ({
  post,
  user,
  isAuthenticated,
  postComments,
  newComment,
  setNewComment,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  loadingComments,
  submitComment,
  openProfile,
  formatTimestamp
}) => {
  // Safe check for authentication - handle both function and boolean
  const checkAuth = () => {
    if (typeof isAuthenticated === 'function') {
      return isAuthenticated();
    }
    return !!user;
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Add Comment Input */}
      {checkAuth() && user && (
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
                    onClick={() => openProfile(comment.user_id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span 
                          onClick={() => openProfile(comment.user_id)}
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
                      <div key={reply.id} className="flex gap-2 mt-2 ml-8">
                        <UserAvatar
                          profilePicture={reply.user_avatar}
                          name={reply.user_name || reply.username}
                          size="xs"
                          clickable={true}
                          onClick={() => openProfile(reply.user_id)}
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-2xl px-3 py-2">
                            <span 
                              onClick={() => openProfile(reply.user_id)}
                              className="font-semibold text-gray-900 text-xs cursor-pointer hover:underline"
                            >
                              {reply.user_name || reply.username}
                            </span>
                            <div className="text-gray-700 text-xs mt-0.5">
                              <MathText text={reply.content} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 ml-3">
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
  );
};

export default CommentsSection;
