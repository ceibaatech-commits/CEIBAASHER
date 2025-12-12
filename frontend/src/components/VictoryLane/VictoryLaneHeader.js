import React from 'react';
import { Sparkles, TrendingUp, Search, Filter, X, Tag, Wifi, WifiOff } from 'lucide-react';

const VictoryLaneHeader = ({
  activeTab,
  setActiveTab,
  searchExpanded,
  setSearchExpanded,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedTag,
  setSelectedTag,
  allTags,
  filteredPosts,
  posts,
  isConnected
}) => {
  return (
    <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto">
        {/* Header Title Row */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Victory Lane</h1>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="font-medium">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        {/* Tabs & Search/Filter Row - Single Compact Line */}
        {!searchExpanded ? (
          <div className="flex items-center border-t border-gray-100">
            {/* Tabs */}
            {[
              { id: 'for-you', label: 'For You', icon: Sparkles },
              { id: 'trending', label: 'Trending', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            
            {/* Search Icon Button */}
            <button
              onClick={() => setSearchExpanded(true)}
              className="flex items-center justify-center gap-1.5 px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Search</span>
            </button>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center px-4 py-3 border-b-2 border-transparent transition-colors ${
                showFilters || selectedTag ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Expanded Search Bar */
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                setSearchExpanded(false);
                setSearchQuery('');
              }}
              className="p-2 text-gray-600 hover:text-gray-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, users, topics..."
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition ${
                showFilters || selectedTag ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Popular Tags - Shown when filters are open */}
        {showFilters && allTags.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-b from-blue-50/50 to-white border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Popular Topics</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Indicator */}
        {(searchQuery || selectedTag) && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2 text-xs">
            <span className="text-gray-700 font-medium">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-1 px-2 py-0.5 bg-white text-blue-700 rounded-full hover:bg-blue-100 border border-blue-200 transition"
              >
                <span className="font-medium">{selectedTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VictoryLaneHeader;
