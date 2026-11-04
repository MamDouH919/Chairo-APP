import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { DayStrip, SlotGrid } from '@/components/booking-steps';
import { RestrictionNotice } from '@/components/restriction-notice';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  Skeleton,
  Stack,
  Text,
  toast,
} from '@/components/ui';
import { useAvailability, useBooking, useInvalidateBookings, useMyRecord, useShop } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type Slot } from '@/lib/api';
import { localDate } from '@/lib/dates';
import { errorCode, errorMessage } from '@/lib/errors';
import { formatRelativeDay, formatTime } from '@/lib/format';
import { radius, space } from '@/theme';

export default function Reschedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingQ = useBooking(id);
  const b = bookingQ.data;
  const shopQ = useShop(b?.shop.slug ?? '');
  const shop = shopQ.data;
  const sameDayOnly = useMyRecord().data?.restriction === 'SAME_DAY_ONLY';

  const [pickedBarber, setBarber] = useState<string>();
  const [pickedDate, setDate] = useState<string>();
  const [slot, setSlot] = useState<Slot>();
  const [tooLate, setTooLate] = useState(false);

  const barberId = pickedBarber ?? b?.barber.id;
  const today = localDate(new Date(), b?.shop.timezone ?? 'Africa/Cairo');
  const date = sameDayOnly ? today : (pickedDate ?? (b ? localDate(b.startsAt, b.shop.timezone) : today));
  const availability = useAvailability(b?.shop.slug ?? '', { serviceId: b?.service?.id, barberId, date });
  const invalidate = useInvalidateBookings();

  const save = useMutation({
    mutationFn: () =>
      api.bookings.reschedule(id, {
        startsAt: slot!.startsAt,
        barberId: barberId !== b!.barber.id ? barberId : undefined,
      }),
    onSuccess: async () => {
      await invalidate();
      toast(ar.bookings.rescheduled);
      router.back();
    },
    onError: (e) => {
      const code = errorCode(e);
      if (code === 'RESCHEDULE_TOO_LATE') return setTooLate(true);
      toast(errorMessage(e), 'error');
      if (['SLOT_TAKEN', 'SLOT_UNAVAILABLE', 'BARBER_UNAVAILABLE'].includes(code)) {
        setSlot(undefined);
        void availability.refetch();
      }
    },
  });

  const header = <ScreenHeader title={ar.bookings.reschedule} />;
  const error = bookingQ.error ?? shopQ.error;
  if (!b || !shop) {
    return (
      <Screen header={header}>
        {error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              void bookingQ.refetch();
              void shopQ.refetch();
            }}
          />
        ) : (
          <Stack>
            <Skeleton height={76} radius={radius.xl} />
            <Skeleton height={220} radius={radius.xl} />
          </Stack>
        )}
      </Screen>
    );
  }

  if (tooLate || !b.canReschedule) {
    return (
      <Screen header={header}>
        <Card tone="muted">
          <Stack>
            <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
              <Icon icon={CircleAlert} tone="warning" />
              <Text style={{ flex: 1 }}>{ar.bookings.rescheduleTooLate}</Text>
            </Row>
            {b.canCancel && (
              <Button
                label={ar.bookings.cancelInstead}
                variant="danger"
                size="md"
                onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: b.id, cancel: '1' } })}
              />
            )}
          </Stack>
        </Card>
      </Screen>
    );
  }

  const tz = b.shop.timezone;
  const team = shop.barbers.filter((x) => x.acceptsBookings && x.services.some((o) => o.serviceId === b.service?.id));

  return (
    <Screen
      header={header}
      footer={
        <Button
          label={ar.bookings.rescheduleConfirm}
          disabled={!slot}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      }>
      <Stack gap={space.xl}>
        <RestrictionNotice />

        <View>
          <Text variant="caption" tone="textSubtle">
            {ar.bookings.rescheduleCurrent}
          </Text>
          <Text variant="bodyStrong">
            {formatRelativeDay(b.startsAt, tz)}، {formatTime(b.startsAt, tz)} {ar.book.with} {b.barber.displayName}
          </Text>
        </View>

        {team.length > 1 && (
          <Stack gap={space.sm}>
            <Text variant="heading" accessibilityRole="header">
              {ar.book.chooseBarber}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs }}>
              {team.map((x) => (
                <Chip
                  key={x.id}
                  label={x.displayName}
                  selected={barberId === x.id}
                  onPress={() => {
                    setBarber(x.id);
                    setSlot(undefined);
                  }}
                />
              ))}
            </ScrollView>
          </Stack>
        )}

        <Stack gap={space.sm}>
          <Text variant="heading" accessibilityRole="header">
            {ar.book.chooseTime}
          </Text>
          <DayStrip
            shop={shop}
            value={date}
            sameDayOnly={sameDayOnly}
            onChange={(d) => {
              setDate(d);
              setSlot(undefined);
            }}
          />
        </Stack>

        <SlotGrid query={availability} tz={tz} value={slot?.startsAt} onChange={setSlot} />
      </Stack>
    </Screen>
  );
}
