import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BarberStep, DayStrip, ServiceStep, SlotGrid, Stepper, SummaryLine } from '@/components/booking-steps';
import { RestrictionNotice } from '@/components/restriction-notice';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  Skeleton,
  Stack,
  Text,
  TextField,
  toast,
} from '@/components/ui';
import { useAvailability, useInvalidateBookings, useMyRecord, useShop } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type Slot } from '@/lib/api';
import { localDate } from '@/lib/dates';
import { firstOpenDay } from '@/lib/hours';
import { errorCode, errorMessage } from '@/lib/errors';
import { formatDuration, formatPrice, formatRelativeDay, formatTime } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { space } from '@/theme';

export default function BookFlow() {
  const params = useLocalSearchParams<{ slug: string; serviceId?: string; barberId?: string }>();
  const shopQ = useShop(params.slug);
  const shop = shopQ.data;

  const [serviceId, setServiceId] = useState(params.serviceId);
  const [barberId, setBarberId] = useState(params.barberId);
  const [step, setStep] = useState(params.serviceId ? (params.barberId ? 2 : 1) : 0);
  const [pickedDate, setDate] = useState<string>();
  const sameDayOnly = useMyRecord().data?.restriction === 'SAME_DAY_ONLY';
  const today = localDate(new Date(), shop?.timezone ?? 'Africa/Cairo');
  // Until the user picks a day, use the first day the shop is open (today may be its day off).
  const date = sameDayOnly
    ? today
    : (pickedDate ?? (shop ? firstOpenDay(shop.hours, shop.timezone, shop.maxAdvanceDays) : today));
  const [slot, setSlot] = useState<Slot>();
  const [note, setNote] = useState('');

  const availability = useAvailability(params.slug, { serviceId, barberId: barberId ?? 'any', date });
  const invalidate = useInvalidateBookings();

  // One key per (selection) so a network retry of the same tap never books twice.
  const idemKey = useMemo(() => Crypto.randomUUID(), [serviceId, barberId, slot?.startsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useMutation({
    mutationFn: async () => {
      const input = {
        shopId: shop!.id,
        serviceId: serviceId!,
        barberId: barberId ?? 'any',
        startsAt: slot!.startsAt,
        note: note.trim() || undefined,
      };
      const auth = useAuth.getState();
      // Tapping "confirm" under the visible policy summary is the acceptance (POST /me/policy/accept).
      if (!auth.policyAccepted) {
        await api.me.acceptPolicy();
        await auth.markPolicyAccepted();
      }
      try {
        return await api.bookings.create(input, idemKey);
      } catch (e) {
        if (errorCode(e) !== 'POLICY_NOT_ACCEPTED') throw e;
        await api.me.acceptPolicy();
        await auth.markPolicyAccepted();
        return api.bookings.create(input, idemKey);
      }
    },
    onSuccess: async (b) => {
      await invalidate();
      router.replace({ pathname: '/book/success', params: { id: b.id } });
    },
    onError: (e) => {
      toast(errorMessage(e), 'error');
      if (['SLOT_TAKEN', 'SLOT_UNAVAILABLE', 'BARBER_UNAVAILABLE'].includes(errorCode(e))) {
        setSlot(undefined);
        setStep(2);
        void availability.refetch();
      }
    },
  });

  // Came from a barber card: the barber is already chosen, so the barber step is skipped both ways.
  const skipBarber = !!params.barberId && !params.serviceId;
  const goNext = () => setStep(step === 0 && skipBarber ? 2 : step + 1);
  const goBack = () => (step === 0 ? router.back() : setStep(step === 2 && skipBarber ? 0 : step - 1));

  if (!shop) {
    return (
      <Screen header={<ScreenHeader onBack={() => router.back()} />}>
        {shopQ.isError ? (
          <ErrorState error={shopQ.error} onRetry={() => shopQ.refetch()} />
        ) : (
          <Stack>
            <Skeleton height={68} radius={16} />
            <Skeleton height={68} radius={16} />
            <Skeleton height={68} radius={16} />
          </Stack>
        )}
      </Screen>
    );
  }

  const service = shop.services.find((s) => s.id === serviceId);
  const barber = barberId && barberId !== 'any' ? shop.barbers.find((b) => b.id === barberId) : undefined;
  const offer = barber?.services.find((o) => o.serviceId === serviceId);
  const price = offer?.priceEgp ?? availability.data?.priceEgp ?? service?.priceEgp ?? 0;
  const duration = offer?.durationMin ?? service?.durationMin ?? 0;

  const canNext = [!!serviceId, !!barberId, !!slot, true][step];
  const footer =
    step < 3 ? (
      <Row gap={space.md}>
        {step === 2 && slot && (
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="textSubtle">
              {formatRelativeDay(slot.startsAt, shop.timezone)}
            </Text>
            <Text variant="bodyStrong">{formatTime(slot.startsAt, shop.timezone)}</Text>
          </View>
        )}
        <View style={{ flex: step === 2 && slot ? 1.4 : 1 }}>
          <Button label={ar.common.continue} disabled={!canNext} onPress={goNext} />
        </View>
      </Row>
    ) : (
      <Button
        label={`${ar.book.confirm} · ${formatPrice(price)}`}
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
    );

  return (
    <Screen
      keyboard={step === 3}
      header={
        <View>
          <ScreenHeader title={shop.name} onBack={goBack} />
          <Stepper step={step} />
        </View>
      }
      footer={footer}>
      <Animated.View key={step} entering={FadeIn.duration(220)} style={{ paddingTop: space.md, gap: space.lg }}>
        <RestrictionNotice />
        {step === 0 && (
          <ServiceStep
            shop={shop}
            barber={params.barberId ? shop.barbers.find((b) => b.id === params.barberId) : undefined}
            value={serviceId}
            onChange={(id) => {
              setServiceId(id);
              setSlot(undefined);
            }}
          />
        )}
        {step === 1 && serviceId && (
          <BarberStep
            shop={shop}
            serviceId={serviceId}
            value={barberId}
            onChange={(id) => {
              setBarberId(id);
              setSlot(undefined);
            }}
          />
        )}
        {step === 2 && (
          <Stack gap={space.xl}>
            <Text variant="title" accessibilityRole="header">
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
            <SlotGrid query={availability} tz={shop.timezone} value={slot?.startsAt} onChange={setSlot} />
          </Stack>
        )}
        {step === 3 && slot && service && (
          <Stack gap={space.xl}>
            <Text variant="title" accessibilityRole="header">
              {ar.book.review}
            </Text>
            <Card>
              <SummaryLine label={ar.bookings.service} value={service.name} />
              <SummaryLine label={ar.bookings.barber} value={barber?.displayName ?? ar.book.anyBarber} />
              <SummaryLine
                label={ar.bookings.when}
                value={`${formatRelativeDay(slot.startsAt, shop.timezone)}، ${formatTime(slot.startsAt, shop.timezone)}`}
              />
              <SummaryLine label={ar.bookings.duration} value={formatDuration(duration)} />
              <SummaryLine label={ar.bookings.where} value={shop.name} />
              <Divider />
              <SummaryLine label={ar.book.total} value={formatPrice(price)} strong />
              <Text variant="caption" tone="textSubtle">
                {ar.book.payAtShop}
              </Text>
            </Card>

            <TextField
              label={ar.book.note}
              placeholder={ar.book.notePlaceholder}
              value={note}
              onChangeText={setNote}
              maxLength={300}
              multiline
            />

            <Card tone="muted">
              <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
                <Icon icon={ShieldCheck} tone="primary" />
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyStrong">{ar.book.policyTitle}</Text>
                  <Text variant="caption" tone="textMuted">
                    {ar.book.policySummary}
                  </Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push('/policy')}
                    hitSlop={8}
                    style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
                    <Text variant="label" tone="primary">
                      {ar.book.policyLink}
                    </Text>
                  </Pressable>
                </View>
              </Row>
            </Card>
          </Stack>
        )}
      </Animated.View>
    </Screen>
  );
}
