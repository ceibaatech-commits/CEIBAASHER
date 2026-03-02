import React, { useMemo, useState } from 'react';
import { Repeat2, Trophy, GraduationCap, BookOpen } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import MathText from '../MathText';
import PostCardMenu from './PostCardMenu';
import PostActions from './PostActions';
import QuizRoomCard from './QuizRoomCard';

const WORD_LIMIT = 100;

const PostCard = ({
  post, user, postRefs, followingList, likedPosts, sharedPosts,
  expandedComments, openMenuId, onOpenProfile, onToggleFollow,
  onToggleLike, onToggleShare, onToggleComments, onOpenMenu,
  onDeletePost, onTagClick, onCategoryClick, onPostClick,
  formatTimestamp, getGradientColor, getDifficultyColor, handleJoinRoom,
  bookmarkedPosts
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwnPost = user && post.user_id === user.id;
  const isFollowing = followingList.has(post.user_id);
  const isLiked = likedPosts.has(post.id);
  const isShared = sharedPosts.has(post.is_retweet ? post.original_post_id : post.id);

  const likesCount = post.likes_count || post.like_count || 0;
  const shareCount = post.share_count || post.shares_count || 0;
  const commentCount = post.comment_count || post.comments_count || 0;
  const viewsCount = post.views || 0;

  const contentWords = (post.content || '').split(/\s+/).filter(w => w.length > 0);
  const isLongContent = contentWords.length > WORD_LIMIT;
  const truncatedContent = isLongContent && !isExpanded
    ? contentWords.slice(0, WORD_LIMIT).join(' ') + '...'
    : post.content;

  const displayName = post.is_retweet ? (post.original_user_name || post.original_username) : (post.user_name || post.username);
  const displayUsername = post.is_retweet ? post.original_username : post.username;
  const displayAvatar = post.is_retweet ? post.original_user_avatar : post.user_avatar;
  const displayUserId = post.is_retweet ? post.original_user_id : post.user_id;

  const quizRoom = useMemo(() => {
    if (post.post_type !== 'quiz_room') return null;
    const roomData = post.quiz_room || post.quiz_details || {};
    const roomCode = roomData.room_code || post.room_code || roomData.roomCode;
    if (!roomCode) return null;
    return {
      room_code: roomCode,
      title: roomData.title || post.content?.split('\n')[0] || 'Quiz Room',
      category: roomData.category || roomData.exam_category || 'General',
      status: roomData.status || 'waiting',
      participants: roomData.participants || roomData.participant_count || 0,
      max_participants: roomData.max_participants || 10,
      num_questions: roomData.num_questions || roomData.questions?.length || roomData.total_questions || '?',
      time_limit: roomData.time_limit || 15,
      privacy: roomData.privacy || 'public',
      difficulty: roomData.difficulty || 'Medium',
      subject: roomData.subject,
    };
  }, [post]);

  const getPostTypeBadge = () => {
    if (post.post_type === 'academic_question') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <GraduationCap className="w-3 h-3" />Academic
        </span>
      );
    }
    if (post.post_type === 'question') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
          <BookOpen className="w-3 h-3" />Question
        </span>
      );
    }
    if (post.post_type === 'quiz_room') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <Trophy className="w-3 h-3" />Quiz Room
        </span>
      );
    }
    return null;
  };

  const handleContentClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    if (onPostClick) onPostClick(post.id);
  };

  return (
    <article
      ref={(el) => { if (postRefs?.current && el) postRefs.current[post.id] = el; }}
      data-testid={`post-card-${post.id}`}
      data-post-id={post.id}
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
            <UserAvatar profilePicture={displayAvatar} name={displayName} size="md" clickable={false} className="w-full h-full" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                className="font-bold text-[15px] text-gray-900 hover:underline truncate cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onOpenProfile(displayUserId); }}
              >
                {displayName}
              </span>

              {post.is_verified === true && (
                <svg viewBox="0 0 22 22" className="w-4 h-4 flex-shrink-0">
                  <path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/>
                </svg>
              )}

              {post.isTeacher === true && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">Teacher</span>}
              {post.isProfessor === true && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded">Professor</span>}
              {post.isInstitute === true && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">Institute</span>}
              {post.isOfficial === true && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-800 text-white rounded">Official</span>}

              <span className="text-gray-500 text-[15px]">@{displayUsername}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-[15px] hover:underline">{formatTimestamp(post.created_at)}</span>
            </div>

            <PostCardMenu
              post={post}
              isOwnPost={isOwnPost}
              isFollowing={isFollowing}
              displayUserId={displayUserId}
              displayUsername={displayUsername}
              openMenuId={openMenuId}
              onOpenMenu={onOpenMenu}
              onToggleFollow={onToggleFollow}
              onDeletePost={onDeletePost}
            />
          </div>

          {/* Post type badge */}
          {getPostTypeBadge() && <div className="mb-2">{getPostTypeBadge()}</div>}

          {/* Content with See more */}
          <div className="text-[15px] text-gray-900 leading-normal whitespace-pre-wrap break-words mb-3">
            <MathText
              text={truncatedContent}
              onHashtagClick={(tag) => onTagClick && onTagClick(tag)}
              onMentionClick={(username) => onOpenProfile && onOpenProfile(username)}
            />
            {isLongContent && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-blue-500 hover:text-blue-600 font-medium ml-1 transition-colors"
              >
                {isExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>

          {/* Academic question details */}
          {post.post_type === 'academic_question' && (post.exam_category || post.subject || post.topic) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.exam_category && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCategoryClick && onCategoryClick(post.exam_category); }}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                >{post.exam_category}</button>
              )}
              {post.subject && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{post.subject}</span>}
              {post.topic && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{post.topic}</span>}
            </div>
          )}

          {/* Media - Optimized aspect ratios */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              {post.media_urls[0].includes('.mp4') || post.media_urls[0].includes('.webm') || post.media_urls[0].includes('/video/') ? (
                /* Video Player - 16:9 aspect ratio for professional look */
                <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
                  <video 
                    src={post.media_urls[0]} 
                    controls 
                    preload="metadata"
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain" 
                    onClick={(e) => e.stopPropagation()}
                    controlsList="nodownload"
                    onError={(e) => {
                      console.warn('Video playback error:', e);
                    }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              ) : (
                /* Image - Responsive with max 4:5 aspect ratio (engagement friendly) */
                <div className="relative w-full" style={{ maxHeight: '600px' }}>
                  <img 
                    src={post.media_urls[0]} 
                    alt="" 
                    className="w-full h-auto object-cover"
                    style={{ 
                      maxHeight: '600px',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}

          {/* Quiz Room Card */}
          {post.post_type === 'quiz_room' && (
            <QuizRoomCard quizRoom={quizRoom} getDifficultyColor={getDifficultyColor} handleJoinRoom={handleJoinRoom} />
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }} className="text-blue-500 hover:underline text-[15px]">
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <PostActions
            postId={post.id}
            commentCount={commentCount}
            shareCount={shareCount}
            likesCount={likesCount}
            viewsCount={viewsCount}
            isLiked={isLiked}
            isShared={isShared}
            onToggleComments={onToggleComments}
            onToggleShare={onToggleShare}
            onToggleLike={onToggleLike}
          />
        </div>
      </div>
    </article>
  );
};

export default PostCard;
