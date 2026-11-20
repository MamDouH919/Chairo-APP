import { router } from 'expo-router';
import { Hourglass, RefreshCw, UserRound } from 'lucide-react-native';
import { useState } from 'react';

import { AvatarMenuButton, switchToCustomerMode } from '@/components/mode-menu';
import { StaffTopBar } from '@/components/staff-top-bar';
import { Badge, Button, Icon, Screen, Stack, Text, toast } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { useMode } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

/** Registered a shop; it's PENDING until our admin approves it. */
export default function Pending() {
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
      <Stack className="gap-6 pt-12">
        <Box className="h-24 w-24 items-center justify-center self-center rounded-full bg-secondary">
          <Icon icon={Hourglass} size="xl" tone="primary" />
        </Box>
        <Stack className="gap-2 items-center">
          <Text variant="title" align="center" accessibilityRole="header">
            {ar.staff.pendingTitle}
          </Text>
          <Text tone="textMuted" align="center">
            {ar.staff.pendingHint}
          </Text>
        </Stack>
        <Stack className="gap-2 items-center">
          {pending.map((m) => (
            <Box key={m.shopId} className="flex-row justify-center">
              <Badge label={ar.staff.pendingShop(m.shopName)} tone="warning" />
            </Box>
          ))}
        </Stack>
        <Button label={ar.staff.checkAgain} icon={RefreshCw} variant="secondary" loading={checking} onPress={recheck} />
      </Stack>
    </Screen>
  );
}
