import { CalendarX2, Check, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ar } from '@/i18n/ar';
import type { Availability, PublicBarber, PublicShop, Slot } from '@/lib/api';
import { addDays, localDate, weekdayOf } from '@/lib/dates';
import { formatDayMonth, formatDuration, formatPrice, formatRating, formatTime, formatWeekday } from '@/lib/format';
import { hitTarget, radius, space, useTheme } from '@/theme';

import { Avatar, Chip, EmptyState, ErrorState, Icon, Row, Skeleton, Stack, Text } from './ui';

// ── stepper ──────────────────────────────────────────────────────────────

export function Stepper({ step }: { step: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.stepper}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: ar.book.steps.length,
        now: step + 1,
        text: `${ar.book.steps[step]} (${step + 1}/${ar.book.steps.length})`,
      }}>
      {ar.book.steps.map((label, i) => (
        <View key={label} style={{ flex: 1, gap: space.xs }}>
          <View style={[styles.stepBar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
          <Text variant="overline" tone={i === step ? 'primary' : i < step ? 'text' : 'textSubtle'}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── selectable row ───────────────────────────────────────────────────────

function OptionRow({
  selected,
  onPress,
  title,
  subtitle,
  trailing,
  leading,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  trailing?: string;
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={[title, subtitle, trailing].filter(Boolean).join('، ')}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="textSubtle" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing && (
        <Text variant="bodyStrong" tone="primary">
          {trailing}
        </Text>
      )}
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? colors.primary : colors.borderStrong,
            backgroundColor: selected ? colors.primary : 'transparent',
          },
        ]}>
        {selected && <Icon icon={Check} size={14} tone="onPrimary" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

// ── step 1: service ──────────────────────────────────────────────────────

export function ServiceStep({
  shop,
  barber,
  value,
  onChange,
}: {
  shop: PublicShop;
  barber?: PublicBarber;
  value?: string;
  onChange: (id: string) => void;
}) {
  // A preselected barber may override price/duration, and may not offer every service.
  const items = barber
    ? barber.services.map((o) => ({ id: o.serviceId, name: o.name, durationMin: o.durationMin, priceEgp: o.priceEgp }))
    : shop.services;
  return (
    <Stack gap={space.sm}>
      <Text variant="title" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        {ar.book.chooseService}
      </Text>
      {items.map((s) => (
        <OptionRow
          key={s.id}
          selected={value === s.id}
          onPress={() => onChange(s.id)}
          title={s.name}
          subtitle={formatDuration(s.durationMin)}
          trailing={formatPrice(s.priceEgp)}
        />
      ))}
    </Stack>
  );
}

// ── step 2: barber ───────────────────────────────────────────────────────

export function BarberStep({
  shop,
  serviceId,
  value,
  onChange,
}: {
  shop: PublicShop;
  serviceId: string;
  value?: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const team = shop.barbers.filter((b) => b.services.some((o) => o.serviceId === serviceId));
  return (
    <Stack gap={space.sm}>
      <Text variant="title" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        {ar.book.chooseBarber}
      </Text>
      <OptionRow
        selected={value === 'any'}
        onPress={() => onChange('any')}
        title={ar.book.anyBarber}
        subtitle={ar.book.anyBarberHint}
        leading={
          <View style={[styles.anyIcon, { backgroundColor: colors.primarySoft }]}>
            <Icon icon={Users} tone="primary" />
          </View>
        }
      />
      {team.map((b) => {
        const offer = b.services.find((o) => o.serviceId === serviceId)!;
        return (
          <OptionRow
            key={b.id}
            selected={value === b.id}
            disabled={!b.acceptsBookings}
            onPress={() => onChange(b.id)}
            title={b.displayName}
            subtitle={b.acceptsBookings ? `★ ${formatRating(b.ratingAvg)} · ${b.bio ?? ''}` : ar.shop.notAccepting}
            trailing={formatPrice(offer.priceEgp)}
            leading={<Avatar name={b.displayName} size={44} />}
          />
        );
      })}
    </Stack>
  );
}

// ── step 3: date + time ──────────────────────────────────────────────────

export function DayStrip({
  shop,
  value,
  onChange,
  sameDayOnly,
}: {
  shop: PublicShop;
  value: string;
  onChange: (d: string) => void;
  /** the customer's SAME_DAY_ONLY restriction: only today is offered */
  sameDayOnly?: boolean;
}) {
  const days = useMemo(() => {
    const today = localDate(new Date(), shop.timezone);
    const length = sameDayOnly ? 1 : Math.max(1, shop.maxAdvanceDays) + 1;
    return Array.from({ length }, (_, i) => addDays(today, i));
  }, [shop.timezone, shop.maxAdvanceDays, sameDayOnly]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs }}>
      {days.map((d, i) => {
        const noon = `${d}T10:00:00.000Z`; // safe instant inside that local day
        const closed = shop.hours.find((h) => h.weekday === weekdayOf(d))?.isClosed ?? false;
        const label = i === 0 ? ar.common.today : i === 1 ? ar.common.tomorrow : formatWeekday(noon, shop.timezone);
        return (
          <Chip
            key={d}
            label={label}
            sublabel={closed ? ar.shop.closed : formatDayMonth(noon, shop.timezone)}
            selected={value === d}
            disabled={closed}
            onPress={() => onChange(d)}
          />
        );
      })}
    </ScrollView>
  );
}

const PERIODS = [
  { key: 'morning', from: 5, to: 12 },
  { key: 'afternoon', from: 12, to: 17 },
  { key: 'evening', from: 17, to: 24 },
  { key: 'lateNight', from: 0, to: 5 },
] as const;

const localHour = (iso: string, tz: string) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));

export function SlotGrid({
  query,
  tz,
  value,
  onChange,
}: {
  query: {
    data?: Availability;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
    isFetching: boolean;
  };
  tz: string;
  value?: string;
  onChange: (s: Slot) => void;
}) {
  if (query.isPending) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} width="31%" height={hitTarget} radius={radius.md} />
        ))}
      </View>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  const slots = query.data?.slots ?? [];
  if (!slots.length) return <EmptyState icon={CalendarX2} title={ar.book.noSlots} hint={ar.book.noSlotsHint} />;

  const groups = PERIODS.map((p) => ({
    ...p,
    slots: slots.filter((s) => {
      const h = localHour(s.startsAt, tz);
      return h >= p.from && h < p.to;
    }),
  })).filter((g) => g.slots.length);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: space.xl, opacity: query.isFetching ? 0.6 : 1 }}>
      {groups.map((g) => (
        <View key={g.key} style={{ gap: space.sm }}>
          <Text variant="label" tone="textMuted">
            {ar.book.periods[g.key]}
          </Text>
          <View style={styles.grid}>
            {g.slots.map((s) => (
              <View key={s.startsAt} style={{ width: '31%' }}>
                <Chip label={formatTime(s.startsAt, tz)} selected={value === s.startsAt} onPress={() => onChange(s)} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

export function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={strong ? 'text' : 'textMuted'}>
        {label}
      </Text>
      <Text
        variant={strong ? 'heading' : 'bodyStrong'}
        tone={strong ? 'primary' : 'text'}
        style={{ flexShrink: 1 }}
        numberOfLines={2}>
        {value}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  stepBar: { height: 4, borderRadius: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 68,
    padding: space.lg,
    borderRadius: radius.lg,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  anyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'flex-start' },
});
