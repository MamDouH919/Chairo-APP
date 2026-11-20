import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge as GBadge } from '@/components/gluestack/badge';
import { Box } from '@/components/gluestack/box';
import { Divider as GDivider } from '@/components/gluestack/divider';
import { Pressable } from '@/components/gluestack/pressable';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Glass } from './glass';
import { ChevronForward, Icon } from './icon';
import { PressableScale } from './motion';
import { Text, type TextTone } from './text';

const cardStyle = tva({
  base: 'rounded-xl',
  variants: { padded: { true: 'p-4' }, tone: { surface: '', ink: 'bg-ink', muted: 'bg-muted' } },
});

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  tone?: 'surface' | 'ink' | 'muted';
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  tone = 'surface',
  style,
  className = '',
}: CardProps) {
  const shape = cardStyle({ padded, tone, class: className });
  const body =
    tone === 'surface' ? (
      <Glass className={shape} style={style}>
        {children}
      </Glass>
    ) : (
      <Box className={shape} style={style}>
        {children}
      </Box>
    );
  if (!onPress) return body;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      scaleTo={0.98}
      dim={0.92}>
      {body}
    </PressableScale>
  );
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
const BADGE: Record<BadgeTone, [string, TextTone]> = {
  neutral: ['bg-muted', 'textMuted'],
  primary: ['bg-secondary', 'onPrimarySoft'],
  success: ['bg-success-soft', 'success'],
  warning: ['bg-warning-soft', 'warning'],
  danger: ['bg-destructive-soft', 'danger'],
  info: ['bg-info-soft', 'info'],
  accent: ['bg-accent', 'accent'],
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: LucideIcon }) {
  const [bg, fg] = BADGE[tone];
  return (
    <GBadge variant="secondary" className={`${bg} gap-1 rounded-full px-2.5 py-0.5 self-start`}>
      {icon && <Icon icon={icon} size={14} tone={fg} />}
      <Text variant="overline" tone={fg} numberOfLines={1}>
        {label}
      </Text>
    </GBadge>
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
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={sublabel ? `${label}، ${sublabel}` : label}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.94}
      // selected = solid ink pill, the strongest mark in the glass language
      className={`min-h-12 min-w-20 items-center justify-center rounded-full border px-4 py-1 ${
        selected ? 'bg-foreground border-foreground' : 'bg-card border-foreground/10'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text variant="label" tone={selected ? 'inverse' : 'text'} align="center">
        {label}
      </Text>
      {sublabel && (
        <Text
          variant="overline"
          tone={selected ? 'inverse' : 'textSubtle'}
          align="center"
          className={selected ? 'opacity-75' : ''}>
          {sublabel}
        </Text>
      )}
    </PressableScale>
  );
}

const AVATAR_TINTS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'];

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  // Arabic letters join, so two initials read like a word ("مم"); use one letter for Arabic names.
  const words = name.trim().split(/\s+/);
  const initials = /[؀-ۿ]/.test(name)
    ? words[0][0]
    : words
        .slice(0, 2)
        .map((w) => w[0])
        .join('');
  const tint = AVATAR_TINTS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_TINTS.length];
  return (
    <Box
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`${tint} items-center justify-center`}
      // dynamic diameter: arbitrary sizes can't be expressed as static classes
      style={{ width: size, height: size, borderRadius: size / 2 }}>
      <Text variant={size > 44 ? 'heading' : 'label'} tone="white">
        {initials}
      </Text>
    </Box>
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
    <Box className="mb-3 flex-row items-end gap-3">
      <Box className="flex-1">
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {hint && (
          <Text variant="caption" tone="textSubtle">
            {hint}
          </Text>
        )}
      </Box>
      {action && (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={12} className="min-h-8 justify-center">
          <Text variant="label" tone="primary">
            {action.label}
          </Text>
        </Pressable>
      )}
    </Box>
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
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, value, subtitle].filter(Boolean).join('، ')}
      disabled={!onPress}
      onPress={onPress}
      className={`min-h-15 flex-row items-center gap-3 px-4 py-3 data-[active=true]:bg-glass-pressed ${
        last ? '' : 'border-b border-border'
      }`}>
      {icon && (
        <Box
          className={`h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-destructive-soft' : 'bg-muted'}`}>
          <Icon icon={icon} size="md" tone={danger ? 'danger' : 'textMuted'} />
        </Box>
      )}
      <Box className="flex-1">
        <Text variant="bodyStrong" tone={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="textSubtle">
            {subtitle}
          </Text>
        )}
      </Box>
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
  return <GDivider className="my-3" />;
}
