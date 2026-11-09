import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { landingHref } from '@/lib/landing';
import { useAuth } from '@/stores/auth';
import { useMode } from '@/stores/mode';
import { space, useTheme } from '@/theme';

/**
 * Anchor route: Stack.Protected sends users here when their auth state or mode changes,
 * and every "where do I go now?" decision (login, mode switch, shop picked) lands here.
 */
export default function Index() {
  const status = useAuth((s) => s.status);
  const ready = useMode((s) => s.ready);
  const landing = useMode((s) => s.landing);

  useEffect(() => {
    if (status === 'signedIn' && !ready) void useMode.getState().resolve();
  }, [status, ready]);

  if (status === 'needsProfile') return <Redirect href="/profile-setup" />;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!ready || !landing) return <Preparing />;
  return <Redirect href={landingHref(landing)} />;
}

function Preparing() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.md,
        backgroundColor: colors.background,
      }}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text tone="textMuted">{ar.staff.loading}</Text>
    </View>
  );
}
