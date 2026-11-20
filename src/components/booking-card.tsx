import { router } from 'expo-router';
import { Clock, MapPin } from 'lucide-react-native';

import { Box } from '@/components/gluestack/box';
import { ar } from '@/i18n/ar';
import type { Booking, BookingStatus } from '@/lib/api';
import { formatCountdown, formatPrice, formatRelativeDay, formatTime } from '@/lib/format';
import { radius, useTheme } from '@/theme';

import { Avatar, Badge, Card, ChevronForward, Glow, Icon, Row, Skeleton, Text } from './ui';

const STATUS_TONE: Record<BookingStatus, 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  BOOKED: 'primary',
  CONFIRMED: 'success',
  UNCONFIRMED: 'warning',
  ARRIVED: 'info',
  IN_PROGRESS: 'info',
  DONE: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

export const StatusBadge = ({ status }: { status: BookingStatus }) => (
  <Badge label={ar.bookings.status[status]} tone={STATUS_TONE[status]} />
);

const open = (id: string) => router.push({ pathname: '/booking/[id]', params: { id } });

export function BookingCard({ booking: b }: { booking: Booking }) {
  const tz = b.shop.timezone;
  return (
    <Card
      onPress={() => open(b.id)}
      accessibilityLabel={`${b.service?.name ?? ''} مع ${b.barber.displayName}، ${formatRelativeDay(b.startsAt, tz)} ${formatTime(b.startsAt, tz)}، ${ar.bookings.status[b.status]}`}>
      <Row className="items-start gap-3">
        <Box className="min-h-16 w-19 items-center justify-center rounded-md bg-primary/10 py-2">
          <Text variant="overline" tone="onPrimarySoft" align="center">
            {formatRelativeDay(b.startsAt, tz).split(' ')[0]}
          </Text>
          <Text variant="bodyStrong" tone="onPrimarySoft" align="center">
            {formatTime(b.startsAt, tz)}
          </Text>
        </Box>
        <Box className="flex-1 gap-0.5">
          <Row className="justify-between">
            <Text variant="bodyStrong" numberOfLines={1} className="flex-1">
              {b.service?.name ?? '—'}
            </Text>
            <StatusBadge status={b.status} />
          </Row>
          <Text variant="caption" tone="textMuted" numberOfLines={1}>
            {ar.book.with} {b.barber.displayName} · {b.shop.name}
          </Text>
          <Text variant="caption" tone="textSubtle">
            {formatRelativeDay(b.startsAt, tz)} · {formatPrice(b.priceEgp)}
          </Text>
        </Box>
      </Row>
    </Card>
  );
}

/** The "your next appointment" hero on Home: ink card with a teal glow, the time as the headline. */
export function NextBookingHero({ booking: b }: { booking: Booking }) {
  // the glow is an SVG gradient, which needs a concrete color value
  const { colors } = useTheme();
  const tz = b.shop.timezone;
  const countdown = formatCountdown(b.startsAt);
  return (
    <Card
      tone="ink"
      padded={false}
      onPress={() => open(b.id)}
      accessibilityLabel={`${ar.home.nextBooking}: ${b.service?.name ?? ''} مع ${b.barber.displayName}، ${formatRelativeDay(b.startsAt, tz)} ${formatTime(b.startsAt, tz)}`}
      className="overflow-hidden rounded-2xl p-5">
      <Glow color={colors.primaryBright} className="-top-42.5 -end-32.5 h-85 w-85" />
      <Row className="justify-between">
        <Text variant="overline" tone="primaryBright">
          {ar.home.nextBooking}
        </Text>
        {countdown ? (
          <Row className="h-7.5 gap-1 rounded-full bg-ink-foreground/12 px-3">
            <Icon icon={Clock} size={14} tone="onInk" />
            <Text variant="caption" tone="onInk">
              {countdown}
            </Text>
          </Row>
        ) : (
          <StatusBadge status={b.status} />
        )}
      </Row>
      <Row className="mt-3 justify-between">
        <Box className="flex-1">
          <Text variant="hero" tone="onInk">
            {formatTime(b.startsAt, tz)}
          </Text>
          <Text variant="caption" tone="onInkMuted">
            {formatRelativeDay(b.startsAt, tz)}
          </Text>
        </Box>
        <Avatar name={b.barber.displayName} size={56} />
      </Row>
      <Row className="mt-4 gap-3 rounded-xl border border-ink-foreground/12 bg-ink-foreground/8 p-3 ps-4">
        <Box className="flex-1">
          <Text variant="bodyStrong" tone="onInk" numberOfLines={1}>
            {b.shop.name}
          </Text>
          <Text variant="caption" tone="onInkMuted" numberOfLines={1}>
            {b.barber.displayName} · {b.service?.name ?? '—'}
          </Text>
        </Box>
        <Box className="h-10 w-10 items-center justify-center rounded-full bg-ink-foreground/12">
          <Icon icon={MapPin} size={18} tone="onInk" />
        </Box>
        <Icon icon={ChevronForward} tone="onInkMuted" />
      </Row>
    </Card>
  );
}

export function BookingCardSkeleton() {
  return (
    <Card>
      <Row className="gap-3">
        <Skeleton width={72} height={64} radius={radius.md} />
        <Box className="flex-1 gap-2">
          <Skeleton width="55%" height={18} />
          <Skeleton width="80%" height={14} />
        </Box>
      </Row>
    </Card>
  );
}
