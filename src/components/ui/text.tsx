import { Platform, Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { type Colors, type as typeScale, type TypeVariant, useTheme } from '@/theme';

type Tone = keyof Pick<
  Colors,
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'primary'
  | 'onPrimary'
  | 'danger'
  | 'success'
  | 'accent'
  | 'onInk'
  | 'onInkMuted'
  | 'onPrimarySoft'
  | 'warning'
  | 'info'
>;

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: 'start' | 'end' | 'center';
}

/**
 * Native flips textAlign left/right in RTL, so 'left' already means "leading edge" there.
 * react-native-web resolves CSS-style 'start' / 'end' from DirectionProvider.
 */
const ALIGN: Record<NonNullable<AppTextProps['align']>, TextStyle['textAlign']> = Platform.OS === 'web'
  ? ({ start: 'start', end: 'end', center: 'center' } as unknown as Record<string, TextStyle['textAlign']>)
  : { start: 'left', end: 'right', center: 'center' };

/** Always use this instead of RN <Text>: Arabic font per weight, theme colors, RTL-safe alignment. */
export function Text({ variant = 'body', tone = 'text', align = 'start', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[typeScale[variant], { color: colors[tone], textAlign: ALIGN[align] }, style]}
    />
  );
}
