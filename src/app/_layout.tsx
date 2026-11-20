import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { CircleAlert } from 'lucide-react-native';

import { DirectionProvider } from '@/components/direction-provider';
import { GluestackUIProvider } from '@/components/gluestack/gluestack-ui-provider';
import { EmptyState, OfflineBanner, ToastHost } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import { useMode } from '@/stores/mode';
import { stackTransitions } from '@/lib/transitions';
import { useTheme } from '@/theme';

import '../../global.css';

SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

/** Catches render errors from every route, so a crash shows a way out instead of a blank screen. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState
        icon={CircleAlert}
        title={ar.common.crashTitle}
        hint={ar.common.crashHint}
        action={{ label: ar.common.retry, onPress: () => void retry() }}
      />
    </View>
  );
}

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const status = useAuth((s) => s.status);
  // Shop mode swaps the whole tab set; leaving it sends the user back through the anchor route.
  const inShop = useMode((s) => s.ready && s.mode === 'shop' && !!s.shopId);
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    void useAuth.getState().bootstrap();
  }, []);

  const ready = fontsLoaded && status !== 'loading';
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <DirectionProvider>
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GluestackUIProvider mode="system">
            <QueryClientProvider client={queryClient}>
              <ThemeProvider
                value={{
                  ...navTheme,
                  colors: {
                    ...navTheme.colors,
                    background: colors.background,
                    card: colors.surface,
                    primary: colors.primary,
                    text: colors.text,
                    border: colors.border,
                  },
                }}>
                <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    ...stackTransitions.push,
                  }}>
                  <Stack.Screen name="index" options={stackTransitions.swap} />
                  <Stack.Protected guard={status === 'signedOut'}>
                    <Stack.Screen name="(auth)" options={stackTransitions.swap} />
                  </Stack.Protected>
                  <Stack.Protected guard={status === 'needsProfile'}>
                    <Stack.Screen name="profile-setup" options={stackTransitions.swap} />
                  </Stack.Protected>
                  <Stack.Protected guard={status === 'signedIn' && inShop}>
                    <Stack.Screen name="(shop)" options={stackTransitions.swap} />
                  </Stack.Protected>
                  <Stack.Protected guard={status === 'signedIn' && !inShop}>
                    <Stack.Screen name="(tabs)" options={stackTransitions.swap} />
                  </Stack.Protected>
                  <Stack.Protected guard={status === 'signedIn'}>
                    <Stack.Screen name="staff/no-shop" />
                    <Stack.Screen name="staff/register-shop" />
                    <Stack.Screen name="staff/pending" />
                    <Stack.Screen name="staff/pick-shop" />
                    <Stack.Screen name="shop/[slug]" />
                    <Stack.Screen name="book/[slug]" />
                    <Stack.Screen name="book/success" options={{ gestureEnabled: false, ...stackTransitions.swap }} />
                    <Stack.Screen name="booking/[id]" />
                    <Stack.Screen name="reschedule/[id]" />
                    <Stack.Screen name="check-in/[id]" />
                    <Stack.Screen name="account/strikes" />
                    <Stack.Screen name="account/sessions" />
                    <Stack.Screen name="policy" options={{ presentation: 'modal' }} />
                  </Stack.Protected>
                </Stack>
                <OfflineBanner />
                <ToastHost />
              </ThemeProvider>
            </QueryClientProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaListener>
    </DirectionProvider>
  );
}
