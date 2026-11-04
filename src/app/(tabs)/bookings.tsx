import { router } from 'expo-router';
import { CalendarPlus, History } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingCard, BookingCardSkeleton } from '@/components/booking-card';
import { EmptyState, ErrorState, LoadMore, Screen, Stack, Text } from '@/components/ui';
import { useMyBookings } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { radius, space, useTheme } from '@/theme';

type Scope = 'upcoming' | 'past';

export default function Bookings() {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('upcoming');
  const q = useMyBookings(scope);

  return (
    <Screen
      edgeBottom={false}
      header={
        <View
          style={{
            paddingTop: insets.top + space.lg,
            paddingHorizontal: space.xl,
            gap: space.lg,
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
          }}>
          <Text variant="title" accessibilityRole="header">
            {ar.tabs.bookings}
          </Text>
          <Segmented value={scope} onChange={setScope} />
        </View>
      }
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}>
      <View style={{ paddingTop: space.lg }}>
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
          <Stack>
            {q.data.map((b, i) => (
              <Animated.View key={b.id} entering={FadeInDown.duration(280).delay(Math.min(i, 6) * 50)}>
                <BookingCard booking={b} />
              </Animated.View>
            ))}
            <LoadMore query={q} />
          </Stack>
        )}
      </View>
    </Screen>
  );
}

function Segmented({ value, onChange }: { value: Scope; onChange: (v: Scope) => void }) {
  const { colors } = useTheme();
  const items: { key: Scope; label: string }[] = [
    { key: 'upcoming', label: ar.bookings.upcoming },
    { key: 'past', label: ar.bookings.past },
  ];
  return (
    <View style={[styles.seg, { backgroundColor: colors.surfaceMuted }]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(it.key)}
            style={[
              styles.segItem,
              active && {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              },
            ]}>
            <Text variant="label" tone={active ? 'text' : 'textMuted'} align="center">
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.lg },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
