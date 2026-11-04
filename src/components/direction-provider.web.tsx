import type { ReactNode } from 'react';
// react-native-web resolves start/end (insets, padding, textAlign) from this context, not from <html dir>.
// @ts-expect-error internal module without type declarations
import { LocaleProvider } from 'react-native-web/dist/modules/useLocale';

export function DirectionProvider({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider direction="rtl" locale="ar">
      {children}
    </LocaleProvider>
  );
}
