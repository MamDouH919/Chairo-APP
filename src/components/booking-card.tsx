import { router } from 'expo-router';
import { CalendarClock, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ar } from '@/i18n/ar';
import type { Booking, BookingStatus } from '@/lib/api';
import { formatPrice, formatRelativeDay, formatTime } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

import { Avatar, Badge, Card, ChevronForward, Icon, Row, Skeleton, Text } from './ui';

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
  const { colors } = useTheme();
  const tz = b.shop.timezone;
  return (
    <Card
      onPress={() => open(b.id)}
      accessibilityLabel={`${b.service?.name ?? ''} مع ${b.barber.displayName}، ${formatRelativeDay(b.startsAt, tz)} ${formatTime(b.startsAt, tz)}، ${ar.bookings.status[b.status]}`}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <View style={[styles.dateTile, { backgroundColor: colors.primarySoft }]}>
          <Text variant="overline" tone="onPrimarySoft" align="center">
            {formatRelativeDay(b.startsAt, tz).split(' ')[0]}
          </Text>
          <Text variant="bodyStrong" tone="onPrimarySoft" align="center">
            {formatTime(b.startsAt, tz)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
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
        </View>
      </Row>
    </Card>
  );
}

/** The "your next appointment" hero on Home: ink card, high emphasis. */
export function NextBookingHero({ booking: b }: { booking: Booking }) {
  const tz = b.shop.timezone;
  return (
    <Card
      tone="ink"
      onPress={() => open(b.id)}
      accessibilityLabel={`${ar.home.nextBooking}: ${b.service?.name ?? ''} مع ${b.barber.displayName}، ${formatRelativeDay(b.startsAt, tz)} ${formatTime(b.startsAt, tz)}`}
      style={{ padding: space.xl }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="overline" tone="onInkMuted">
          {ar.home.nextBooking}
        </Text>
        <StatusBadge status={b.status} />
      </Row>
      <Row gap={space.md} style={{ marginTop: space.md }}>
        <Avatar name={b.barber.displayName} size={52} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" tone="onInk" numberOfLines={1}>
            {b.service?.name ?? '—'} {ar.book.with} {b.barber.displayName}
          </Text>
          <Row gap={space.xs}>
            <Icon icon={MapPin} size={14} tone="onInkMuted" />
            <Text variant="caption" tone="onInkMuted" numberOfLines={1}>
              {b.shop.name}
            </Text>
          </Row>
        </View>
        <Icon icon={ChevronForward} tone="onInkMuted" />
      </Row>
      <View style={styles.heroDivider} />
      <Row gap={space.sm}>
        <Icon icon={CalendarClock} size="md" tone="onInk" />
        <Text variant="bodyStrong" tone="onInk">
          {formatRelativeDay(b.startsAt, tz)}، {formatTime(b.startsAt, tz)}
        </Text>
      </Row>
    </Card>
  );
}

export function BookingCardSkeleton() {
  return (
    <Card>
      <Row gap={space.md}>
        <Skeleton width={72} height={64} radius={radius.md} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="80%" height={14} />
        </View>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  dateTile: {
    width: 76,
    minHeight: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: space.lg },
});
