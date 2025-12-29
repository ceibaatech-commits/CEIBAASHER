import React from 'react';
import { 
  Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, CheckCircle2,
  HelpCircle, Trash2, Tag, Trophy, Play, Users, Clock
} from 'lucide-react';
import UserAvatar from '../UserAvatar';
import MathText from '../MathText';

const PostCard = ({
  post,
  user,
  postRefs,
  followingList,
  likedPosts,
  sharedPosts,
  bookmarkedPosts,
  expandedComments,
  openMenuId,
  onOpenProfile,
  onToggleFollow,
  onToggleLike,
  onToggleShare,
  onToggleBookmark,
  onToggleComments,
  onOpenMenu,
  onDeletePost,
  onTagClick,
  onCategoryClick,
  formatTimestamp,
  getGradientColor,
  getDifficultyColor,
  handleJoinRoom
}) => {
  return (
    <div 
      ref={(el) => postRefs.current[post.id] = el}
      className="bg-white p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition"
    >
      {/* Repost Header */}
      {post.is_retweet && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 ml-11">
          <Repeat2 className="w-4 h-4" />
          <span className="font-medium">{post.user_name || post.username} reposted</span>
        </div>
      )}

      {/* Post Header - User Info & Actions */}
      <div className="flex items-start justify-between mb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => onOpenProfile(post.is_retweet ? post.original_user_id : post.user_id)}
        >
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
        
        {/* Action buttons - Follow or Delete */}
        {user && post.user_id !== user.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(post.user_id);
            }}
            className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold transition ${
              followingList.has(post.user_id)
                ? 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {followingList.has(post.user_id) ? 'Following' : 'Follow'}
          </button>
        )}
        {user && post.user_id === user.id && (
          <div className="relative ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu(post.id);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {openMenuId === post.id && (
              <div className="absolute right-full top-0 mr-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePost(post);
                  }}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 flex items-center gap-3 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
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
              onClick={() => onTagClick(tag)}
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
              onClick={() => onCategoryClick(post.exam_category)}
              className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-100 transition"
            >
              📚 {post.exam_category}
            </button>
          )}
          {post.subject && post.subject !== post.exam_category && (
            <button
              onClick={() => onCategoryClick(post.subject)}
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
      {post.post_type === 'quiz_room' && post.quiz_details && (
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
                <span>{post.quiz_details.participants || 0}/{post.quiz_details.max_participants || 150} players</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.quiz_details.time_limit || 15} min</span>
              </div>
            </div>
            
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

      {/* Interaction Buttons - Compact Mobile-First Design */}
      <div className="flex items-center gap-1 mt-3 -mx-2">
        <button 
          onClick={() => onToggleComments(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            expandedComments.has(post.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <MessageCircle className={`w-4 h-4 ${expandedComments.has(post.id) ? 'fill-blue-100' : ''}`} />
          <span className="text-xs font-medium">{post.comments_count || 0}</span>
        </button>

        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            likedPosts.has(post.id) ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-4 h-4 transition-all ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{post.likes_count || 0}</span>
        </button>

        <button 
          onClick={() => onToggleShare(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            sharedPosts.has(post.id) ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          <Repeat2 className={`w-4 h-4 transition-all ${sharedPosts.has(post.id) ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{post.shares_count || 0}</span>
        </button>

        <button
          onClick={() => onToggleBookmark(post.id)}
          className={`p-1.5 rounded-full transition ml-auto ${
            bookmarkedPosts.has(post.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bookmark className={`w-4 h-4 transition-all ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
