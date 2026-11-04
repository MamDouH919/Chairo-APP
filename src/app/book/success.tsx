import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { SummaryLine } from '@/components/booking-steps';
import { Button, Card, Icon, Screen, Skeleton, Stack, Text } from '@/components/ui';
import { useBooking } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { formatPrice, formatRelativeDay, formatTime } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

export default function BookingSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: b } = useBooking(id);

  return (
    <Screen
      footer={
        <Stack gap={space.sm}>
          <Button
            label={ar.book.viewBooking}
            onPress={() => router.replace({ pathname: '/booking/[id]', params: { id } })}
          />
          <Button label={ar.book.backHome} variant="ghost" onPress={() => router.replace('/home')} />
        </Stack>
      }>
      <Stack gap={space.xxl} style={{ alignItems: 'center', paddingTop: space.huge }}>
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          style={[styles.check, { backgroundColor: colors.success }]}>
          <Icon icon={Check} size={44} tone="onPrimary" strokeWidth={3} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={{ gap: space.sm }}>
          <Text variant="display" align="center" accessibilityRole="header">
            {ar.book.successTitle}
          </Text>
          <Text tone="textMuted" align="center">
            {ar.book.successBody}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(320)} style={{ alignSelf: 'stretch' }}>
          {b ? (
            <Card style={{ gap: space.md }}>
              <View style={[styles.code, { backgroundColor: colors.primarySoft }]}>
                <Text variant="caption" tone="onPrimarySoft" align="center">
                  {ar.book.bookingCode}
                </Text>
                <Text
                  variant="display"
                  tone="onPrimarySoft"
                  align="center"
                  style={{ letterSpacing: 6 }}
                  accessibilityLabel={`${ar.book.bookingCode} ${b.code.split('').join(' ')}`}>
                  {b.code}
                </Text>
              </View>
              <View>
                <SummaryLine label={ar.bookings.service} value={b.service?.name ?? '—'} />
                <SummaryLine label={ar.bookings.barber} value={b.barber.displayName} />
                <SummaryLine
                  label={ar.bookings.when}
                  value={`${formatRelativeDay(b.startsAt, b.shop.timezone)}، ${formatTime(b.startsAt, b.shop.timezone)}`}
                />
                <SummaryLine label={ar.bookings.price} value={formatPrice(b.priceEgp)} />
              </View>
            </Card>
          ) : (
            <Skeleton height={260} radius={radius.xl} />
          )}
        </Animated.View>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  code: { borderRadius: radius.lg, paddingVertical: space.lg, gap: space.xs },
});
