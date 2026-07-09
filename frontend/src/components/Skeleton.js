import React from 'react';

// Post Card Skeleton - Mimics PostCard structure
export const PostCardSkeleton = () => (
  <div className="border-b border-gray-200 bg-white animate-pulse">
    <div className="flex gap-3 px-4 py-3">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
        
        {/* Content lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-4 w-4/6 bg-gray-100 rounded" />
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-6 pt-2">
          <div className="h-4 w-12 bg-gray-100 rounded" />
          <div className="h-4 w-12 bg-gray-100 rounded" />
          <div className="h-4 w-12 bg-gray-100 rounded" />
          <div className="h-4 w-12 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  </div>
);

// Quiz Room Card Skeleton
export const QuizRoomSkeleton = () => (
  <div className="border-b border-gray-200 bg-white animate-pulse">
    <div className="flex gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-14 bg-gray-100 rounded" />
        </div>
        
        {/* Quiz card skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-200/50" />
          </div>
          <div className="h-16 bg-white/50 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-white rounded-full" />
            <div className="h-6 w-16 bg-white rounded-full" />
          </div>
          <div className="h-10 bg-amber-200/50 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// Feed Skeleton - Multiple post skeletons
export const FeedSkeleton = ({ count = 5 }) => (
  <div className="divide-y divide-gray-200">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

// Profile Card Skeleton
export const ProfileSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-6">
        <div className="h-4 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

// Comment Skeleton
export const CommentSkeleton = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-2 w-12 bg-gray-100 rounded" />
      </div>
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-4/5 bg-gray-100 rounded" />
    </div>
  </div>
);

// Generic skeleton shapes
export const Skeleton = {
  Circle: ({ size = 'md', className = '' }) => {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
    };
    return <div className={`rounded-full bg-gray-200 animate-pulse ${sizes[size]} ${className}`} />;
  },
  
  Text: ({ width = 'full', className = '' }) => (
    <div className={`h-4 bg-gray-200 rounded animate-pulse w-${width} ${className}`} />
  ),
  
  Box: ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  ),
};

export default FeedSkeleton;
