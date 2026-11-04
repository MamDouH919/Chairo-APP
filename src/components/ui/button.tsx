import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { type Colors, hitTarget, radius, space, useTheme } from '@/theme';

import { Icon } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ink';

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
}

const palette = (c: Colors, v: Variant) =>
  ({
    primary: { bg: c.primary, bgPressed: c.primaryPressed, fg: 'onPrimary', border: c.primary },
    secondary: { bg: c.primarySoft, bgPressed: c.surfaceMuted, fg: 'onPrimarySoft', border: c.primarySoft },
    outline: { bg: c.surface, bgPressed: c.surfaceMuted, fg: 'text', border: c.borderStrong },
    ghost: { bg: 'transparent', bgPressed: c.surfaceMuted, fg: 'primary', border: 'transparent' },
    danger: { bg: c.dangerSoft, bgPressed: c.surfaceMuted, fg: 'danger', border: c.dangerSoft },
    ink: { bg: c.surfaceInk, bgPressed: c.text, fg: 'onInk', border: c.surfaceInk },
  })[v] as {
    bg: string;
    bgPressed: string;
    fg: 'onPrimary' | 'onPrimarySoft' | 'text' | 'primary' | 'danger' | 'onInk';
    border: string;
  };

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
}: ButtonProps) {
  const { colors } = useTheme();
  const p = palette(colors, variant);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: size === 'lg' ? 56 : hitTarget,
          paddingHorizontal: size === 'lg' ? space.xxl : space.lg,
          backgroundColor: pressed ? p.bgPressed : p.bg,
          borderColor: p.border,
          opacity: disabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[p.fg]} />
      ) : (
        <View style={[styles.row, iconPosition === 'end' && styles.rowReverse]}>
          {icon && <Icon icon={icon} tone={p.fg} size="md" />}
          <Text variant={size === 'lg' ? 'bodyStrong' : 'label'} tone={p.fg} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: LucideIcon;
  label: string; // required: icon-only controls need an accessible name
  onPress?: () => void;
  variant?: 'surface' | 'ghost' | 'ink';
  badge?: boolean;
}

export function IconButton({ icon, label, onPress, variant = 'surface', badge }: IconButtonProps) {
  const { colors } = useTheme();
  const bg = { surface: colors.surface, ghost: 'transparent', ink: 'rgba(255,255,255,0.12)' }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: pressed ? colors.surfaceMuted : bg,
          borderColor: variant === 'surface' ? colors.border : 'transparent',
        },
      ]}>
      <Icon icon={icon} tone={variant === 'ink' ? 'onInk' : 'text'} size="md" />
      {badge && <View style={[styles.dot, { backgroundColor: colors.danger, borderColor: colors.surface }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowReverse: { flexDirection: 'row-reverse' },
  iconBtn: {
    width: hitTarget - 4,
    height: hitTarget - 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dot: { position: 'absolute', top: 9, end: 10, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
