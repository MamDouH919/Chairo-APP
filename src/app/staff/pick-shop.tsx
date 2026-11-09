import { UserRound } from 'lucide-react-native';

import { StaffTopBar } from '@/components/staff-top-bar';
import { AvatarMenuButton, openShop, ShopOption, switchToCustomerMode } from '@/components/mode-menu';
import { Button, Screen, Stack, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { activeMemberships } from '@/lib/landing';
import { useMode } from '@/stores/mode';
import { space } from '@/theme';

/** 2+ shops and none remembered: pick one. The choice is remembered per user. */
export default function PickShop() {
  const shops = activeMemberships(useMode((s) => s.memberships));
  return (
    <Screen
      header={<StaffTopBar right={<AvatarMenuButton size={40} />} />}
      footer={<Button label={ar.staff.asCustomer} icon={UserRound} variant="outline" onPress={switchToCustomerMode} />}>
      <Stack gap={space.xxl} style={{ paddingTop: space.lg }}>
        <Stack gap={space.xs}>
          <Text variant="title" accessibilityRole="header">
            {ar.staff.pickTitle}
          </Text>
          <Text tone="textMuted">{ar.staff.pickHint}</Text>
        </Stack>
        <Stack gap={space.md}>
          {shops.map((m) => (
            <ShopOption key={m.shopId} m={m} onPress={() => void openShop(m.shopId)} />
          ))}
        </Stack>
      </Stack>
    </Screen>
  );
}
