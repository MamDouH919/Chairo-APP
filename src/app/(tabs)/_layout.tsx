import { Tabs } from 'expo-router';
import { Bell, CalendarDays, House, UserRound, type LucideIcon } from 'lucide-react-native';
import { Platform, type ColorValue } from 'react-native';

import { useUnreadCount } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { fonts, iconStroke, useTheme } from '@/theme';

const tabIcon = (Glyph: LucideIcon) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Glyph size={24} color={color as string} strokeWidth={focused ? 2.3 : iconStroke} />;
  };

export default function TabsLayout() {
  const { colors } = useTheme();
  const unread = useUnreadCount().data ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontFamily: fonts.semibold, fontSize: 11 },
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
