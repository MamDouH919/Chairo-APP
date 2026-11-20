import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { Platform, type ViewStyle } from 'react-native';

import { Box } from '@/components/gluestack/box';
import { Button as GButton, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/gluestack/button';

import { Glass } from './glass';
import { Icon } from './icon';
import { PressableScale } from './motion';

type Variant = 'primary' | 'secondary' | 'outline' | 'glass' | 'ghost' | 'danger' | 'ink';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'start',
  loading,
  disabled,
  fullWidth = true,
  haptic = variant === 'primary',
  accessibilityHint,
  style,
  className = '',
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <GButton
      variant={variant}
      size={size}
      isDisabled={!!inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={style}
      // footers sit on a solid page color, so a faded button keeps its identity without bleed-through
      className={`${fullWidth ? 'self-stretch' : 'self-start'} ${iconPosition === 'end' ? 'flex-row-reverse' : ''} ${
        variant === 'primary' && !disabled ? 'shadow-lg shadow-primary/35' : ''
      } ${className}`}>
      {loading ? (
        <ButtonSpinner />
      ) : (
        <>
          {icon && <ButtonIcon as={icon} />}
          <ButtonText numberOfLines={1}>{label}</ButtonText>
        </>
      )}
    </GButton>
  );
}

interface IconButtonProps {
  icon: LucideIcon;
  label: string; // required: icon-only controls need an accessible name
  onPress?: () => void;
  /** surface/glass: frosted circle (native Liquid Glass on iOS 26); ghost: bare icon; ink: on dark heroes */
  variant?: 'surface' | 'glass' | 'ghost' | 'ink';
  badge?: boolean;
}

export function IconButton({ icon, label, onPress, variant = 'surface', badge }: IconButtonProps) {
  const frosted = variant === 'surface' || variant === 'glass';
  const dot = badge && (
    <Box className="absolute end-3 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-destructive" />
  );
  const glyph = <Icon icon={icon} tone={variant === 'ink' ? 'onInk' : 'text'} size="md" />;
  const circle = 'h-12 w-12 items-center justify-center rounded-full';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      scaleTo={0.9}
      dim={0.8}>
      {frosted ? (
        <Glass layer="chrome" interactive className={circle}>
          {glyph}
          {dot}
        </Glass>
      ) : (
        <Box className={`${circle} ${variant === 'ink' ? 'bg-ink-foreground/10' : ''}`}>
          {glyph}
          {dot}
        </Box>
      )}
    </PressableScale>
  );
}
