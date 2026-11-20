import { CalendarX2, Check, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';

import { ar } from '@/i18n/ar';
import type { Availability, PublicBarber, PublicShop, Slot } from '@/lib/api';
import { addDays, localDate, weekdayOf } from '@/lib/dates';
import { formatDayMonth, formatDuration, formatPrice, formatRating, formatTime, formatWeekday } from '@/lib/format';
import { hitTarget, radius } from '@/theme';

import { Avatar, Chip, EmptyState, ErrorState, Icon, Row, Skeleton, Stack, Text } from './ui';

const AView = withUniwind(Animated.View);

// ── stepper ──────────────────────────────────────────────────────────────

export function Stepper({ step }: { step: number }) {
  const total = ar.book.steps.length;
  return (
    <Box
      className="w-full max-w-170 gap-2 self-center px-5 pb-3"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step + 1, text: `${ar.book.steps[step]} (${step + 1}/${total})` }}>
      <Box className="flex-row gap-1.5">
        {ar.book.steps.map((label, i) => (
          <Box
            key={label}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'} ${i < step ? 'opacity-50' : ''}`}
          />
        ))}
      </Box>
      <Row className="justify-between">
        <Text variant="overline" tone="textSubtle">
          {ar.book.stepOf(step + 1, total)}
        </Text>
        <Text variant="overline" tone="primary">
          {ar.book.steps[step]}
        </Text>
      </Row>
    </Box>
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
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={[title, subtitle, trailing].filter(Boolean).join('، ')}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-17 flex-row items-center gap-3 rounded-xl p-4 ${
        selected
          ? 'border-2 border-primary bg-secondary'
          : 'border border-foreground/10 bg-card data-[active=true]:bg-glass-pressed'
      } ${disabled ? 'opacity-50' : ''}`}>
      {leading}
      <Box className="flex-1">
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="textSubtle" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailing && (
        <Text variant="bodyStrong" tone="primary">
          {trailing}
        </Text>
      )}
      <Box
        className={`h-5.5 w-5.5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary bg-primary' : 'border-border-strong'
        }`}>
        {selected && <Icon icon={Check} size={14} tone="onPrimary" strokeWidth={3} />}
      </Box>
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
    <Stack className="gap-2">
      <Text variant="title" accessibilityRole="header" className="mb-2">
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
  const team = shop.barbers.filter((b) => b.services.some((o) => o.serviceId === serviceId));
  return (
    <Stack className="gap-2">
      <Text variant="title" accessibilityRole="header" className="mb-2">
        {ar.book.chooseBarber}
      </Text>
      <OptionRow
        selected={value === 'any'}
        onPress={() => onChange('any')}
        title={ar.book.anyBarber}
        subtitle={ar.book.anyBarberHint}
        leading={
          <Box className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
            <Icon icon={Users} tone="primary" />
          </Box>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
      {days.map((d, i) => {
        const noon = `${d}T10:00:00.000Z`; // safe instant inside that local day
        const closed = shop.hours.find((h) => h.weekday === weekdayOf(d))?.isClosed ?? false;
        const label = i === 0 ? ar.common.today : i === 1 ? ar.common.tomorrow : formatWeekday(noon, shop.timezone);
        return (
          <DayTile
            key={d}
            label={label}
            day={closed ? ar.shop.closed : formatDayMonth(noon, shop.timezone)}
            selected={value === d}
            disabled={closed}
            onPress={() => onChange(d)}
          />
        );
      })}
    </ScrollView>
  );
}

/** Tall rounded tile: weekday on top, the date as the big number. Selected = solid ink. */
function DayTile({
  label,
  day,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  day: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${label}، ${day}`}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-19 min-w-18 items-center justify-center gap-0.5 rounded-xl border px-3 ${
        selected
          ? 'border-foreground bg-foreground'
          : 'border-foreground/10 bg-card data-[active=true]:bg-glass-pressed'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text
        variant="overline"
        tone={selected ? 'inverse' : 'textSubtle'}
        align="center"
        numberOfLines={1}
        className={selected ? 'opacity-75' : ''}>
        {label}
      </Text>
      <Text variant="bodyStrong" tone={selected ? 'inverse' : 'text'} align="center" numberOfLines={1}>
        {day}
      </Text>
    </Pressable>
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
      <Box className="flex-row flex-wrap justify-start gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} width="31%" height={hitTarget} radius={radius.md} />
        ))}
      </Box>
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
    <AView entering={FadeIn.duration(200)} className={`gap-5 ${query.isFetching ? 'opacity-60' : ''}`}>
      {groups.map((g) => (
        <Box key={g.key} className="gap-2">
          <Text variant="label" tone="textMuted">
            {ar.book.periods[g.key]}
          </Text>
          <Box className="flex-row flex-wrap justify-start gap-2">
            {g.slots.map((s) => (
              // three per row: a percentage width can't be a static class
              <Box key={s.startsAt} style={{ width: '31%' }}>
                <Chip label={formatTime(s.startsAt, tz)} selected={value === s.startsAt} onPress={() => onChange(s)} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </AView>
  );
}

export function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row className="justify-between py-1">
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={strong ? 'text' : 'textMuted'}>
        {label}
      </Text>
      <Text
        variant={strong ? 'heading' : 'bodyStrong'}
        tone={strong ? 'primary' : 'text'}
        className="shrink"
        numberOfLines={2}>
        {value}
      </Text>
    </Row>
  );
}
