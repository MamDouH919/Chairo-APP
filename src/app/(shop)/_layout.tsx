import { Stack } from 'expo-router';

import { stackTransitions } from '@/lib/transitions';
import { useTheme } from '@/theme';

/** Shop mode: the tabs (النهارده / المحل) plus the setup screens pushed on top of them. */
export default function ShopLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        ...stackTransitions.push,
      }}
    />
  );
}
