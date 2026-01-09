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
  
  return (
    <div 
      ref={(el) => postRefs.current[post.id] = el}
      className="bg-white border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
    >
      {/* Repost Header */}
      {post.is_retweet && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-4 pt-3 pb-1">
          <Repeat2 className="w-3.5 h-3.5" />
          <span className="font-medium">{post.user_name || post.username} reposted</span>
        </div>
      )}

      <div className="px-4 py-3">
        {/* Modern Post Header - All in one row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar with gradient ring */}
          <div 
            className="relative cursor-pointer flex-shrink-0"
            onClick={() => onOpenProfile(post.is_retweet ? post.original_user_id : post.user_id)}
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <UserAvatar
                  profilePicture={post.is_retweet ? post.original_user_avatar : post.user_avatar}
                  name={post.is_retweet ? (post.original_user_name || post.original_username) : (post.user_name || post.username)}
                  size="md"
                  clickable={false}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* User Info - Name, badges, date in one row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              {/* Username */}
              <span 
                className="font-bold text-gray-900 hover:underline cursor-pointer text-sm"
                onClick={() => onOpenProfile(post.is_retweet ? post.original_user_id : post.user_id)}
              >
                {post.is_retweet ? (post.original_user_name || post.original_username || 'Anonymous') : (post.user_name || post.username || 'Anonymous')}
              </span>
              
              {/* Verified Badge */}
              {post.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
              )}
              
              {/* Role Badges */}
              {post.isTeacher && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  Teacher
                </span>
              )}
              {post.isProfessor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  Professor
                </span>
              )}
              {post.isInstitute && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-rose-600 to-red-600 text-white">
                  Institute
                </span>
              )}
              {post.isOfficial && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-white">
                  Official
                </span>
              )}
              
              {/* Timestamp */}
              <span className="text-gray-400 text-xs">
                · {formatTimestamp(post.is_retweet ? post.original_created_at : post.created_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons - Follow/Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && post.user_id !== user.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(post.user_id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
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
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
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
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden min-w-[120px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePost(post);
                        }}
                        className="w-full px-4 py-2.5 text-red-500 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="text-gray-800 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
          <MathText text={post.content} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 5).map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
            {post.tags.length > 5 && (
              <span className="text-xs text-gray-400 py-1 px-1">+{post.tags.length - 5}</span>
            )}
          </div>
        )}

        {/* Category/Subject Tags */}
        {(post.exam_category || post.subject) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.exam_category && (
              <button
                onClick={() => onCategoryClick(post.exam_category)}
                className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                📚 {post.exam_category}
              </button>
            )}
            {post.subject && post.subject !== post.exam_category && (
              <button
                onClick={() => onCategoryClick(post.subject)}
                className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors"
              >
                📖 {post.subject}
              </button>
            )}
          </div>
        )}

        {/* Question Post Indicator */}
        {post.post_type === 'question' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-blue-700 font-medium">
              Academic Question - See answers in comments
            </span>
          </div>
        )}

        {/* Quiz Room Card - Modern Design */}
        {post.post_type === 'quiz_room' && post.quiz_details && (
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all mb-3">
            <div 
              className="h-24 flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${getGradientColor(post.quiz_details.category)} 0%, ${getGradientColor(post.quiz_details.category)}bb 100%)` }}
            >
              <div className="absolute inset-0 bg-black/10"></div>
              <Trophy className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="p-4 bg-white">
              <h3 className="font-bold text-base text-gray-900 mb-1">
                {post.quiz_details.title || 'Quiz Room'}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{post.quiz_details.category}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5" />
                  <span>{post.quiz_details.questions_count || post.quiz_details.question_count || 5} Qs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{post.quiz_details.participants || 0}/{post.quiz_details.max_participants || 150}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.quiz_details.time_limit || 15} min</span>
                </div>
              </div>
              
              {post.quiz_details.access_control === 'followers' && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full w-fit">
                  <Users className="w-3 h-3" />
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
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Follow to join</span>
                      </div>
                    );
                  }
                  
                  return (
                    <button 
                      onClick={() => handleJoinRoom(post.quiz_details.room_code)}
                      className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
                    >
                      Join Room
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modern Interaction Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {/* Comments */}
            <button 
              onClick={() => onToggleComments(post.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                expandedComments.has(post.id) 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <MessageCircle className={`w-[18px] h-[18px] ${expandedComments.has(post.id) ? 'fill-blue-100' : ''}`} />
              <span className="text-xs font-semibold">{post.comments_count || 0}</span>
            </button>

            {/* Likes */}
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                likedPosts.has(post.id) 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] transition-transform ${likedPosts.has(post.id) ? 'fill-current scale-110' : ''}`} />
              <span className="text-xs font-semibold">{post.likes_count || 0}</span>
            </button>

            {/* Repost */}
            <button 
              onClick={() => onToggleShare(post.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                sharedPosts.has(post.id) 
                  ? 'text-green-500 bg-green-50' 
                  : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
              }`}
            >
              <Repeat2 className={`w-[18px] h-[18px] ${sharedPosts.has(post.id) ? 'text-green-500' : ''}`} />
              <span className="text-xs font-semibold">{post.shares_count || 0}</span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(post.id)}
            className={`p-2 rounded-full transition-all ${
              bookmarkedPosts.has(post.id) 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Bookmark className={`w-[18px] h-[18px] ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
