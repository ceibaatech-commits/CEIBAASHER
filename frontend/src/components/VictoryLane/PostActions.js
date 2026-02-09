import React from 'react';
import { Heart, MessageCircle, Repeat2 } from 'lucide-react';

const PostActions = ({ postId, commentCount, shareCount, likesCount, viewsCount, isLiked, isShared, onToggleComments, onToggleShare, onToggleLike }) => {
  return (
    <div className="flex items-center justify-between mt-3 -ml-2 max-w-[425px]">
      {/* Comments */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComments(postId); }}
        className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors group"
        data-testid={`comment-btn-${postId}`}
      >
        <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
        <span className="text-[13px] font-medium">{commentCount}</span>
      </button>

      {/* Repost */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleShare(postId); }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
          isShared ? 'text-green-500' : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
        }`}
        data-testid={`repost-btn-${postId}`}
      >
        <Repeat2 className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isShared ? 'stroke-[2.5px]' : ''}`} />
        <span className="text-[13px] font-medium">{shareCount}</span>
      </button>

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLike(postId); }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors group ${
          isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500 hover:bg-rose-50'
        }`}
        data-testid={`like-btn-${postId}`}
      >
        <Heart className={`w-[18px] h-[18px] group-hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-[13px] font-medium">{likesCount}</span>
      </button>

      {/* Views */}
      <div className="flex items-center gap-1.5 px-3 py-2 text-gray-500">
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
        </svg>
        <span className="text-[13px] font-medium">{viewsCount}</span>
      </div>
    </div>
  );
};

export default PostActions;
