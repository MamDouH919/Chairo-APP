import { router } from 'expo-router';
import { MessageCircle, RefreshCw, Store, UserRound, UserRoundSearch } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Share } from 'react-native';

import { StaffTopBar } from '@/components/staff-top-bar';
import { AvatarMenuButton, switchToCustomerMode } from '@/components/mode-menu';
import { Button, Card, Icon, Screen, Stack, Text, toast } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { formatPhone } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { useMode } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

const plain = (s: string) => s.replace(/[⁦-⁩]/g, '');

/** Chose "barber" but no shop has added this number yet. */
export default function NoShop() {
  const user = useAuth((s) => s.user);
  const [checking, setChecking] = useState(false);
  const phone = user ? formatPhone(user.phone) : '';

  const recheck = async () => {
    setChecking(true);
    try {
      const landing = await useMode.getState().resolve({ intent: 'barber' });
      if (landing.kind === 'noShop') toast(ar.staff.stillNothing);
      else router.replace('/');
    } finally {
      setChecking(false);
    }
  };

  const sendNumber = async () => {
    const message = ar.staff.shareMessage(user?.name ?? '', plain(phone));
    // wa.me without a number opens WhatsApp's own contact picker with the text ready.
    const opened = await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`)
      .then(() => true)
      .catch(() => false);
    if (!opened) await Share.share({ message }).catch(() => undefined);
  };

  return (
    <Screen
      header={<StaffTopBar right={<AvatarMenuButton size={40} />} />}
      refreshing={checking}
      onRefresh={recheck}
      footer={<Button label={ar.staff.asCustomer} icon={UserRound} variant="outline" onPress={switchToCustomerMode} />}>
      <Stack className="gap-6 pt-4">
        <Stack className="gap-3">
          <Box className="h-16 w-16 items-center justify-center rounded-full bg-warning-soft">
            <Icon icon={UserRoundSearch} size="xl" tone="warning" />
          </Box>
          <Text variant="title" accessibilityRole="header">
            {ar.staff.noShopTitle}
          </Text>
          <Text tone="textMuted">{ar.staff.noShopHint}</Text>
        </Stack>

        <Card tone="ink" className="p-5 gap-1">
          <Text variant="label" tone="onInkMuted">
            {ar.staff.yourNumber}
          </Text>
          <Text
            variant="display"
            tone="onInk"
            accessibilityLabel={`${ar.staff.yourNumber} ${plain(phone)}`}
            className="self-start tracking-wide"
            style={{ writingDirection: 'ltr' }}>
            {plain(phone)}
          </Text>
        </Card>

        <Stack className="gap-3">
          <Button label={ar.staff.sendNumber} icon={MessageCircle} onPress={sendNumber} />
          <Button
            label={ar.staff.haveShop}
            icon={Store}
            variant="secondary"
            onPress={() => router.push('/staff/register-shop')}
          />
          <Button label={ar.staff.checkAgain} icon={RefreshCw} variant="ghost" loading={checking} onPress={recheck} />
          <Text variant="caption" tone="textSubtle" align="center">
            {ar.staff.pullHint}
          </Text>
        </Stack>
      </Stack>
    </Screen>
  );
}
