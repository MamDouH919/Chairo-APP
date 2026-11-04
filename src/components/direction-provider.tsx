import type { ReactNode } from 'react';

/** Native RTL comes from the expo-localization `forcesRTL` config plugin; nothing to do here. */
export function DirectionProvider({ children }: { children: ReactNode }) {
  return children;
}
