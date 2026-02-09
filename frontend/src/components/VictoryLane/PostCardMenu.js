import React from 'react';
import { MoreHorizontal, Link2, Users, Trash2 } from 'lucide-react';

const PostCardMenu = ({ post, isOwnPost, isFollowing, displayUserId, displayUsername, openMenuId, onOpenMenu, onToggleFollow, onDeletePost }) => {
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onOpenMenu(post.id); }}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors -mr-2"
        data-testid={`post-menu-${post.id}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {openMenuId === post.id && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => { e.stopPropagation(); onOpenMenu(null); }}
          />
          <div
            className="absolute right-full top-0 mr-1 min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
            style={{ boxShadow: 'rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                onOpenMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Link2 className="w-[18px] h-[18px]" />
              <span>Copy link</span>
            </button>

            {!isOwnPost && !isFollowing && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFollow(displayUserId); onOpenMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="w-[18px] h-[18px]" />
                <span>Follow @{displayUsername}</span>
              </button>
            )}
            {!isOwnPost && isFollowing && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFollow(displayUserId); onOpenMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="w-[18px] h-[18px]" />
                <span>Unfollow @{displayUsername}</span>
              </button>
            )}

            {isOwnPost && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeletePost(post); onOpenMenu(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-[18px] h-[18px]" />
                <span>Delete post</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PostCardMenu;
