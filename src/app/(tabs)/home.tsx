import { router } from 'expo-router';
import { Bell, Search, Store } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/gluestack/box';
import { Input, InputField, InputIcon, InputSlot } from '@/components/gluestack/input';
import { AvatarMenuButton } from '@/components/mode-menu';
import { BookingActionCard } from '@/components/booking-action-card';
import { NextBookingHero } from '@/components/booking-card';
import { RestrictionNotice } from '@/components/restriction-notice';
import { ShopCard, ShopCardSkeleton } from '@/components/shop-card';
import { EmptyState, ErrorState, IconButton, Reveal, Row, Screen, SectionHeader, Stack, Text } from '@/components/ui';
import { useFeaturedShops, useMyBookings, useUnreadCount } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { useAuth } from '@/stores/auth';
import { useHasShops } from '@/stores/mode';

export default function Home() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const shops = useFeaturedShops();
  const upcoming = useMyBookings('upcoming');
  const unread = useUnreadCount().data ?? 0;
  const hasShops = useHasShops();
  const [q, setQ] = useState('');

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
      header={<Box style={{ height: insets.top }} />}
      scrollTitle={ar.tabs.home}
      refreshing={shops.isRefetching || upcoming.isRefetching}
      onRefresh={() => {
        void shops.refetch();
        void upcoming.refetch();
      }}>
      <Stack className="gap-6 pt-4">
        {/* greeting */}
        <Row className="justify-between">
          <Box className="flex-1 gap-0.5">
            <Row>
              <Text variant="title">{ar.home.greeting(user?.name)}</Text>
            </Row>
            <Text tone="textMuted">{ar.home.subtitle}</Text>
          </Box>
          <IconButton
            icon={Bell}
            label={ar.tabs.notifications}
            badge={unread > 0}
            onPress={() => router.navigate('/notifications')}
          />
          {hasShops && <AvatarMenuButton />}
        </Row>

        {/* search (filters the featured list until the API has search — API Phase 6) */}
        <Input className="h-13.5 rounded-full border shadow-sm">
          <InputSlot className="ps-4">
            <InputIcon as={Search} className="text-subtle-foreground" />
          </InputSlot>
          <InputField
            value={q}
            onChangeText={setQ}
            placeholder={ar.home.searchPlaceholder}
            accessibilityLabel={ar.home.searchPlaceholder}
            returnKeyType="search"
          />
        </Input>

        {!q && <RestrictionNotice linkToRecord />}

        {next && !q && (
          <Reveal style={{ gap: 12 }}>
            <NextBookingHero booking={next} />
            <BookingActionCard booking={next} />
          </Reveal>
        )}

        <Box>
          <SectionHeader title={ar.home.featured} hint={ar.home.featuredHint} />
          {shops.isPending ? (
            <Stack className="gap-4">
              <ShopCardSkeleton />
              <ShopCardSkeleton />
            </Stack>
          ) : shops.isError ? (
            <ErrorState error={shops.error} onRetry={() => shops.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Store} title={q ? ar.home.noResults : ar.home.noShops} />
          ) : (
            <Stack className="gap-4">
              {filtered.map((shop, i) => (
                <Reveal key={shop.id} index={i}>
                  <ShopCard shop={shop} />
                </Reveal>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Screen>
  );
}
