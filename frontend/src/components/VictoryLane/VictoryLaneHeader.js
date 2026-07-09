import React, { useEffect, useState } from 'react';
import { Search, Hash, X, Tag, Wifi, WifiOff } from 'lucide-react';
import { getTrendingEmojiForHour } from './utils/trendingEmoji';
import useHourlyTick from '../../hooks/useHourlyTick';

const DESKTOP_QUERY = '(min-width: 1024px)';

const useIsDesktop = () => {
  const getInitial = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(DESKTOP_QUERY).matches;
  };

  const [isDesktop, setIsDesktop] = useState(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return isDesktop;
};

const TABS = [
  { id: 'for-you', label: 'For You', emoji: '🍿' },
  { id: 'trending', label: 'Trending', emoji: null },
];

const ConnectionPill = ({ isConnected }) => (
  <div
    className={`flex items-center gap-1 text-[10px] md:text-[11px] px-2 py-1 rounded-full border ${
      isConnected
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}
  >
    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    <span className="font-medium">{isConnected ? 'Live' : 'Offline'}</span>
  </div>
);

const TabsRow = ({ activeTab, setActiveTab, setSearchExpanded, showFilters, setShowFilters, selectedTag, trendingEmoji }) => (
  <div className="flex items-center border-t border-gray-100">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex-1 flex items-center justify-center gap-1 py-2 text-[12px] md:text-[13px] font-semibold border-b-2 transition-colors ${
          activeTab === tab.id
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="text-[14px] leading-none">{tab.emoji ?? trendingEmoji}</span>
        <span>{tab.label}</span>
      </button>
    ))}

    {/* Search Icon Button - Mobile only (hidden on desktop which has right-sidebar search) */}
    <div className="lg:hidden">
      <button
        onClick={() => setSearchExpanded(true)}
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-[12px] md:text-[13px] font-semibold text-gray-500 border-b-2 border-transparent hover:text-blue-600 hover:bg-gray-50 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-[12px]">Search</span>
      </button>
    </div>

    {/* Filter Button */}
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`flex items-center justify-center px-2.5 md:px-3 py-2 border-b-2 border-transparent transition-colors ${
        showFilters || selectedTag
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Hash className="w-3 h-3 md:w-3.5 md:h-3.5" />
    </button>
  </div>
);

const MobileSearchRow = ({ setSearchExpanded, searchQuery, setSearchQuery, showFilters, setShowFilters, selectedTag }) => (
  <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-white">
    <button
      onClick={() => {
        setSearchExpanded(false);
      }}
      className="p-1.5 text-gray-600 hover:text-gray-900 transition rounded-full hover:bg-gray-100"
    >
      <X className="w-4 h-4" />
    </button>
    <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-full px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search posts, users, topics..."
        autoFocus
        className="flex-1 py-2 text-[14px] focus:outline-none bg-transparent leading-tight"
        style={{ WebkitTextSizeAdjust: '100%' }}
      />
      {searchQuery.trim() && (
        <button
          onClick={() => setSearchQuery('')}
          className="p-1 rounded-full text-gray-500 hover:bg-gray-100 flex-shrink-0"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`p-2 rounded-full transition ${
        showFilters || selectedTag ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Hash className="w-4 h-4" />
    </button>
  </div>
);

const PopularTopics = ({ showFilters, allTags, selectedTag, setSelectedTag }) => {
  if (!showFilters || allTags.length === 0) return null;
  return (
    <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-b from-blue-50/50 to-white border-t border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Popular Topics</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
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
  );
};

const ActiveFiltersBar = ({ searchQuery, selectedTag, filteredPosts, setSelectedTag }) => {
  if (!searchQuery && !selectedTag) return null;
  return (
    <div className="px-3 sm:px-4 py-1.5 bg-blue-50 border-t border-blue-100 flex items-center gap-2 text-xs">
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
  );
};

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
  isConnected,
}) => {
  const isDesktop = useIsDesktop();
  const currentHour = useHourlyTick();

  const trendingEmoji = getTrendingEmojiForHour(currentHour);

  return (
    <div className="sticky top-[72px] bg-white/95 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="max-w-2xl mx-auto">
        {/* Header Title Row */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 md:py-2.5">
          <h1 className="text-[19px] md:text-[22px] font-black tracking-tight text-gray-900">Capazoo</h1>
          <ConnectionPill isConnected={isConnected} />
        </div>

        {/* Tabs & Search/Filter Row - Single Compact Line */}
        {!searchExpanded || isDesktop ? (
          <TabsRow
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSearchExpanded={setSearchExpanded}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedTag={selectedTag}
            trendingEmoji={trendingEmoji}
          />
        ) : (
          <MobileSearchRow
            setSearchExpanded={setSearchExpanded}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedTag={selectedTag}
          />
        )}

        <PopularTopics
          showFilters={showFilters}
          allTags={allTags}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
        />

        <ActiveFiltersBar
          searchQuery={searchQuery}
          selectedTag={selectedTag}
          filteredPosts={filteredPosts}
          setSelectedTag={setSelectedTag}
        />
      </div>
    </div>
  );
};

export default VictoryLaneHeader;
