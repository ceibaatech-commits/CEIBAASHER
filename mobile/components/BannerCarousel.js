/**
 * BannerCarousel.js
 *
 * A high-performance horizontal banner carousel for the Ceibaa home screen.
 *
 * Props:
 *   banners  — Array<{ id, imageUri, targetType, targetId }>
 *              targetType: 'quiz' | 'leaderboard'
 *
 * Usage:
 *   <BannerCarousel banners={data} />
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Visible card width — leaves ~15 % of the screen as a "peek" on the right. */
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

/** Horizontal margin applied to each side of every card. */
const CARD_H_MARGIN = 8;

/**
 * The exact distance the list must travel to move one card into view.
 * Used by both `snapToInterval` and `getItemLayout`.
 */
const SNAP_INTERVAL = CARD_WIDTH + CARD_H_MARGIN * 2;

// ---------------------------------------------------------------------------
// BannerCard (inner, memoised)
// ---------------------------------------------------------------------------
const BannerCard = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={() => onPress(item)}
    style={styles.card}
    accessibilityRole="button"
    accessibilityLabel={`Banner — ${item.targetType} ${item.targetId}`}
  >
    <Image
      source={{ uri: item.imageUri }}
      style={styles.cardImage}
      resizeMode="cover"
    />
    {/* Subtle bottom gradient overlay for depth */}
    <View style={styles.cardOverlay} pointerEvents="none" />
  </TouchableOpacity>
));

// ---------------------------------------------------------------------------
// BannerCarousel
// ---------------------------------------------------------------------------
const BannerCarousel = ({ banners = [] }) => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  // ── Navigation handler ──────────────────────────────────────────────────
  const handlePress = useCallback(
    (item) => {
      const { targetType, targetId } = item;

      if (targetType === 'quiz_room') {
        navigation.navigate('QuizRoomScreen', { targetId });
      } else if (targetType === 'battle') {
        navigation.navigate('BattleLobbyScreen', { pin: targetId });
      } else if (targetType === 'leaderboard') {
        navigation.navigate('LeaderboardScreen', { targetId });
      }
      // 'url' type is handled by the parent if needed.
    },
    [navigation],
  );

  // ── FlatList optimisation callbacks ─────────────────────────────────────

  /** Stable key prevents unnecessary re-renders on data updates. */
  const keyExtractor = useCallback((item) => String(item.id), []);

  /** Memoised renderItem avoids re-creating the function on every parent render. */
  const renderItem = useCallback(
    ({ item }) => <BannerCard item={item} onPress={handlePress} />,
    [handlePress],
  );

  /**
   * getItemLayout lets FlatList skip layout measurement for every item,
   * which noticeably improves scroll and initial-render performance.
   */
  const getItemLayout = useCallback(
    (_, index) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  if (!banners.length) return null;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        // ── Horizontal carousel ──────────────────────────────────────
        horizontal
        showsHorizontalScrollIndicator={false}
        // ── Snap behaviour ───────────────────────────────────────────
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        /**
         * disableIntervalMomentum prevents the list from snapping past
         * more than one card per swipe gesture — important UX on fast flings.
         */
        disableIntervalMomentum
        // ── Nested ScrollView conflict guard (Android) ───────────────
        nestedScrollEnabled
        // ── Performance tuning ───────────────────────────────────────
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        scrollEventThrottle={16}
        // ── Content padding (no paddingHorizontal — it skews snap math) ─
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 12,
  },

  listContent: {
    // No horizontal padding here — that would break snapToInterval arithmetic.
    // The card's own marginHorizontal already provides the leading/trailing gap.
  },

  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_H_MARGIN,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e2a3a',

    // ── iOS shadow ───────────────────────────────────────────────────
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      // ── Android elevation ────────────────────────────────────────
      android: {
        elevation: 8,
      },
    }),
  },

  cardImage: {
    width: '100%',
    height: 180,
  },

  /**
   * A thin linear-gradient-like scrim at the bottom of each card.
   * Implemented as a semi-transparent View because RN core has no LinearGradient;
   * swap for expo-linear-gradient if available.
   */
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
});

export default BannerCarousel;
