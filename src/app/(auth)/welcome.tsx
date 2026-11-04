import { router } from 'expo-router';
import { BellRing, CalendarClock, UserRoundCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, MockBadge } from '@/components/brand';
import { Button, Icon, Row, Text } from '@/components/ui';
import { MAX_WIDTH } from '@/components/ui/layout';
import { ar } from '@/i18n/ar';
import { radius, space, useTheme } from '@/theme';

const FEATURE_ICONS = [UserRoundCheck, CalendarClock, BellRing];

export default function Welcome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.surfaceInk,
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.lg,
        },
      ]}>
      {/* soft brand glow, decorative */}
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={[styles.glow2, { backgroundColor: colors.accent }]} />

      <View style={styles.inner}>
        <Row style={{ justifyContent: 'space-between' }}>
          <BrandMark onInk />
          <MockBadge />
        </Row>

        <View style={{ flex: 1, justifyContent: 'center', gap: space.xxl }}>
          <Animated.View entering={FadeInDown.duration(420)}>
            <Text variant="display" tone="onInk" style={{ fontSize: 36, lineHeight: 52 }}>
              {ar.welcome.title}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(420).delay(80)}>
            <Text variant="body" tone="onInkMuted">
              {ar.welcome.subtitle}
            </Text>
          </Animated.View>

          <View style={{ gap: space.md }}>
            {ar.welcome.features.map((f, i) => (
              <Animated.View key={f} entering={FadeInDown.duration(380).delay(160 + i * 70)}>
                <Row gap={space.md}>
                  <View style={styles.featureIcon}>
                    <Icon icon={FEATURE_ICONS[i]} size="md" tone="onInk" />
                  </View>
                  <Text variant="bodyStrong" tone="onInk">
                    {f}
                  </Text>
                </Row>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={{ gap: space.md }}>
          <Button label={ar.welcome.cta} onPress={() => router.push('/phone')} />
          <Text variant="caption" tone="onInkMuted" align="center">
            {ar.welcome.terms}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', paddingHorizontal: space.xl },
  inner: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  glow: { position: 'absolute', width: 420, height: 420, borderRadius: 210, top: -180, end: -160, opacity: 0.35 },
  glow2: { position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: 120, start: -170, opacity: 0.16 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
