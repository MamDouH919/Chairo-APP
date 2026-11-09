import { router } from 'expo-router';
import { Hourglass, RefreshCw, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AvatarMenuButton, switchToCustomerMode } from '@/components/mode-menu';
import { StaffTopBar } from '@/components/staff-top-bar';
import { Badge, Button, Icon, Screen, Stack, Text, toast } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { useMode } from '@/stores/mode';
import { space, useTheme } from '@/theme';

/** Registered a shop; it's PENDING until our admin approves it. */
export default function Pending() {
  const { colors } = useTheme();
  // select the stable array, filter outside: a new array from the selector would re-render forever
  const pending = useMode((s) => s.memberships).filter((m) => m.status === 'PENDING');
  const [checking, setChecking] = useState(false);

  const recheck = async () => {
    setChecking(true);
    try {
      const landing = await useMode.getState().resolve({ intent: 'barber' });
      if (landing.kind === 'pending') toast(ar.staff.pendingTitle);
      else router.replace('/');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen
      header={<StaffTopBar right={<AvatarMenuButton size={40} />} />}
      refreshing={checking}
      onRefresh={recheck}
      footer={<Button label={ar.staff.asCustomer} icon={UserRound} variant="outline" onPress={switchToCustomerMode} />}>
      <Stack gap={space.xxl} style={{ paddingTop: space.huge }}>
        <View
          style={{
            alignSelf: 'center',
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon icon={Hourglass} size="xl" tone="primary" />
        </View>
        <Stack gap={space.sm} style={{ alignItems: 'center' }}>
          <Text variant="title" align="center" accessibilityRole="header">
            {ar.staff.pendingTitle}
          </Text>
          <Text tone="textMuted" align="center">
            {ar.staff.pendingHint}
          </Text>
        </Stack>
        <Stack gap={space.sm} style={{ alignItems: 'center' }}>
          {pending.map((m) => (
            <View key={m.shopId} style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Badge label={ar.staff.pendingShop(m.shopName)} tone="warning" />
            </View>
          ))}
        </Stack>
        <Button label={ar.staff.checkAgain} icon={RefreshCw} variant="secondary" loading={checking} onPress={recheck} />
      </Stack>
    </Screen>
  );
}
