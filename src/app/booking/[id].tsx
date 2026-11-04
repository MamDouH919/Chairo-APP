import { router, useLocalSearchParams } from 'expo-router';
import { CalendarClock, CircleAlert, MapPin, Scissors, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookingActionCard, RunningLateCard } from '@/components/booking-action-card';
import { StatusBadge } from '@/components/booking-card';
import { NoteSheet } from '@/components/note-sheet';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Sheet,
  Skeleton,
  Stack,
  Text,
  toast,
} from '@/components/ui';
import { useBooking, useBookingAction, useMyRecord } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type BookingDetail } from '@/lib/api';
import { canDispute, canReportLate } from '@/lib/booking-actions';
import { errorMessage } from '@/lib/errors';
import { formatDuration, formatPrice, formatRelativeDay, formatTime, timeAgo } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

export default function BookingDetails() {
  const { id, cancel: cancelParam } = useLocalSearchParams<{ id: string; cancel?: string }>();
  const q = useBooking(id);
  const record = useMyRecord().data;
  const [askCancel, setAskCancel] = useState(cancelParam === '1');
  const [sheet, setSheet] = useState<'dispute' | 'reportLate' | null>(null);

  const cancel = useBookingAction((bid: string) => api.bookings.cancel(bid));
  const dispute = useBookingAction((note: string) => api.bookings.dispute(id, note));
  const reportLate = useBookingAction((note: string) => api.bookings.reportLate(id, note || undefined));

  const header = <ScreenHeader title={ar.bookings.details} />;
  if (q.isPending) {
    return (
      <Screen header={header}>
        <Stack>
          <Skeleton height={180} radius={radius.xl} />
          <Skeleton height={220} radius={radius.xl} />
        </Stack>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen header={header}>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  const b = q.data;
  const tz = b.shop.timezone;
  // The API waives the penalty once the barber reports a delay, but isLateIfCancelledNow doesn't account for it.
  const lateCancel = b.isLateIfCancelledNow && !b.delayMin;
  const alreadyDisputed = [...(record?.active ?? []), ...(record?.history ?? [])].some(
    (s) => s.bookingId === b.id && s.appealStatus !== 'NONE',
  );

  // While the barber is late, RunningLateCard already offers both.
  const footer =
    !b.delayMin && (b.canReschedule || b.canCancel) ? (
      <Row gap={space.sm}>
        {b.canReschedule && (
          <View style={{ flex: 1 }}>
            <Button
              label={ar.bookings.reschedule}
              variant="outline"
              onPress={() => router.push({ pathname: '/reschedule/[id]', params: { id: b.id } })}
            />
          </View>
        )}
        {b.canCancel && (
          <View style={{ flex: 1 }}>
            <Button label={ar.bookings.cancelBooking} variant="danger" onPress={() => setAskCancel(true)} />
          </View>
        )}
      </Row>
    ) : undefined;

  return (
    <Screen header={header} footer={footer} refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Stack gap={space.xxl}>
        <RunningLateCard booking={b} onCancel={() => setAskCancel(true)} />
        <BookingActionCard booking={b} hideLate />

        <Card tone="ink" style={{ padding: space.xl, gap: space.lg }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <StatusBadge status={b.status} />
            <Text variant="caption" tone="onInkMuted">
              {ar.bookings.code}:{' '}
              <Text variant="bodyStrong" tone="onInk" style={{ letterSpacing: 2 }}>
                {b.code}
              </Text>
            </Text>
          </Row>
          <View>
            <Text variant="overline" tone="onInkMuted">
              {formatRelativeDay(b.startsAt, tz)}
            </Text>
            <Text variant="display" tone="onInk">
              {formatTime(b.startsAt, tz)}
            </Text>
          </View>
          <Row gap={space.md}>
            <Avatar name={b.barber.displayName} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" tone="onInk">
                {b.service?.name} {ar.book.with} {b.barber.displayName}
              </Text>
              <Text variant="caption" tone="onInkMuted">
                {formatDuration(b.durationMin)} · {formatPrice(b.priceEgp)}
              </Text>
            </View>
          </Row>
        </Card>

        <Card>
          <InfoRow
            icon={MapPin}
            label={ar.bookings.where}
            value={b.shop.name}
            sub={b.shop.address ?? undefined}
            onPress={() => router.push({ pathname: '/shop/[slug]', params: { slug: b.shop.slug } })}
          />
          <InfoRow icon={UserRound} label={ar.bookings.barber} value={b.barber.displayName} />
          <InfoRow icon={Scissors} label={ar.bookings.service} value={b.service?.name ?? '—'} />
          <InfoRow
            icon={CalendarClock}
            label={ar.bookings.when}
            value={`${formatRelativeDay(b.startsAt, tz)}، ${formatTime(b.startsAt, tz)} – ${formatTime(b.endsAt, tz)}`}
            last
          />
        </Card>

        {b.note ? (
          <View>
            <SectionHeader title={ar.book.note.replace(' (اختياري)', '')} />
            <Card tone="muted">
              <Text tone="textMuted">{b.note}</Text>
            </Card>
          </View>
        ) : null}

        {b.timeline.length > 0 && <Timeline booking={b} />}

        {canDispute(b) && !alreadyDisputed && (
          <Button label={ar.bookings.dispute} variant="secondary" onPress={() => setSheet('dispute')} />
        )}
        {canReportLate(b) && (
          <Button label={ar.bookings.reportLate} variant="outline" onPress={() => setSheet('reportLate')} />
        )}
      </Stack>

      {sheet === 'dispute' && (
        <NoteSheet
          title={ar.bookings.disputeTitle}
          hint={ar.bookings.disputeHint}
          label={ar.bookings.disputeLabel}
          loading={dispute.isPending}
          error={dispute.error}
          onClose={() => {
            setSheet(null);
            dispute.reset();
          }}
          onSubmit={(note) =>
            dispute.mutate(note, {
              onSuccess: () => {
                setSheet(null);
                toast(ar.bookings.disputeSent);
              },
            })
          }
        />
      )}
      {sheet === 'reportLate' && (
        <NoteSheet
          title={ar.bookings.reportLateTitle}
          hint={ar.bookings.reportLateHint}
          label={ar.bookings.reportLateLabel}
          optional
          loading={reportLate.isPending}
          error={reportLate.error}
          onClose={() => {
            setSheet(null);
            reportLate.reset();
          }}
          onSubmit={(note) =>
            reportLate.mutate(note, {
              onSuccess: () => {
                setSheet(null);
                toast(ar.bookings.reportLateSent);
              },
            })
          }
        />
      )}

      <CancelSheet
        visible={askCancel}
        late={lateCancel}
        loading={cancel.isPending}
        onClose={() => setAskCancel(false)}
        onConfirm={() =>
          cancel.mutate(b.id, {
            onSuccess: () => {
              setAskCancel(false);
              toast(ar.bookings.cancelled);
            },
            onError: (e) => toast(errorMessage(e), 'error'),
          })
        }
      />
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  sub,
  onPress,
  last,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.info,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon icon={icon} size="md" tone="textMuted" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="caption" tone="textSubtle">
          {label}
        </Text>
        <Text variant="bodyStrong" tone={onPress ? 'primary' : 'text'}>
          {value}
        </Text>
        {sub && (
          <Text variant="caption" tone="textMuted">
            {sub}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function Timeline({ booking }: { booking: BookingDetail }) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionHeader title={ar.bookings.timeline} />
      <Card>
        {booking.timeline.map((e, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center', width: 14 }}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === booking.timeline.length - 1 ? colors.primary : colors.borderStrong },
                ]}
              />
              {i < booking.timeline.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: i < booking.timeline.length - 1 ? space.lg : 0 }}>
              <Text variant="bodyStrong">{ar.bookings.status[e.toStatus]}</Text>
              <Text variant="caption" tone="textSubtle">
                {ar.bookings.actor[e.actorType]} · {timeAgo(e.at)}
              </Text>
            </View>
          </Row>
        ))}
      </Card>
    </View>
  );
}

function CancelSheet({
  visible,
  late,
  loading,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  late: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={[styles.sheetIcon, { backgroundColor: late ? colors.warningSoft : colors.dangerSoft }]}>
        <Icon icon={CircleAlert} size="xl" tone={late ? 'warning' : 'danger'} />
      </View>
      <Text variant="heading" align="center" accessibilityRole="header">
        {ar.bookings.cancelTitle}
      </Text>
      <Text tone={late ? 'warning' : 'textMuted'} align="center">
        {late ? ar.bookings.cancelLate : ar.bookings.cancelFree}
      </Text>
      <Stack gap={space.sm} style={{ alignSelf: 'stretch', marginTop: space.sm }}>
        <Button label={ar.bookings.cancelConfirm} variant="danger" loading={loading} onPress={onConfirm} />
        <Button label={ar.bookings.keep} variant="ghost" onPress={onClose} />
      </Stack>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  infoIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 7 },
  line: { width: 2, flex: 1, marginTop: 4 },
  sheetIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
