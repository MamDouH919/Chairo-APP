import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { Box } from '@/components/gluestack/box';
import { Spinner } from '@/components/gluestack/spinner';
import { Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { landingHref } from '@/lib/landing';
import { useAuth } from '@/stores/auth';
import { useMode } from '@/stores/mode';

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
  return (
    <Box className="flex-1 items-center justify-center gap-3 bg-background">
      <Spinner size="large" className="accent-primary" />
      <Text tone="textMuted">{ar.staff.loading}</Text>
    </Box>
  );
}
