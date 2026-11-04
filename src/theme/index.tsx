import { useColorScheme } from 'react-native';

import { palettes, type Colors } from './tokens';

export * from './tokens';

export function useTheme(): { colors: Colors; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: palettes[scheme], scheme };
}
