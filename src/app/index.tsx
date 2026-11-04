import { Redirect } from 'expo-router';

import { useAuth } from '@/stores/auth';

/** Anchor route: Stack.Protected sends users here when their auth state changes. */
export default function Index() {
  const status = useAuth((s) => s.status);
  if (status === 'signedIn') return <Redirect href="/home" />;
  if (status === 'needsProfile') return <Redirect href="/profile-setup" />;
  return <Redirect href="/welcome" />;
}
