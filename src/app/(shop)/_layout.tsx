import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Shop mode. Step 2 of BARBER-MODE.md turns this into the النهارده / الجاي / العملاء / المحل tabs. */
export default function ShopLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
