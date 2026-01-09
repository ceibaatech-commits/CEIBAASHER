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
  const isOwnPost = user && post.user_id === user.id;
  const isFollowing = followingList.has(post.user_id);
  
  // Check if post has any tags or categories to display inline
  const hasTags = post.tags && post.tags.length > 0;
  const hasCategory = post.exam_category || post.subject;
  
  return (
    <div 
      ref={(el) => postRefs.current[post.id] = el}
      data-testid={`post-card-${post.id}`}
      className="bg-white border-b border-gray-100 hover:bg-gray-50/30 transition-colors"
    >
      {/* Repost Header */}
      {post.is_retweet && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-4 pt-3 pb-1">
          <Repeat2 className="w-3.5 h-3.5" />
          <span className="font-medium">{post.user_name || post.username} reposted</span>
        </div>
      )}

      <div className="px-4 py-4">
        {/* Modern Header Row - Avatar, User Info, Tags, Time, Actions all inline */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div 
            className="cursor-pointer flex-shrink-0"
            onClick={() => onOpenProfile(post.is_retweet ? post.original_user_id : post.user_id)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100 hover:ring-blue-200 transition-all">
              <UserAvatar
                profilePicture={post.is_retweet ? post.original_user_avatar : post.user_avatar}
                name={post.is_retweet ? (post.original_user_name || post.original_username) : (post.user_name || post.username)}
                size="md"
                clickable={false}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Username, badges, tags, timestamp - All inline with wrapping */}
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mb-0.5">
              {/* Username */}
              <span 
                className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer text-[15px] transition-colors"
                onClick={() => onOpenProfile(post.is_retweet ? post.original_user_id : post.user_id)}
                data-testid="post-username"
              >
                {post.is_retweet ? (post.original_user_name || post.original_username || 'Anonymous') : (post.user_name || post.username || 'Anonymous')}
              </span>
              
              {/* Verified Badge */}
              {post.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
              )}
              
              {/* Role Badges - Compact inline pills */}
              {post.isTeacher && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white">
                  Teacher
                </span>
              )}
              {post.isProfessor && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-600 text-white">
                  Professor
                </span>
              )}
              {post.isInstitute && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-600 text-white">
                  Institute
                </span>
              )}
              {post.isOfficial && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-white">
                  Official
                </span>
              )}
              
              {/* Separator dot */}
              <span className="text-gray-300 text-xs">·</span>
              
              {/* Timestamp */}
              <span className="text-gray-400 text-xs" data-testid="post-timestamp">
                {formatTimestamp(post.is_retweet ? post.original_created_at : post.created_at)}
              </span>
              
              {/* Inline Tags (first 2 only for header) */}
              {hasTags && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  {post.tags.slice(0, 2).map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => onTagClick(tag)}
                      className="text-blue-500 hover:text-blue-600 text-xs font-medium hover:underline"
                      data-testid={`post-tag-${idx}`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="text-gray-400 text-xs">+{post.tags.length - 2}</span>
                  )}
                </>
              )}
              
              {/* Inline Category (if present) */}
              {hasCategory && !hasTags && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-purple-500 text-xs font-medium">
                    {post.exam_category || post.subject}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Side Actions - Follow/Menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {user && post.user_id !== user.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(post.user_id);
                }}
                data-testid="follow-button"
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            
            {isOwnPost && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMenu(post.id);
                  }}
                  data-testid="post-menu-button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {openMenuId === post.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMenu(null);
                      }}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden min-w-[100px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePost(post);
                        }}
                        data-testid="delete-post-button"
                        className="w-full px-3 py-2 text-red-500 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="text-gray-800 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap pl-[52px]">
          <MathText text={post.content} />
        </div>

        {/* Additional Tags Row (if more than 2 tags) */}
        {hasTags && post.tags.length > 2 && (
          <div className="flex flex-wrap gap-1.5 mb-3 pl-[52px]">
            {post.tags.slice(2).map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick(tag)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Category/Subject Tags (show full if not in header) */}
        {hasCategory && hasTags && (
          <div className="flex flex-wrap gap-1.5 mb-3 pl-[52px]">
            {post.exam_category && (
              <button
                onClick={() => onCategoryClick(post.exam_category)}
                className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                📚 {post.exam_category}
              </button>
            )}
            {post.subject && post.subject !== post.exam_category && (
              <button
                onClick={() => onCategoryClick(post.subject)}
                className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors"
              >
                📖 {post.subject}
              </button>
            )}
          </div>
        )}

        {/* Question Post Indicator */}
        {post.post_type === 'question' && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-3 ml-[52px] flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-blue-700 font-medium">
              Academic Question · See answers in comments
            </span>
          </div>
        )}

        {/* Quiz Room Card - Clean Design */}
        {post.post_type === 'quiz_room' && post.quiz_details && (
          <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all mb-3 ml-[52px]">
            <div 
              className="h-16 flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${getGradientColor(post.quiz_details.category)} 0%, ${getGradientColor(post.quiz_details.category)}cc 100%)` }}
            >
              <Trophy className="w-8 h-8 text-white/90" />
            </div>
            <div className="p-3 bg-white">
              <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                {post.quiz_details.title || 'Quiz Room'}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{post.quiz_details.category}</p>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  <span>{post.quiz_details.questions_count || post.quiz_details.question_count || 5} Qs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{post.quiz_details.participants || 0}/{post.quiz_details.max_participants || 150}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{post.quiz_details.time_limit || 15}m</span>
                </div>
              </div>
              
              {post.quiz_details.access_control === 'followers' && (
                <div className="mb-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">Followers Only</span>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyColor(post.quiz_details.difficulty || 'Medium')}`}>
                  {post.quiz_details.difficulty || 'Medium'}
                </span>
                {(() => {
                  const isFollowersOnly = post.quiz_details.access_control === 'followers';
                  const isHostFollowed = followingList.has(post.quiz_details.host_id || post.user_id);
                  const isOwnRoom = user && post.user_id === user.id;
                  const canJoin = !isFollowersOnly || isHostFollowed || isOwnRoom;
                  
                  if (!canJoin) {
                    return (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>Follow to join</span>
                      </div>
                    );
                  }
                  
                  return (
                    <button 
                      onClick={() => handleJoinRoom(post.quiz_details.room_code)}
                      data-testid="join-quiz-room-button"
                      className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Join Room
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modern Interaction Bar */}
        <div className="flex items-center justify-between pl-[52px] pt-2 mt-1">
          <div className="flex items-center -ml-2">
            {/* Comments */}
            <button 
              onClick={() => onToggleComments(post.id)}
              data-testid="comments-button"
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 ${
                expandedComments.has(post.id) 
                  ? 'text-blue-600' 
                  : 'text-gray-400 hover:text-blue-500'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 group-hover:bg-blue-50 ${expandedComments.has(post.id) ? 'bg-blue-50' : ''}`}>
                <MessageCircle className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${expandedComments.has(post.id) ? 'fill-blue-100' : ''}`} />
              </div>
              <span className={`text-sm tabular-nums ${post.comments_count > 0 ? 'font-medium' : ''}`}>{post.comments_count || 0}</span>
            </button>

            {/* Likes */}
            <button
              onClick={() => onToggleLike(post.id)}
              data-testid="like-button"
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 ${
                likedPosts.has(post.id) 
                  ? 'text-rose-500' 
                  : 'text-gray-400 hover:text-rose-500'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 group-hover:bg-rose-50 ${likedPosts.has(post.id) ? 'bg-rose-50' : ''}`}>
                <Heart className={`w-[18px] h-[18px] transition-all duration-200 group-hover:scale-110 ${likedPosts.has(post.id) ? 'fill-current scale-110' : ''}`} />
              </div>
              <span className={`text-sm tabular-nums ${post.likes_count > 0 ? 'font-medium' : ''}`}>{post.likes_count || 0}</span>
            </button>

            {/* Repost */}
            <button 
              onClick={() => onToggleShare(post.id)}
              data-testid="share-button"
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 ${
                sharedPosts.has(post.id) 
                  ? 'text-emerald-500' 
                  : 'text-gray-400 hover:text-emerald-500'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-200 group-hover:bg-emerald-50 ${sharedPosts.has(post.id) ? 'bg-emerald-50' : ''}`}>
                <Repeat2 className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${sharedPosts.has(post.id) ? 'rotate-180' : ''}`} />
              </div>
              <span className={`text-sm tabular-nums ${post.shares_count > 0 ? 'font-medium' : ''}`}>{post.shares_count || 0}</span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(post.id)}
            data-testid="bookmark-button"
            className={`group p-2 rounded-full transition-all duration-200 ${
              bookmarkedPosts.has(post.id) 
                ? 'text-blue-500' 
                : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            <div className={`p-1 rounded-full transition-all duration-200 group-hover:bg-blue-50 ${bookmarkedPosts.has(post.id) ? 'bg-blue-50' : ''}`}>
              <Bookmark className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
