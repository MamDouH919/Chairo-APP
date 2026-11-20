import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';

import { SummaryLine } from '@/components/booking-steps';
import { Button, Card, Icon, Screen, Skeleton, Stack, Text } from '@/components/ui';
import { useBooking } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { formatPrice, formatRelativeDay, formatTime } from '@/lib/format';
import { radius } from '@/theme';

const AView = withUniwind(Animated.View);

export default function BookingSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b } = useBooking(id);

  return (
    <Screen
      footer={
        <Stack className="gap-2">
          <Button
            label={ar.book.viewBooking}
            onPress={() => router.replace({ pathname: '/booking/[id]', params: { id } })}
          />
          <Button label={ar.book.backHome} variant="ghost" onPress={() => router.replace('/home')} />
        </Stack>
      }>
      <Stack className="items-center gap-6 pt-12">
        <AView
          entering={ZoomIn.springify().damping(14)}
          className="h-24 w-24 items-center justify-center rounded-full bg-success">
          <Icon icon={Check} size={44} tone="onPrimary" strokeWidth={3} />
        </AView>
        <AView entering={FadeInDown.delay(120).duration(320)} className="gap-2">
          <Text variant="display" align="center" accessibilityRole="header">
            {ar.book.successTitle}
          </Text>
          <Text tone="textMuted" align="center">
            {ar.book.successBody}
          </Text>
        </AView>

        <AView entering={FadeInDown.delay(200).duration(320)} className="self-stretch">
          {b ? (
            <Card className="gap-3">
              <Box className="gap-1 rounded-lg bg-secondary py-4">
                <Text variant="caption" tone="onPrimarySoft" align="center">
                  {ar.book.bookingCode}
                </Text>
                <Text
                  variant="display"
                  tone="onPrimarySoft"
                  align="center"
                  className="tracking-[6px]"
                  accessibilityLabel={`${ar.book.bookingCode} ${b.code.split('').join(' ')}`}>
                  {b.code}
                </Text>
              </Box>
              <Box>
                <SummaryLine label={ar.bookings.service} value={b.service?.name ?? '—'} />
                <SummaryLine label={ar.bookings.barber} value={b.barber.displayName} />
                <SummaryLine
                  label={ar.bookings.when}
                  value={`${formatRelativeDay(b.startsAt, b.shop.timezone)}، ${formatTime(b.startsAt, b.shop.timezone)}`}
                />
                <SummaryLine label={ar.bookings.price} value={formatPrice(b.priceEgp)} />
              </Box>
            </Card>
          ) : (
            <Skeleton height={260} radius={radius.xl} />
          )}
        </AView>
      </Stack>
    </Screen>
  );
}
