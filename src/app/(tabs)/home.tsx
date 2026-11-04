import { router } from 'expo-router';
import { Bell, Search, Store } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MockBadge } from '@/components/brand';
import { BookingActionCard } from '@/components/booking-action-card';
import { NextBookingHero } from '@/components/booking-card';
import { RestrictionNotice } from '@/components/restriction-notice';
import { ShopCard, ShopCardSkeleton } from '@/components/shop-card';
import { EmptyState, ErrorState, Icon, IconButton, Row, Screen, SectionHeader, Stack, Text } from '@/components/ui';
import { useFeaturedShops, useMyBookings, useUnreadCount } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { useAuth } from '@/stores/auth';
import { fonts, hitTarget, radius, space, useTheme } from '@/theme';

export default function Home() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const shops = useFeaturedShops();
  const upcoming = useMyBookings('upcoming');
  const unread = useUnreadCount().data ?? 0;
  const [q, setQ] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const next = upcoming.data?.[0];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return shops.data ?? [];
    return (shops.data ?? []).filter((s) =>
      [s.name, s.area, s.city, s.address].some((f) => f?.toLowerCase().includes(term)),
    );
  }, [q, shops.data]);

  return (
    <Screen
      edgeBottom={false}
      header={<View style={{ height: insets.top }} />}
      refreshing={shops.isRefetching || upcoming.isRefetching}
      onRefresh={() => {
        void shops.refetch();
        void upcoming.refetch();
      }}>
      <Stack gap={space.xxl} style={{ paddingTop: space.lg }}>
        {/* greeting */}
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Row>
              <Text variant="title">{ar.home.greeting(user?.name)}</Text>
              <MockBadge />
            </Row>
            <Text tone="textMuted">{ar.home.subtitle}</Text>
          </View>
          <IconButton
            icon={Bell}
            label={ar.tabs.notifications}
            badge={unread > 0}
            onPress={() => router.navigate('/notifications')}
          />
        </Row>

        {/* search (filters the featured list until the API has search — API Phase 6) */}
        <View
          style={[
            styles.search,
            { backgroundColor: colors.surface, borderColor: searchFocused ? colors.primary : colors.border },
          ]}>
          <Icon icon={Search} tone="textSubtle" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={ar.home.searchPlaceholder}
            placeholderTextColor={colors.textSubtle}
            accessibilityLabel={ar.home.searchPlaceholder}
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {!q && <RestrictionNotice linkToRecord />}

        {next && !q && (
          <Animated.View entering={FadeInDown.duration(300)} style={{ gap: space.md }}>
            <NextBookingHero booking={next} />
            <BookingActionCard booking={next} />
          </Animated.View>
        )}

        <View>
          <SectionHeader title={ar.home.featured} hint={ar.home.featuredHint} />
          {shops.isPending ? (
            <Stack gap={space.lg}>
              <ShopCardSkeleton />
              <ShopCardSkeleton />
            </Stack>
          ) : shops.isError ? (
            <ErrorState error={shops.error} onRetry={() => shops.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Store} title={q ? ar.home.noResults : ar.home.noShops} />
          ) : (
            <Stack gap={space.lg}>
              {filtered.map((shop, i) => (
                <Animated.View key={shop.id} entering={FadeInDown.duration(320).delay(Math.min(i, 5) * 60)}>
                  <ShopCard shop={shop} />
                </Animated.View>
              ))}
            </Stack>
          )}
        </View>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    minHeight: hitTarget,
    fontFamily: fonts.regular,
    fontSize: 16,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
