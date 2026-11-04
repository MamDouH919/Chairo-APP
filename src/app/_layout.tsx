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
import { CircleAlert } from 'lucide-react-native';

import { DirectionProvider } from '@/components/direction-provider';
import { EmptyState, OfflineBanner, ToastHost } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import { useTheme } from '@/theme';

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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
              }}>
              <Stack.Screen name="index" />
              <Stack.Protected guard={status === 'signedOut'}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={status === 'needsProfile'}>
                <Stack.Screen name="profile-setup" />
              </Stack.Protected>
              <Stack.Protected guard={status === 'signedIn'}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="shop/[slug]" />
                <Stack.Screen name="book/[slug]" />
                <Stack.Screen name="book/success" options={{ gestureEnabled: false, animation: 'fade' }} />
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
      </GestureHandlerRootView>
    </DirectionProvider>
  );
}
