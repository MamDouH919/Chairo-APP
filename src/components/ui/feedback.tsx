import { onlineManager } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { ar } from '@/i18n/ar';
import { errorCode, errorMessage } from '@/lib/errors';
import { elevation, radius, space, useTheme } from '@/theme';

import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';

/** Pulsing placeholder that reserves the exact space of the content (no layout shift). */
export function Skeleton({
  width = '100%',
  height = 16,
  radius: r = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!reduce) o.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [reduce, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceMuted }, anim, style]} />
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon icon={icon} size="xl" tone="primary" />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {hint && (
        <Text variant="body" tone="textMuted" align="center">
          {hint}
        </Text>
      )}
      {action && (
        <View style={{ marginTop: space.sm, alignSelf: 'stretch', alignItems: 'center' }}>
          <Button label={action.label} onPress={action.onPress} variant="secondary" fullWidth={false} />
        </View>
      )}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = errorCode(error) === 'NETWORK';
  return (
    <EmptyState
      icon={offline ? WifiOff : CircleAlert}
      title={errorMessage(error)}
      action={onRetry ? { label: ar.common.retry, onPress: onRetry } : undefined}
    />
  );
}

/** End of a paged list. Renders nothing once the last page is loaded. */
export function LoadMore({
  query,
}: {
  query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    fetchNextPage: () => unknown;
  };
}) {
  if (!query.hasNextPage) return null;
  return (
    <Button
      label={query.isFetchNextPageError ? ar.common.retry : ar.common.loadMore}
      variant="ghost"
      loading={query.isFetchingNextPage}
      onPress={() => query.fetchNextPage()}
    />
  );
}

/** Shown over every screen while offline. Queries pause and refetch on their own when the network returns. */
export function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const online = useSyncExternalStore(
    (notify) => onlineManager.subscribe(notify),
    () => onlineManager.isOnline(),
  );
  if (online) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={[styles.banner, elevation(colors, 2), { top: insets.top + space.xs, backgroundColor: colors.warningSoft }]}>
      <Icon icon={WifiOff} size="md" tone="warning" />
      <Text variant="caption">{ar.common.offline}</Text>
    </Animated.View>
  );
}

// ── toast ────────────────────────────────────────────────────────────────

interface ToastState {
  current: { id: number; message: string; tone: 'success' | 'error' } | null;
  show(message: string, tone?: 'success' | 'error'): void;
}
export const useToast = create<ToastState>((set) => ({
  current: null,
  show(message, tone = 'success') {
    const id = Date.now();
    set({ current: { id, message, tone } });
    setTimeout(() => set((s) => (s.current?.id === id ? { current: null } : s)), 3200);
  },
}));
export const toast = (message: string, tone?: 'success' | 'error') => useToast.getState().show(message, tone);

export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const current = useToast((s) => s.current);
  if (!current) return null;
  const isError = current.tone === 'error';
  return (
    <Animated.View
      key={current.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, elevation(colors, 2), { top: insets.top + space.sm, backgroundColor: colors.surfaceInk }]}>
      <Icon icon={isError ? CircleAlert : CircleCheck} tone={isError ? 'danger' : 'success'} />
      <Text variant="label" tone="onInk" style={{ flex: 1 }}>
        {current.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.huge, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  banner: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    zIndex: 90,
    alignSelf: 'center',
  },
  toast: {
    position: 'absolute',
    start: space.lg,
    end: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    zIndex: 100,
    maxWidth: 560,
    alignSelf: 'center',
  },
});
