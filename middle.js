                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    user={user}
                    postRefs={postRefs}
                    followingList={followingList}
                    likedPosts={likedPosts}
                    sharedPosts={sharedPosts}
                    bookmarkedPosts={bookmarkedPosts}
                    expandedComments={expandedComments}
                    openMenuId={openMenuId}
                    onOpenProfile={openProfile}
                    onToggleFollow={toggleFollow}
                    onToggleLike={toggleLike}
                    onToggleShare={toggleShare}
                    onToggleBookmark={toggleBookmark}
                    onToggleComments={toggleComments}
                    onOpenMenu={setOpenMenuId}
                    onDeletePost={handleDeleteClick}
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
                    handleJoinRoom={handleJoinRoom}
                  />
                  {expandedComments.has(post.id) && (
                    <CommentsSection
                        post={post}
                        currentUser={user}
                        comments={postComments[post.id] || []}
                        loading={loadingComments[post.id]}
                        onSubmitComment={submitComment}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        newComment={newComment}
                        setNewComment={setNewComment}
                    />
                  )}
                </div>
              ))
