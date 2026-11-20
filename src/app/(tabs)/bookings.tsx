import { router } from 'expo-router';
import { CalendarPlus, History } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';

import { BookingCard, BookingCardSkeleton } from '@/components/booking-card';
import { EmptyState, ErrorState, LoadMore, Reveal, Screen, Stack, Text } from '@/components/ui';
import { useMyBookings } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { springs } from '@/theme';

const AView = withUniwind(Animated.View);

type Scope = 'upcoming' | 'past';

export default function Bookings() {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('upcoming');
  const q = useMyBookings(scope);

  return (
    <Screen
      edgeBottom={false}
      header={
        <Box className="w-full max-w-170 gap-4 self-center px-5" style={{ paddingTop: insets.top + 16 }}>
          <Text variant="title" accessibilityRole="header">
            {ar.tabs.bookings}
          </Text>
          <Segmented value={scope} onChange={setScope} />
        </Box>
      }
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}>
      <Box className="pt-4">
        {q.isPending ? (
          <Stack>
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </Stack>
        ) : !q.data ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.data.length === 0 ? (
          scope === 'upcoming' ? (
            <EmptyState
              icon={CalendarPlus}
              title={ar.bookings.emptyUpcoming}
              hint={ar.bookings.emptyUpcomingHint}
              action={{ label: ar.bookings.browse, onPress: () => router.navigate('/home') }}
            />
          ) : (
            <EmptyState icon={History} title={ar.bookings.emptyPast} />
          )
        ) : (
          // keyed by scope: switching the segment replays the entrance for the new list
          <Stack key={scope}>
            {q.data.map((b, i) => (
              <Reveal key={b.id} index={i}>
                <BookingCard booking={b} />
              </Reveal>
            ))}
            <LoadMore query={q} />
          </Stack>
        )}
      </Box>
    </Screen>
  );
}

function Segmented({ value, onChange }: { value: Scope; onChange: (v: Scope) => void }) {
  const items: { key: Scope; label: string }[] = [
    { key: 'upcoming', label: ar.bookings.upcoming },
    { key: 'past', label: ar.bookings.past },
  ];
  return (
    <Box className="flex-row rounded-lg bg-muted p-1" accessibilityRole="tablist">
      {items.map((it) => (
        <SegmentItem key={it.key} label={it.label} active={it.key === value} onPress={() => onChange(it.key)} />
      ))}
    </Box>
  );
}

/**
 * Each segment owns a thumb that fades and settles in when selected (same idea as the tab bar lens).
 * A single sliding thumb would need `translateX`, which native RTL does not mirror.
 */
function SegmentItem({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const on = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    on.set(withSpring(active ? 1 : 0, springs.select));
  }, [active, on]);
  const thumb = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, on.value)),
    transform: [{ scale: interpolate(on.value, [0, 1], [0.92, 1]) }],
  }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="min-h-11 flex-1 items-center justify-center rounded-md">
      <AView pointerEvents="none" className="absolute inset-0 rounded-md bg-card shadow-sm" style={thumb} />
      <Text variant="label" tone={active ? 'text' : 'textMuted'} align="center">
        {label}
      </Text>
    </Pressable>
  );
}
