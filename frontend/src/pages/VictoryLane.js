import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import Header from '../components/Header';
import DeletePostModal from '../components/DeletePostModal';
import QuestionPostModal from '../components/QuestionPostModal';
import AcademicQuestionModal from '../components/AcademicQuestionModal';
import { FeedSkeleton } from '../components/Skeleton';
import {
  PostCard,
  VictoryLaneHeader,
  CreatePostFAB,
  CommentsSection,
  PostComposer,
  QuizRoomModal,
  formatTimestamp,
  getGradientColor,
  getDifficultyColor,
  useVictoryLane,
  usePostCreation,
} from '../components/VictoryLane';

const VictoryLane = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const postRefs = useRef({});

  // UI-only state
  const [activeTab, setActiveTab] = useState('for-you');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Core hooks
  const feed = useVictoryLane(user, isAuthenticated, activeTab, searchQuery, selectedTag);
  const creation = usePostCreation(user, feed.fetchFeed);

  // Handle tag query parameter from URL
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
      setShowFilters(true);
      searchParams.delete('tag');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to post from notification link
  useEffect(() => {
    const postId = searchParams.get('post') || searchParams.get('postId');
    if (postId && feed.posts.length > 0) {
      setTimeout(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
          setTimeout(() => {
            postElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
            setSearchParams({});
          }, 2500);
        } else {
          setSearchParams({});
        }
      }, 300);
    }
  }, [feed.posts, searchParams, setSearchParams]);

  const openProfile = (usernameOrId) => {
    if (!usernameOrId) return;
    navigate(`/profile/${usernameOrId}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header isLoggedIn={!!user} user={user} onLogout={logout} />

      <div className="max-w-6xl mx-auto lg:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <section className="bg-white border-x-0 lg:border-x border-gray-200 min-h-screen">
            <VictoryLaneHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchExpanded={searchExpanded}
              setSearchExpanded={setSearchExpanded}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              allTags={feed.allTags}
              filteredPosts={feed.filteredPosts}
              posts={feed.posts}
              isConnected={feed.isConnected}
            />

            <div className="max-w-2xl mx-auto">
        {/* Guest CTA Banner */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white mx-3 sm:mx-4 mt-2 mb-2 rounded-xl p-3.5 text-center shadow-sm">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-90" />
            <h2 className="text-lg font-bold mb-1">Join Capazoo!</h2>
            <p className="mb-3 text-sm text-blue-50">Share your wins, create quiz rooms, and compete with others</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition text-sm shadow-sm"
              data-testid="victory-lane-login-btn"
            >
              Login to Participate
            </button>
          </div>
        )}

        {/* Desktop Post Composer */}
        <PostComposer
          user={user}
          newPostContent={creation.newPostContent}
          setNewPostContent={creation.setNewPostContent}
          mediaSettings={creation.mediaSettings}
          mediaFiles={creation.mediaFiles}
          removeMedia={creation.removeMedia}
          retryUpload={creation.retryUpload}
          handleImageSelect={creation.handleImageSelect}
          handleVideoSelect={creation.handleVideoSelect}
          isUploading={creation.isUploading}
          uploadAllMedia={creation.uploadAllMedia}
          getPostButtonState={creation.getPostButtonState}
          handleCreatePost={creation.handleCreatePost}
          setShowAcademicModal={creation.setShowAcademicModal}
          setShowQuizModal={creation.setShowQuizModal}
          setShowQuestionModal={creation.setShowQuestionModal}
        />

        {/* Feed */}
        {feed.loading ? (
          <FeedSkeleton count={5} />
        ) : (
          <div className="divide-y divide-gray-200">
            {feed.filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                {searchQuery || selectedTag ? (
                  <p>No posts match your search or filter. Try different keywords!</p>
                ) : (
                  <p>No posts yet. Be the first to share!</p>
                )}
              </div>
            ) : (
              feed.filteredPosts.map(post => (
                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    user={user}
                    postRefs={postRefs}
                    followingList={feed.followingList}
                    likedPosts={feed.likedPosts}
                    sharedPosts={feed.sharedPosts}
                    bookmarkedPosts={feed.bookmarkedPosts}
                    closeFriendIds={feed.closeFriendIds}
                    expandedComments={feed.expandedComments}
                    openMenuId={feed.openMenuId}
                    onOpenProfile={openProfile}
                    onToggleFollow={feed.toggleFollow}
                    onToggleLike={feed.toggleLike}
                    onToggleShare={feed.toggleShare}
                    onToggleBookmark={feed.toggleBookmark}
                    onShareLink={(postId) => {
                      const url = `${window.location.origin}/post/${postId}`;
                      if (navigator.share) navigator.share({ title: 'Check this post', url }).catch(() => {});
                      else if (navigator.clipboard) navigator.clipboard.writeText(url);
                    }}
                    onToggleComments={feed.toggleComments}
                    onOpenMenu={feed.setOpenMenuId}
                    onDeletePost={feed.handleDeleteClick}
                    onPostClick={(postId) => navigate(`/post/${postId}`)}
                    onTagClick={(tag) => {
                      setSelectedTag(selectedTag === tag ? null : tag);
                      setShowFilters(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onCategoryClick={(category) => {
                      setSearchQuery(category);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    formatTimestamp={formatTimestamp}
                    getGradientColor={getGradientColor}
                    getDifficultyColor={getDifficultyColor}
                    handleJoinRoom={feed.handleJoinRoom}
                  />
                  {feed.expandedComments.has(post.id) && (
                    <CommentsSection
                      post={post}
                      user={user}
                      isAuthenticated={isAuthenticated}
                      postComments={feed.postComments}
                      loadingComments={feed.loadingComments}
                      submitComment={feed.submitComment}
                      replyingTo={feed.replyingTo}
                      setReplyingTo={feed.setReplyingTo}
                      replyContent={feed.replyContent}
                      setReplyContent={feed.setReplyContent}
                      newComment={feed.newComment}
                      setNewComment={feed.setNewComment}
                      openProfile={openProfile}
                      formatTimestamp={formatTimestamp}
                    />
                  )}
                </div>
              ))
            )}

            {/* Infinite Scroll Loader */}
            {!feed.loading && feed.filteredPosts.length > 0 && (
              <div ref={feed.observerTarget} className="py-4">
                {feed.loadingMore ? (
                  <FeedSkeleton count={2} />
                ) : feed.hasMore ? (
                  <div className="text-center text-sm text-gray-400 py-4">Scroll to load more</div>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-4">{"You've reached the end"}</div>
                )}
              </div>
            )}
          </div>
        )}

            </div>
          </section>

          {/* Desktop Right Rail */}
          <aside className="hidden lg:block pt-0">
            <div className="sticky top-[72px] space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Search Capazoo</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, users, tags"
                  className="w-full rounded-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Trending Topics</h3>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {feed.allTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                        setShowFilters(true);
                        setActiveTab('trending');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        selectedTag === tag
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {(searchQuery || selectedTag) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <h3 className="text-sm font-bold text-gray-900">Active Filters</h3>
                  <p className="text-xs text-gray-600 mt-1">{feed.filteredPosts.length} posts matched</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <QuizRoomModal
        isOpen={creation.showQuizModal}
        onClose={() => creation.setShowQuizModal(false)}
        user={user}
        onSuccess={() => feed.fetchFeed()}
      />

      <DeletePostModal
        isOpen={feed.showDeleteModal}
        onClose={() => {
          feed.setShowDeleteModal(false);
        }}
        onConfirm={feed.handleDeleteConfirm}
        postType={feed.postToDelete?.post_type}
        loading={feed.deletingPost}
      />

      <QuestionPostModal
        isOpen={creation.showQuestionModal}
        onClose={() => creation.setShowQuestionModal(false)}
        onSubmit={creation.handleCreateQuestion}
        user={user}
      />

      <AcademicQuestionModal
        isOpen={creation.showAcademicModal}
        onClose={() => creation.setShowAcademicModal(false)}
        onSubmit={creation.handleCreateAcademicQuestion}
        user={user}
      />

      {/* Mobile FAB */}
      <CreatePostFAB
        user={user}
        showCreateMenu={creation.showCreateMenu}
        setShowCreateMenu={creation.setShowCreateMenu}
        showQuickPostModal={creation.showQuickPostModal}
        setShowQuickPostModal={creation.setShowQuickPostModal}
        newPostContent={creation.newPostContent}
        setNewPostContent={creation.setNewPostContent}
        handleCreatePost={creation.handleCreatePost}
        setShowQuizModal={creation.setShowQuizModal}
        setShowQuestionModal={creation.setShowQuestionModal}
        setShowAcademicModal={creation.setShowAcademicModal}
        mediaSettings={creation.mediaSettings}
        mediaFiles={creation.mediaFiles}
        removeMedia={creation.removeMedia}
        retryUpload={creation.retryUpload}
        handleImageSelect={creation.handleImageSelect}
        handleVideoSelect={creation.handleVideoSelect}
        isUploading={creation.isUploading}
        uploadAllMedia={creation.uploadAllMedia}
        getPostButtonState={creation.getPostButtonState}
        clearMedia={creation.clearMedia}
      />
    </div>
  );
};

export default VictoryLane;
