import React from 'react';
import { Heart, MessageCircle, Repeat2, Share2, Bookmark } from 'lucide-react';

const PostActions = ({
  postId, commentCount, shareCount, likesCount, viewsCount,
  isLiked, isShared, isBookmarked,
  onToggleComments, onToggleShare, onToggleLike, onToggleBookmark, onShareLink
}) => {
  return (
    <div className="flex items-center justify-between mt-3 -ml-2">
      {/* Comments */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComments?.(postId); }}
        className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors group"
        data-testid={`comment-btn-${postId}`}
      >
        <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
        <span className="text-[13px] font-medium">{commentCount || 0}</span>
      </button>

      {/* Repost */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleShare?.(postId); }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
          isShared ? 'text-green-500' : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
        }`}
        data-testid={`repost-btn-${postId}`}
      >
        <Repeat2 className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isShared ? 'stroke-[2.5px]' : ''}`} />
        <span className="text-[13px] font-medium">{shareCount || 0}</span>
      </button>

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLike?.(postId); }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
          isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500 hover:bg-rose-50'
        }`}
        data-testid={`like-btn-${postId}`}
      >
        <Heart className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-[13px] font-medium">{likesCount || 0}</span>
      </button>

      {/* Share link */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onShareLink) { onShareLink(postId); }
          else {
            const url = `${window.location.origin}/post/${postId}`;
            if (navigator.share) navigator.share({ title: 'Check this post', url }).catch(() => {});
            else if (navigator.clipboard) navigator.clipboard.writeText(url);
          }
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors group"
        data-testid={`share-btn-${postId}`}
      >
        <Share2 className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
      </button>

      {/* Bookmark */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(postId); }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
          isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
        }`}
        data-testid={`bookmark-btn-${postId}`}
      >
        <Bookmark className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};

export default PostActions;
