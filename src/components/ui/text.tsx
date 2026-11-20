import { Platform, type TextProps } from 'react-native';

import { Text as GText } from '@/components/gluestack/text';

export type TextVariant =
  'jumbo' | 'hero' | 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'overline';

export type TextTone =
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'primary'
  | 'primaryBright'
  | 'onPrimary'
  | 'danger'
  | 'success'
  | 'accent'
  | 'onInk'
  | 'onInkMuted'
  | 'onPrimarySoft'
  | 'warning'
  | 'info'
  | 'inverse'
  | 'ink'
  | 'white';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'start' | 'end' | 'center';
  className?: string;
}

/** Class strings are spelled out in full so Tailwind can see them. */
export const TONE_TEXT: Record<TextTone, string> = {
  text: 'text-foreground',
  textMuted: 'text-muted-foreground',
  textSubtle: 'text-subtle-foreground',
  primary: 'text-primary',
  primaryBright: 'text-primary-bright',
  onPrimary: 'text-primary-foreground',
  danger: 'text-destructive',
  success: 'text-success',
  accent: 'text-accent-foreground',
  onInk: 'text-ink-foreground',
  onInkMuted: 'text-ink-muted',
  onPrimarySoft: 'text-secondary-foreground',
  warning: 'text-warning',
  info: 'text-info',
  inverse: 'text-background',
  ink: 'text-ink',
  white: 'text-white',
};

/**
 * Native flips left/right in RTL, so 'left' already means "leading edge" there.
 * react-native-web resolves CSS-style 'start' / 'end' from the document direction.
 */
const ALIGN =
  Platform.OS === 'web'
    ? { start: 'text-start', end: 'text-end', center: 'text-center' }
    : { start: 'text-left', end: 'text-right', center: 'text-center' };

/** Always use this instead of RN <Text>: Arabic font per weight, theme colors, RTL-safe alignment. */
export function Text({ variant = 'body', tone = 'text', align = 'start', className, ...rest }: AppTextProps) {
  return (
    <GText
      maxFontSizeMultiplier={1.6}
      {...rest}
      size={variant}
      className={`${TONE_TEXT[tone]} ${ALIGN[align]} ${className ?? ''}`}
    />
  );
}
