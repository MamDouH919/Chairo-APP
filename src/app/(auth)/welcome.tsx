import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  BellRing,
  CalendarClock,
  Check,
  Scissors,
  UserRound,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { BrandMark } from '@/components/brand';
import { Box } from '@/components/gluestack/box';
import { Avatar, ChevronForward, Icon, PressableScale, Reveal, Row, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { useMode } from '@/stores/mode';

const AView = withUniwind(Animated.View);

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
  return (
    <PressableScale
      scaleTo={0.97}
      dim={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${label}، ${hint}`}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className={`min-h-18 flex-row items-center gap-3 rounded-full border px-4 py-3 ${
        primary
          ? 'border-primary bg-primary shadow-xl shadow-primary/40'
          : 'border-ink-foreground/20 bg-ink-foreground/6'
      }`}>
      <Box
        className={`h-11.5 w-11.5 items-center justify-center rounded-full ${
          primary ? 'bg-ink-foreground/16' : 'bg-ink-foreground/10'
        }`}>
        <Icon icon={icon} size="lg" tone={primary ? 'onPrimary' : 'onInk'} />
      </Box>
      <Box className="flex-1">
        <Text variant="bodyStrong" tone={primary ? 'onPrimary' : 'onInk'} numberOfLines={1}>
          {label}
        </Text>
        <Text
          variant="caption"
          tone={primary ? 'onPrimary' : 'onInkMuted'}
          numberOfLines={1}
          className={primary ? 'opacity-85' : ''}>
          {hint}
        </Text>
      </Box>
      <Icon icon={ChevronForward} size="md" tone={primary ? 'onPrimary' : 'onInkMuted'} />
    </PressableScale>
  );
}

const GLASS_INK = 'border border-ink-foreground/14 bg-ink-foreground/7';

/** Decorative glass "ticket": shows what a booking looks like before the user has one. */
function TicketPreview() {
  const p = ar.welcome.preview;
  return (
    <Box accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-53.5 justify-center">
      <Box className={`absolute bottom-3.5 end-3.5 start-8.5 top-6.5 -rotate-5 rounded-2xl opacity-60 ${GLASS_INK}`} />
      <Box className={`ms-5.5 gap-3 rounded-2xl p-5 ${GLASS_INK}`}>
        <Row className="justify-between">
          <Row className="h-7.5 gap-1 rounded-full bg-primary-bright/15 px-3">
            <Icon icon={Check} size={14} tone="primaryBright" />
            <Text variant="caption" tone="primaryBright">
              {p.status}
            </Text>
          </Row>
          <Text variant="caption" tone="onInkMuted">
            {p.day}
          </Text>
        </Row>
        <Row className="gap-3">
          <Avatar name="محمد" size={46} />
          <Box className="flex-1">
            <Text variant="bodyStrong" tone="onInk" numberOfLines={1}>
              {p.title}
            </Text>
            <Text variant="caption" tone="onInkMuted" numberOfLines={1}>
              {p.place}
            </Text>
          </Box>
        </Row>
        <Row className="justify-between border-t border-dashed border-ink-foreground/18 pt-3">
          <Text variant="display" tone="onInk">
            {p.time}
          </Text>
          <Box className="h-7.5 items-center justify-center rounded-full bg-ink-foreground px-3">
            <Text variant="label" tone="ink">
              {p.countdown}
            </Text>
          </Box>
        </Row>
      </Box>
    </Box>
  );
}

export default function Welcome() {
  // The preview is decoration: drop it on short phones so the two entries never get pushed off-screen.
  const showPreview = useWindowDimensions().height >= 760;

  return (
    <Box className="flex-1 overflow-hidden bg-ink px-5 pb-safe-offset-4 pt-safe-offset-4">
      <Box className="w-full max-w-160 flex-1 self-center">
        <Row className="justify-between">
          <BrandMark onInk />
        </Row>

        <Box className="flex-1 justify-center gap-6">
          {showPreview && (
            <AView entering={FadeInDown.duration(480)}>
              <TicketPreview />
            </AView>
          )}
          <AView entering={FadeInDown.duration(420)}>
            <Text variant="jumbo" tone="onInk">
              {ar.welcome.title}
            </Text>
          </AView>
          <AView entering={FadeInDown.duration(420).delay(80)}>
            <Text variant="body" tone="onInkMuted">
              {ar.welcome.subtitle}
            </Text>
          </AView>

          {!showPreview && (
            <Box className="gap-3">
              {ar.welcome.features.map((f, i) => (
                <AView key={f} entering={FadeInDown.duration(380).delay(160 + i * 70)}>
                  <Row className="gap-3">
                    <Box className="h-11 w-11 items-center justify-center rounded-md bg-ink-foreground/10">
                      <Icon icon={FEATURE_ICONS[i]} size="md" tone="onInk" />
                    </Box>
                    <Text variant="bodyStrong" tone="onInk">
                      {f}
                    </Text>
                  </Row>
                </AView>
              ))}
            </Box>
          )}
        </Box>

        <Box className="gap-3">
          {/* Same phone OTP for both; the choice only sets the starting mode and the copy. */}
          <Reveal delay={220}>
            <Entry
              icon={UserRound}
              label={ar.welcome.customerCta}
              hint={ar.welcome.customerHint}
              primary
              onPress={() => start('customer')}
            />
          </Reveal>
          <Reveal delay={290}>
            <Entry
              icon={Scissors}
              label={ar.welcome.barberCta}
              hint={ar.welcome.barberHint}
              onPress={() => start('barber')}
            />
          </Reveal>
          <Text variant="caption" tone="onInkMuted" align="center">
            {ar.welcome.terms}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
