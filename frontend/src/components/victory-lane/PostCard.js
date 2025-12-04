import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Trophy, CheckCircle2, UserMinus, UserPlus } from 'lucide-react';
import QuizRoomCard from './QuizRoomCard';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

const PostCard = ({
  post,
  user,
  usersData,
  followingList,
  likedPosts,
  bookmarkedPosts,
  onOpenProfile,
  onToggleFollow,
  onToggleLike,
  onToggleBookmark,
  onJoinRoom
}) => {
  const postUser = usersData[post.user_id] || {};
  const isFollowing = followingList.has(post.user_id);
  const isOwnPost = user && user.id === post.user_id;

  const FollowButton = () => {
    if (isOwnPost) return null;
    
    if (isFollowing) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFollow(post.user_id); }}
          className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition flex items-center gap-1"
        >
          <span className="flex items-center gap-1">
            <UserMinus className="w-4 h-4" />
            <span>Unfollow</span>
          </span>
        </button>
      );
    }
    
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFollow(post.user_id); }}
        className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition flex items-center gap-1"
      >
        <UserPlus className="w-4 h-4" />
        <span>Follow</span>
      </button>
    );
  };

  return (
    <div className="bg-white p-4 hover:bg-gray-50 transition">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div 
          onClick={() => onOpenProfile(post.user_id)}
          className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-purple-100 transition-all"
        >
          {(postUser.username || post.username || 'U').charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* User Info with Follow Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                onClick={() => onOpenProfile(post.user_id)}
                className="font-bold text-gray-900 hover:underline cursor-pointer"
              >
                {postUser.username || post.username || 'User'}
              </span>
              {postUser.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
              <span className="text-gray-500 text-sm">@{post.username || 'user'}</span>
              <span className="text-gray-500 text-sm">· {formatTimestamp(post.created_at)}</span>
            </div>
            <FollowButton />
          </div>
          
          {/* Post Content */}
          <p className="text-gray-900 mt-1 mb-3 whitespace-pre-wrap">{post.content}</p>
          
          {/* Quiz Room Card */}
          {(post.post_type === 'quiz_room' || post.quiz_details) && post.quiz_details && (
            <QuizRoomCard
              quizDetails={post.quiz_details}
              postUserId={post.user_id}
              user={user}
              followingList={followingList}
              onJoinRoom={onJoinRoom}
            />
          )}

          {/* Battle Result Card */}
          {post.post_type === 'battle_victory' && post.battle_data && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-700">Battle Victory!</span>
              </div>
              <p className="text-gray-700">
                Won against {post.battle_data.opponent} with score {post.battle_data.score}
              </p>
            </div>
          )}

          {/* Quiz Result Card */}
          {post.post_type === 'quiz_result' && post.quiz_result && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">Quiz Completed!</span>
              </div>
              <p className="text-gray-700">
                Score: {post.quiz_result.score}/{post.quiz_result.total} ({post.quiz_result.percentage}%)
              </p>
            </div>
          )}

          {/* Interaction Buttons */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </button>

            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition group">
              <div className="p-2 rounded-full group-hover:bg-green-50 transition">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{post.shares_count || 0}</span>
            </button>

            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-2 transition group ${
                likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 transition">
                <Heart className={`w-5 h-5 transition-all ${likedPosts.has(post.id) ? 'fill-current scale-110' : ''}`} />
              </div>
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </button>

            <button
              onClick={() => onToggleBookmark(post.id)}
              className={`p-2 rounded-full transition ${
                bookmarkedPosts.has(post.id) 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
