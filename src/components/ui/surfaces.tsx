import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { type Colors, elevation, hitTarget, radius, space, useTheme } from '@/theme';

import { ChevronForward, Icon } from './icon';
import { Text } from './text';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  tone?: 'surface' | 'ink' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, accessibilityLabel, padded = true, tone = 'surface', style }: CardProps) {
  const { colors } = useTheme();
  const bg = { surface: colors.surface, ink: colors.surfaceInk, muted: colors.surfaceMuted }[tone];
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: bg, borderColor: tone === 'surface' ? colors.border : 'transparent' },
    tone === 'surface' && elevation(colors),
    padded && { padding: space.lg },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.88 }]}>
      {children}
    </Pressable>
  );
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
const badgeColors = (c: Colors, t: BadgeTone) =>
  ({
    neutral: [c.surfaceMuted, 'textMuted'],
    primary: [c.primarySoft, 'onPrimarySoft'],
    success: [c.successSoft, 'success'],
    warning: [c.warningSoft, 'warning'],
    danger: [c.dangerSoft, 'danger'],
    info: [c.infoSoft, 'info'],
    accent: [c.accentSoft, 'accent'],
  })[t] as [string, 'textMuted' | 'onPrimarySoft' | 'success' | 'warning' | 'danger' | 'info' | 'accent'];

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: LucideIcon }) {
  const { colors } = useTheme();
  const [bg, fg] = badgeColors(colors, tone);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && <Icon icon={icon} size={14} tone={fg} />}
      <Text variant="overline" tone={fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  sublabel,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  sublabel?: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={sublabel ? `${label}، ${sublabel}` : label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : pressed ? colors.surfaceMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <Text variant="label" tone={selected ? 'onPrimary' : 'text'} align="center">
        {label}
      </Text>
      {sublabel && (
        <Text variant="overline" tone={selected ? 'onPrimary' : 'textSubtle'} align="center">
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}

const AVATAR_TINTS = ['#0F766E', '#B45309', '#1D4ED8', '#7C3AED', '#BE185D', '#0369A1'];

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  // Arabic letters join, so two initials read like a word ("مم"); use one letter for Arabic names.
  const words = name.trim().split(/\s+/);
  const initials = /[\u0600-\u06FF]/.test(name)
    ? words[0][0]
    : words
        .slice(0, 2)
        .map((w) => w[0])
        .join('');
  const tint = AVATAR_TINTS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_TINTS.length];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text variant={size > 44 ? 'heading' : 'label'} style={{ color: '#FFFFFF' }}>
        {initials}
      </Text>
    </View>
  );
}

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.section}>
      <View style={{ flex: 1 }}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {hint && (
          <Text variant="caption" tone="textSubtle">
            {hint}
          </Text>
        )}
      </View>
      {action && (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={12} style={styles.sectionAction}>
          <Text variant="label" tone="primary">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  danger,
  last,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, value, subtitle].filter(Boolean).join('، ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceMuted }]}>
          <Icon icon={icon} size="md" tone={danger ? 'danger' : 'textMuted'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" tone={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="textSubtle">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="label" tone="textMuted">
          {value}
        </Text>
      )}
      {onPress && !danger && <Icon icon={ChevronForward} size="md" tone="textSubtle" />}
    </Pressable>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.md }} />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chip: {
    minHeight: hitTarget,
    minWidth: 76,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.md },
  sectionAction: { minHeight: 32, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
