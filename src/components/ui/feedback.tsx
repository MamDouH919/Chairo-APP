import { onlineManager } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  ZoomIn,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { create } from 'zustand';

import { Box } from '@/components/gluestack/box';

import { ar } from '@/i18n/ar';
import { errorCode, errorMessage } from '@/lib/errors';
import { elevation, motion, radius, space, useTheme } from '@/theme';

import { Button } from './button';
import { Icon } from './icon';
import { Reveal } from './motion';
import { Text } from './text';

const AView = withUniwind(Animated.View);

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
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!reduce) o.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [reduce, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  // dynamic dimensions come from callers, so they stay as style; the fill is a token class
  return <AView className="bg-muted" style={[{ width, height, borderRadius: r }, anim, style]} />;
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
  return (
    <Box className="items-center gap-2 px-5 py-12">
      <AView
        entering={ZoomIn.duration(motion.base)}
        className="mb-2 h-18 w-18 items-center justify-center rounded-full bg-secondary">
        <Icon icon={icon} size="xl" tone="primary" />
      </AView>
      <Reveal delay={80} style={{ alignSelf: 'stretch', alignItems: 'center', gap: space.sm }}>
        <Text variant="heading" align="center">
          {title}
        </Text>
        {hint && (
          <Text variant="body" tone="textMuted" align="center">
            {hint}
          </Text>
        )}
        {action && (
          <Box className="mt-2 items-center self-stretch">
            <Button label={action.label} onPress={action.onPress} variant="secondary" fullWidth={false} />
          </Box>
        )}
      </Reveal>
    </Box>
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
    <AView
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      className="absolute z-90 flex-row items-center gap-2 self-center rounded-full bg-warning-soft px-4 py-2"
      style={[elevation(colors, 2), { top: insets.top + space.xs }]}>
      <Icon icon={WifiOff} size="md" tone="warning" />
      <Text variant="caption">{ar.common.offline}</Text>
    </AView>
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
    <AView
      key={current.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute inset-x-4 z-100 max-w-140 flex-row items-center gap-3 self-center rounded-lg bg-ink p-4"
      style={[elevation(colors, 2), { top: insets.top + space.sm }]}>
      <Icon icon={isError ? CircleAlert : CircleCheck} tone={isError ? 'danger' : 'success'} />
      <Text variant="label" tone="onInk" className="flex-1">
        {current.message}
      </Text>
    </AView>
  );
}
