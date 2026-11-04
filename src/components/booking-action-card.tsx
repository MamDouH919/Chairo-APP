import { router } from 'expo-router';
import { CircleAlert, QrCode, UserCheck, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useBookingAction, useCheckedIn } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type Booking } from '@/lib/api';
import { nextAction } from '@/lib/booking-actions';
import { errorMessage } from '@/lib/errors';
import { space } from '@/theme';

import { Button, Card, Icon, Row, Stack, Text, toast } from './ui';

const openBooking = (id: string, cancel?: boolean) =>
  router.push({ pathname: '/booking/[id]', params: { id, ...(cancel ? { cancel: '1' } : null) } });

function ActionShell({
  icon,
  tone = 'primary',
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  tone?: 'primary' | 'warning';
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <Stack gap={space.md}>
        <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
          <Icon icon={icon} tone={tone} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="caption" tone="textMuted">
              {hint}
            </Text>
          </View>
        </Row>
        {children}
      </Stack>
    </Card>
  );
}

/** The barber reported a delay: moving or cancelling is free, so both are one tap away. */
export function RunningLateCard({ booking: b, onCancel }: { booking: Booking; onCancel?: () => void }) {
  if (!b.delayMin) return null;
  return (
    <ActionShell icon={CircleAlert} tone="warning" title={ar.actions.lateTitle} hint={ar.bookings.delay(b.delayMin)}>
      {(b.canReschedule || b.canCancel) && (
        <Row gap={space.sm}>
          {b.canReschedule && (
            <View style={{ flex: 1 }}>
              <Button
                label={ar.bookings.reschedule}
                variant="secondary"
                size="md"
                onPress={() => router.push({ pathname: '/reschedule/[id]', params: { id: b.id } })}
              />
            </View>
          )}
          {b.canCancel && (
            <View style={{ flex: 1 }}>
              <Button
                label={ar.bookings.cancelBooking}
                variant="danger"
                size="md"
                onPress={onCancel ?? (() => openBooking(b.id, true))}
              />
            </View>
          )}
        </Row>
      )}
    </ActionShell>
  );
}

/**
 * "What do I need to do?" for one booking. Booking details shows the delay in its own card
 * at all times, so it passes `hideLate`.
 */
export function BookingActionCard({ booking: b, hideLate }: { booking: Booking; hideLate?: boolean }) {
  const checkedIn = useCheckedIn(b.id);
  const confirm = useBookingAction(api.bookings.confirm);
  const action = nextAction(b, { checkedIn });

  if (action?.kind === 'confirm') {
    return (
      <ActionShell icon={UserCheck} title={ar.actions.confirmTitle} hint={ar.bookings.imComingHint}>
        <Button
          label={ar.bookings.imComing}
          size="md"
          loading={confirm.isPending}
          onPress={() =>
            confirm.mutate(b.id, {
              onSuccess: () => toast(ar.bookings.confirmed),
              onError: (e) => toast(errorMessage(e), 'error'),
            })
          }
        />
      </ActionShell>
    );
  }
  if (action?.kind === 'checkIn') {
    return (
      <ActionShell icon={QrCode} title={ar.actions.checkInTitle} hint={ar.actions.checkInHint}>
        <Button
          label={ar.actions.checkInCta}
          size="md"
          icon={QrCode}
          onPress={() => router.push({ pathname: '/check-in/[id]', params: { id: b.id } })}
        />
      </ActionShell>
    );
  }
  if (action?.kind === 'late' && !hideLate) return <RunningLateCard booking={b} />;
  return null;
}
