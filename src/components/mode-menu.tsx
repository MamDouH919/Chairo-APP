import { router } from 'expo-router';
import { Check, LogOut, Scissors, Store, UserRound } from 'lucide-react-native';
import { useState } from 'react';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';

import { Avatar, Badge, Icon, ListRow, Sheet, Stack, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import type { StaffMembership } from '@/lib/api/types';
import { formatPhone } from '@/lib/format';
import { activeMemberships } from '@/lib/landing';
import { useAuth } from '@/stores/auth';
import { useMode } from '@/stores/mode';

/** Customer → shop: re-checks memberships, then lands on the last shop, the picker, or "no shop". */
export async function switchToShopMode() {
  await useMode.getState().resolve({ intent: 'barber' });
  router.replace('/');
}

export async function switchToCustomerMode() {
  await useMode.getState().enterCustomer();
  router.replace('/');
}

export async function openShop(shopId: string) {
  await useMode.getState().enterShop(shopId);
  router.replace('/');
}

export const roleLine = (m: StaffMembership) =>
  m.role === 'BARBER' && m.barberName
    ? `${ar.staff.roles.BARBER} · ${ar.staff.chairOf(m.barberName)}`
    : ar.staff.roles[m.role];

/** Header avatar: opens the mode menu. */
export function AvatarMenuButton({ size = 44 }: { size?: number }) {
  const name = useAuth((s) => s.user?.name ?? '?');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ar.staff.menuTitle}
        hitSlop={6}
        onPress={() => setOpen(true)}
        className="min-w-12 items-center data-[active=true]:opacity-70">
        <Avatar name={name} size={size} />
      </Pressable>
      <ModeMenu visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Who am I, which shop, and the mode switch. Big rows, no typing. */
export function ModeMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const mode = useMode((s) => s.mode);
  const shopId = useMode((s) => s.shopId);
  const shops = activeMemberships(useMode((s) => s.memberships));
  const inShop = mode === 'shop';

  const run = (fn: () => Promise<void>) => {
    onClose();
    void fn();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Stack className="gap-4 self-stretch">
        <Box className="flex-row items-center gap-3">
          <Avatar name={user?.name ?? '?'} size={52} />
          <Box className="flex-1">
            <Text variant="heading" numberOfLines={1}>
              {user?.name}
            </Text>
            <Text variant="label" tone="textMuted">
              {user ? formatPhone(user.phone) : ''}
            </Text>
          </Box>
        </Box>

        {inShop && shops.length > 1 && (
          <Stack className="gap-2">
            <Text variant="overline" tone="textSubtle">
              {ar.staff.switchShop}
            </Text>
            {shops.map((m) => (
              <ShopOption
                key={m.shopId}
                m={m}
                selected={m.shopId === shopId}
                onPress={() => run(() => openShop(m.shopId))}
              />
            ))}
          </Stack>
        )}

        <Box className="overflow-hidden rounded-lg border border-border">
          {inShop ? (
            <ListRow
              icon={UserRound}
              title={ar.staff.customerMode}
              subtitle={ar.staff.customerModeHint}
              onPress={() => run(switchToCustomerMode)}
            />
          ) : (
            <ListRow
              icon={shops.length ? Store : Scissors}
              title={shops.length ? ar.staff.shopMode : ar.staff.imBarber}
              subtitle={shops.length ? ar.staff.shopModeHint : undefined}
              onPress={() => run(switchToShopMode)}
            />
          )}
          <ListRow
            icon={LogOut}
            title={ar.account.logout}
            danger
            last
            onPress={() => run(() => useAuth.getState().signOut())}
          />
        </Box>
      </Stack>
    </Sheet>
  );
}

export function ShopOption({ m, selected, onPress }: { m: StaffMembership; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={`${m.shopName}، ${roleLine(m)}`}
      onPress={onPress}
      className={`min-h-18 flex-row items-center gap-3 rounded-lg bg-card p-3 data-[active=true]:bg-muted ${
        selected ? 'border-2 border-primary' : 'border border-border'
      }`}>
      <Avatar name={m.shopName} size={48} />
      <Box className="flex-1 gap-0.5">
        <Text variant="bodyStrong" numberOfLines={1}>
          {m.shopName}
        </Text>
        <Box className="flex-row">
          <Badge label={roleLine(m)} tone={m.role === 'OWNER' ? 'accent' : 'primary'} />
        </Box>
      </Box>
      {selected && <Icon icon={Check} tone="primary" size="lg" />}
    </Pressable>
  );
}
