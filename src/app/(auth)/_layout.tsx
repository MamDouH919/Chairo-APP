import { Stack } from 'expo-router';

import { stackTransitions } from '@/lib/transitions';
import { useTheme } from '@/theme';

export default function AuthLayout() {
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
