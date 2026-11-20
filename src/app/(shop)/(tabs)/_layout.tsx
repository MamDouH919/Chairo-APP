import { Tabs } from 'expo-router';
import { CalendarClock, Store, type LucideIcon } from 'lucide-react-native';
import { type ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { ar } from '@/i18n/ar';
import { iconStroke, motion, useTheme } from '@/theme';

const tabIcon = (Glyph: LucideIcon) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Glyph size={24} color={color as string} strokeWidth={focused ? 2.3 : iconStroke} />;
  };

/** Shop-mode tabs. BARBER-MODE.md adds الجاي and العملاء here as they get built. */
export default function ShopTabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: motion.fast } },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="today" options={{ title: ar.common.today, tabBarIcon: tabIcon(CalendarClock) }} />
      <Tabs.Screen name="shop" options={{ title: ar.manage.tab, tabBarIcon: tabIcon(Store) }} />
    </Tabs>
  );
}
