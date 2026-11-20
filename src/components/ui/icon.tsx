import { ChevronLeft, ChevronRight, type LucideIcon, type LucideProps } from 'lucide-react-native';
import { I18nManager, Platform } from 'react-native';

import { Icon as GIcon } from '@/components/gluestack/icon';
import { iconSize, iconStroke } from '@/theme';

import { TONE_TEXT, type TextTone } from './text';

export interface IconProps extends Omit<LucideProps, 'color' | 'size'> {
  icon: LucideIcon;
  size?: keyof typeof iconSize | number;
  tone?: TextTone;
  className?: string;
}

/** Native-only a11y props; on web the SVG gets aria-hidden instead. */
const hidden =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as object)
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

/** One icon family (Lucide), one stroke width, sizes from tokens. Decorative by default. */
export function Icon({ icon, size = 'md', tone = 'text', className, ...rest }: IconProps) {
  return (
    <GIcon
      as={icon}
      size={typeof size === 'number' ? size : iconSize[size]}
      strokeWidth={iconStroke}
      className={`${TONE_TEXT[tone]} ${className ?? ''}`}
      {...hidden}
      {...(rest as object)}
    />
  );
}

/** Web layout is RTL via <html dir="rtl">, which I18nManager doesn't know about. */
const RTL = I18nManager.isRTL || Platform.OS === 'web';

/** "Forward" / "back" chevrons that point the right way in RTL. */
export const ChevronForward: LucideIcon = RTL ? ChevronLeft : ChevronRight;
export const ChevronBack: LucideIcon = RTL ? ChevronRight : ChevronLeft;
