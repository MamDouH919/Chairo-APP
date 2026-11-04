import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/lib/api';

/** Lives outside React so sign-out (in the auth store) can clear it. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // don't hammer the API on 4xx (not found, forbidden…), only on network/5xx
      retry: (count, e) => count < 2 && !(e instanceof ApiError && e.status >= 400 && e.status < 500),
    },
    // Fail now instead of pausing: replaying a booking or a cancel after reconnecting would surprise the user.
    mutations: { networkMode: 'always' },
  },
});

// Refetch stale data when the app returns to the foreground (the web build uses window focus).
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (s) => setFocused(s === 'active'));
    return () => sub.remove();
  });
}

// Pauses queries while offline and refetches on reconnect. `null` means "not known yet": assume online.
onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)));
