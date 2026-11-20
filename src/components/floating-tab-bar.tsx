import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { useContext, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Glass } from '@/components/ui';
import { fonts, motion, springs, useTheme, type Colors } from '@/theme';

/** Geometry (dp) */
const BAR_H = 66;
const INSET = 6; // gap between the capsule edge and the active lens
const SIDE_GUTTER = 20;
const MAX_W = 480;

const SPRING = springs.select;

/**
 * iOS 26-style floating capsule: a Liquid Glass bar (frosted fallback off iOS 26) floating over content.
 * Each tab draws its own "lens" and the active one fades/scales in.
 *
 * Tabs are a plain flex row on purpose: RTL flips it correctly on every platform. Absolute `left` offsets
 * don't work here — native RTL swaps left/right (doLeftAndRightSwapInRTL) while web doesn't, and
 * `translateX` is never swapped, so any hand-mirrored coordinates break on one platform or the other.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);

  const pos = useSharedValue(state.index);
  useEffect(() => {
    pos.value = reduceMotion ? withTiming(state.index, { duration: 0 }) : withSpring(state.index, SPRING);
  }, [pos, state.index, reduceMotion]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}
      // Screens read this through BottomTabBarHeightContext to keep their last row above the bar.
      onLayout={(e) => reportHeight?.(Math.round(e.nativeEvent.layout.height))}>
      <Glass layer="chrome" shadow={2} style={styles.bar}>
        {/* Native glass can render fully transparent (simulator, some OS builds): keep a frosted fill beneath it. */}
        <View
          pointerEvents="none"
          style={[styles.fill, { backgroundColor: `${colors.surface}D9`, borderColor: colors.border }]}
        />
        <View role="tablist" style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = index === state.index;
            const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);

            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                navigateToTab(route.key);
              }
            };
            const onLongPress = () => emitter.emit({ type: 'tabLongPress', target: route.key });

            return (
              <TabItem
                key={route.key}
                index={index}
                pos={pos}
                label={label}
                focused={focused}
                badge={options.tabBarBadge}
                colors={colors}
                renderIcon={(color) => options.tabBarIcon?.({ focused, color, size: 24 }) ?? null}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              />
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

interface TabItemProps {
  index: number;
  pos: SharedValue<number>;
  label: string;
  focused: boolean;
  badge?: string | number;
  colors: Colors;
  renderIcon: (color: string) => React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
}

function TabItem({
  index,
  pos,
  label,
  focused,
  badge,
  colors,
  renderIcon,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabItemProps) {
  // Read `pos` directly here: on web, Reanimated only subscribes to shared values in the worklet's own closure.
  const active = useDerivedValue(() => Math.max(0, 1 - Math.abs(pos.value - index)));
  const lensStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: interpolate(active.value, [0, 1], [0.86, 1]) }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(active.value, [0, 1], [colors.textMuted, colors.primary]),
  }));
  // The glyph grows a touch as its tab takes focus, and the whole item gives under the finger.
  const pressed = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(active.value, [0, 1], [1, 1.1]) * interpolate(pressed.value, [0, 1], [1, 0.88]) }],
  }));

  return (
    <Pressable
      role="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        pressed.set(withTiming(1, { duration: motion.press }));
      }}
      onPressOut={() => {
        pressed.set(withSpring(0, springs.press));
      }}
      style={styles.tab}>
      <Animated.View pointerEvents="none" style={[styles.lens, { backgroundColor: colors.lens }, lensStyle]} />
      <Animated.View style={[styles.iconSlot, iconStyle]}>
        {renderIcon(focused ? colors.primary : colors.textMuted)}
        {badge !== undefined && (
          <View
            style={[
              styles.badge,
              // `end` is the trailing edge on every platform (unlike left/right, which native RTL swaps)
              { end: -12 },
              { backgroundColor: colors.danger, borderColor: colors.surface },
            ]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]} maxFontSizeMultiplier={1.2}>
              {String(badge)}
            </Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.25}
        style={[styles.label, { fontFamily: focused ? fonts.semibold : fonts.medium }, labelStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE_GUTTER,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: MAX_W,
    height: BAR_H,
    borderRadius: BAR_H / 2,
  },
  fill: { ...StyleSheet.absoluteFill, borderRadius: BAR_H / 2, borderWidth: StyleSheet.hairlineWidth },
  row: { flex: 1, flexDirection: 'row', padding: INSET },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  lens: { ...StyleSheet.absoluteFill, borderRadius: (BAR_H - INSET * 2) / 2 },
  iconSlot: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 14 },
});
