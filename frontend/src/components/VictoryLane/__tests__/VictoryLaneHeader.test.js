import React from 'react';
import { render, screen, act } from '@testing-library/react';
import VictoryLaneHeader from '../VictoryLaneHeader';

const setupMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
};

const baseProps = {
  activeTab: 'for-you',
  setActiveTab: jest.fn(),
  searchExpanded: false,
  setSearchExpanded: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
  showFilters: false,
  setShowFilters: jest.fn(),
  selectedTag: null,
  setSelectedTag: jest.fn(),
  allTags: [],
  filteredPosts: [],
  isConnected: true,
};

describe('VictoryLaneHeader emoji behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('shows For You popcorn emoji', () => {
    jest.setSystemTime(new Date('2026-07-01T08:00:00.000Z'));
    render(<VictoryLaneHeader {...baseProps} />);
    expect(screen.getByText('🍿')).toBeInTheDocument();
  });

  test('updates Trending emoji when hour changes while mounted', () => {
    jest.setSystemTime(new Date('2026-07-01T08:59:00.000Z')); // morning => ☕️
    const { rerender } = render(<VictoryLaneHeader {...baseProps} />);
    expect(screen.getByText('☕️')).toBeInTheDocument();

    jest.setSystemTime(new Date('2026-07-01T15:00:00.000Z')); // afternoon => 🧋
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    rerender(<VictoryLaneHeader {...baseProps} />);
    expect(screen.getByText('🧋')).toBeInTheDocument();
  });
});
