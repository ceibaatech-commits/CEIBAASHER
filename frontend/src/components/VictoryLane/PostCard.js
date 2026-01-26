import React from 'react';
import { 
  Heart, MessageCircle, Repeat2, MoreHorizontal,
  Trash2, Trophy, Play, Users, Clock, GraduationCap, BookOpen, Link2, Share
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
  expandedComments,
  openMenuId,
  onOpenProfile,
  onToggleFollow,
  onToggleLike,
  onToggleShare,
  onToggleComments,
  onOpenMenu,
  onDeletePost,
  onTagClick,
  onCategoryClick,
  onPostClick,
  formatTimestamp,
  getGradientColor,
  getDifficultyColor,
  handleJoinRoom
}) => {
  const isOwnPost = user && post.user_id === user.id;
  const isFollowing = followingList.has(post.user_id);
  const isLiked = likedPosts.has(post.id);
  const isShared = sharedPosts.has(post.is_retweet ? post.original_post_id : post.id);
  
  // Get display info
  const displayName = post.is_retweet ? (post.original_user_name || post.original_username) : (post.user_name || post.username);
  const displayUsername = post.is_retweet ? post.original_username : post.username;
  const displayAvatar = post.is_retweet ? post.original_user_avatar : post.user_avatar;
  const displayUserId = post.is_retweet ? post.original_user_id : post.user_id;

  // Get post type badge
  const getPostTypeBadge = () => {
    if (post.post_type === 'academic_question') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <GraduationCap className="w-3 h-3" />
          Academic
        </span>
      );
    }
    if (post.post_type === 'question') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
          <BookOpen className="w-3 h-3" />
          Question
        </span>
      );
    }
    if (post.post_type === 'quiz_room') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <Trophy className="w-3 h-3" />
          Quiz Room
        </span>
      );
    }
    return null;
  };

  // Handle post content click
  const handleContentClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a')) return;
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  return (
    <article 
      ref={(el) => postRefs.current[post.id] = el}
      data-testid={`post-card-${post.id}`}
      className="border-b border-gray-200 bg-white hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
      onClick={handleContentClick}
    >
      {/* Repost indicator */}
      {post.is_retweet && (
        <div className="flex items-center gap-2 text-gray-500 text-[13px] px-4 pt-3 pl-14">
          <Repeat2 className="w-4 h-4" />
          <span className="font-medium hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenProfile(post.user_id); }}>
            {post.user_name || post.username} reposted
          </span>
        </div>
      )}

      <div className="flex gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div 
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onOpenProfile(displayUserId); }}
          >
            <UserAvatar
              profilePicture={displayAvatar}
              name={displayName}
              size="md"
              clickable={false}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, username, time, menu */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span 
                className="font-bold text-[15px] text-gray-900 hover:underline truncate cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onOpenProfile(displayUserId); }}
              >
                {displayName}
              </span>
              
              {/* Verified badge - only show checkmark for verified accounts */}
              {post.is_verified === true && (
                <svg viewBox="0 0 22 22" className="w-4 h-4 flex-shrink-0">
                  <path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/>
                </svg>
              )}
              
              {/* Role badges - compact text badges */}
              {post.isTeacher === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">Teacher</span>
              )}
              {post.isProfessor === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded">Professor</span>
              )}
              {post.isInstitute === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">Institute</span>
              )}
              {post.isOfficial === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-800 text-white rounded">Official</span>
              )}
              
              <span className="text-gray-500 text-[15px]">@{displayUsername}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-[15px] hover:underline">{formatTimestamp(post.created_at)}</span>
            </div>

            {/* More menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenMenu(post.id); }}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors -mr-2"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {openMenuId === post.id && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); onOpenMenu(null); }}
                  />
                  {/* Menu - positioned to open LEFT on mobile to avoid cutoff */}
                  <div className="absolute right-full mr-2 sm:right-0 sm:mr-0 sm:left-auto top-0 sm:top-full sm:mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {/* Copy Link - always available */}
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                        onOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Link2 className="w-5 h-5" />
                      <span className="font-medium">Copy link</span>
                    </button>
                    
                    {/* Follow/Unfollow - for other users' posts */}
                    {!isOwnPost && user && !isFollowing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFollow(displayUserId); onOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Follow @{displayUsername?.slice(0, 12)}</span>
                      </button>
                    )}
                    {!isOwnPost && user && isFollowing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFollow(displayUserId); onOpenMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Unfollow</span>
                      </button>
                    )}
                    
                    {/* Delete - only for own posts */}
                    {isOwnPost && (
                      <>
                        <div className="my-1 border-t border-gray-100"></div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeletePost(post); onOpenMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="font-medium">Delete post</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Post type badge */}
          {getPostTypeBadge() && (
            <div className="mb-2">
              {getPostTypeBadge()}
            </div>
          )}

          {/* Post content */}
          <div className="text-[15px] text-gray-900 leading-normal whitespace-pre-wrap break-words mb-3">
            <MathText text={post.content} />
          </div>

          {/* Academic question details */}
          {post.post_type === 'academic_question' && (post.exam_category || post.subject || post.topic) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.exam_category && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCategoryClick && onCategoryClick(post.exam_category); }}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  {post.exam_category}
                </button>
              )}
              {post.subject && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {post.subject}
                </span>
              )}
              {post.topic && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {post.topic}
                </span>
              )}
            </div>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              {post.media_urls[0].includes('.mp4') || post.media_urls[0].includes('.webm') ? (
                <video 
                  src={post.media_urls[0]} 
                  controls 
                  className="w-full max-h-[512px] object-contain bg-black"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img 
                  src={post.media_urls[0]} 
                  alt="" 
                  className="w-full max-h-[512px] object-cover"
                />
              )}
            </div>
          )}

          {/* Quiz Room Card */}
          {post.post_type === 'quiz_room' && post.quiz_room && (
            <div 
              className="mt-3 rounded-2xl border border-gray-200 overflow-hidden hover:bg-gray-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{post.quiz_room.title}</h3>
                    <p className="text-gray-500 text-sm">{post.quiz_room.category}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {post.quiz_room.participants || 0}/{post.quiz_room.max_participants || 10}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {post.quiz_room.time_limit || 15}s/Q
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(post.quiz_room.difficulty)}`}>
                    {post.quiz_room.difficulty || 'Medium'}
                  </span>
                </div>
                {post.quiz_room.status === 'waiting' && (
                  <button
                    onClick={() => handleJoinRoom(post.quiz_room.room_code)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Join Quiz Room
                  </button>
                )}
                {post.quiz_room.status !== 'waiting' && (
                  <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-xl font-medium text-center">
                    {post.quiz_room.status === 'active' ? 'In Progress' : 'Ended'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
                  className="text-blue-500 hover:underline text-[15px]"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons - Twitter style */}
          <div className="flex items-center justify-between mt-3 -ml-2 max-w-[425px]">
            {/* Comments */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleComments(post.id); }}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors group"
            >
              <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium">{post.comment_count || 0}</span>
            </button>

            {/* Repost */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleShare(post.id); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
                isShared 
                  ? 'text-green-500' 
                  : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
              }`}
            >
              <Repeat2 className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isShared ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[13px] font-medium">{post.share_count || 0}</span>
            </button>

            {/* Like */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
                isLiked 
                  ? 'text-rose-500' 
                  : 'text-gray-500 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-[13px] font-medium">{post.like_count || 0}</span>
            </button>

            {/* Views */}
            <div className="flex items-center gap-1.5 px-3 py-2 text-gray-500">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
              </svg>
              <span className="text-[13px] font-medium">{post.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
