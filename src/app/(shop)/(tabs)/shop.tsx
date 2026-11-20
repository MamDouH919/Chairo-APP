import { router } from 'expo-router';
import { CalendarClock, Scissors, Store, UserRound } from 'lucide-react-native';

import { ShopHeader } from '@/components/shop-header';
import { Card, ListRow, Screen, Stack, Text } from '@/components/ui';
import { useManagedBarbers, useManagedServices } from '@/hooks/manage';
import { ar } from '@/i18n/ar';
import { useCurrentMembership } from '@/stores/mode';

/** "المحل": the setup hub. Owner: services, shop hours, every chair's hours. Barber: his own hours. */
export default function ShopHub() {
  const m = useCurrentMembership();
  const shopId = m?.shopId ?? '';
  const isOwner = m?.role === 'OWNER';
  const services = useManagedServices(shopId);
  const barbers = useManagedBarbers(shopId, isOwner);
  const refreshing = services.isRefetching || barbers.isRefetching;

  if (!m)
    return (
      <Screen header={<ShopHeader />}>
        <Text>{''}</Text>
      </Screen>
    );

  const activeCount = services.data?.filter((s) => s.isActive).length;

  return (
    <Screen
      edgeBottom={false}
      header={<ShopHeader />}
      refreshing={refreshing}
      onRefresh={() => {
        void services.refetch();
        if (isOwner) void barbers.refetch();
      }}>
      <Stack className="gap-4 pt-3">
        <Card padded={false}>
          <ListRow
            icon={Scissors}
            title={ar.manage.servicesTitle}
            subtitle={activeCount === undefined ? undefined : ar.manage.servicesCount(activeCount)}
            onPress={() => router.push('/services')}
            last={!isOwner && !m.barberId}
          />
          {isOwner && (
            <ListRow
              icon={UserRound}
              title={ar.manage.barbersManageTitle}
              subtitle={
                barbers.data ? ar.manage.barbersCount(barbers.data.filter((b) => b.isActive).length) : undefined
              }
              onPress={() => router.push('/barbers')}
            />
          )}
          {isOwner && (
            <ListRow
              icon={Store}
              title={ar.manage.shopHoursTitle}
              subtitle={ar.manage.shopHoursHint}
              onPress={() => router.push('/hours')}
              last={!m.barberId}
            />
          )}
          {m.barberId && (
            <ListRow
              icon={CalendarClock}
              title={ar.manage.myHoursTitle}
              subtitle={ar.manage.myHoursHint}
              onPress={() =>
                router.push({ pathname: '/barber-hours', params: { barberId: m.barberId!, name: m.barberName ?? '' } })
              }
              last
            />
          )}
        </Card>
      </Stack>
    </Screen>
  );
}
