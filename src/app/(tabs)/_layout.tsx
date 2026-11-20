import { Tabs } from 'expo-router';
import { Bell, CalendarDays, House, UserRound, type LucideIcon } from 'lucide-react-native';
import { type ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { useUnreadCount } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { iconStroke, motion, useTheme } from '@/theme';

const tabIcon = (Glyph: LucideIcon) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Glyph size={24} color={color as string} strokeWidth={focused ? 2.3 : iconStroke} />;
  };

export default function TabsLayout() {
  const unread = useUnreadCount().data ?? 0;
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Tabs are peers, not a hierarchy: a quick cross-fade (direction-neutral, so RTL-safe) instead of a slide.
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: motion.fast } },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="home" options={{ title: ar.tabs.home, tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="bookings" options={{ title: ar.tabs.bookings, tabBarIcon: tabIcon(CalendarDays) }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: ar.tabs.notifications,
          tabBarIcon: tabIcon(Bell),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
        }}
      />
      <Tabs.Screen name="account" options={{ title: ar.tabs.account, tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  );
}
