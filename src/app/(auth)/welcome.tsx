import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BellRing, CalendarClock, Scissors, UserRound, UserRoundCheck, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, MockBadge } from '@/components/brand';
import { ChevronForward, Icon, Row, Text } from '@/components/ui';
import { MAX_WIDTH } from '@/components/ui/layout';
import { ar } from '@/i18n/ar';
import { useMode } from '@/stores/mode';
import { radius, space, useTheme } from '@/theme';

const FEATURE_ICONS = [UserRoundCheck, CalendarClock, BellRing];

function start(intent: 'customer' | 'barber') {
  useMode.getState().setIntent(intent);
  router.push({ pathname: '/phone', params: { as: intent } });
}

/** A big two-line entry: easy to hit and to tell apart at a glance. */
function Entry({
  icon,
  label,
  hint,
  primary,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}، ${hint}`}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.entry,
        primary
          ? { backgroundColor: pressed ? colors.primaryPressed : colors.primary, borderColor: colors.primary }
          : {
              backgroundColor: pressed ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
              borderColor: 'rgba(255,255,255,0.22)',
            },
      ]}>
      <View
        style={[styles.entryIcon, { backgroundColor: primary ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)' }]}>
        <Icon icon={icon} size="lg" tone={primary ? 'onPrimary' : 'onInk'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" tone={primary ? 'onPrimary' : 'onInk'} numberOfLines={1}>
          {label}
        </Text>
        <Text
          variant="caption"
          tone={primary ? 'onPrimary' : 'onInkMuted'}
          numberOfLines={1}
          style={{ opacity: primary ? 0.85 : 1 }}>
          {hint}
        </Text>
      </View>
      <Icon icon={ChevronForward} size="md" tone={primary ? 'onPrimary' : 'onInkMuted'} />
    </Pressable>
  );
}

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
          {/* Same phone OTP for both; the choice only sets the starting mode and the copy. */}
          <Entry
            icon={UserRound}
            label={ar.welcome.customerCta}
            hint={ar.welcome.customerHint}
            primary
            onPress={() => start('customer')}
          />
          <Entry
            icon={Scissors}
            label={ar.welcome.barberCta}
            hint={ar.welcome.barberHint}
            onPress={() => start('barber')}
          />
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
  entry: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  entryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
