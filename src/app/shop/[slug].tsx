import { router, useLocalSearchParams } from 'expo-router';
import { Award, Clock, MapPin, Navigation, Phone, Scissors, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Linking, Platform } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';

import { minPrice } from '@/components/shop-card';
import { ShopCover } from '@/components/shop-cover';
import {
  Avatar,
  Backdrop,
  Badge,
  Button,
  Card,
  ChevronBack,
  ErrorState,
  Glass,
  Icon,
  IconButton,
  Reveal,
  Row,
  Screen,
  SectionHeader,
  Skeleton,
  Stack,
  Text,
  useScrollY,
} from '@/components/ui';
import { useShop } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import type { PublicShop } from '@/lib/api';
import { formatDuration, formatPrice, formatRating } from '@/lib/format';
import { isOpenNow, todayWeekday } from '@/lib/hours';
import { radius } from '@/theme';

const COVER_H = 300;
const SHEET_OVERLAP = 32;

export default function ShopScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const shop = useShop(slug);
  const insets = useSafeAreaInsets();

  const book = (params: { serviceId?: string; barberId?: string } = {}) =>
    router.push({ pathname: '/book/[slug]', params: { slug, ...params } });

  const back = (
    <Box className="absolute start-4" style={{ top: insets.top + 8 }}>
      <IconButton
        icon={ChevronBack}
        label={ar.common.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
    </Box>
  );

  if (shop.isPending) {
    return (
      <Screen header={<Box />} padded={false} headerDivider={false} overlay={back}>
        <Skeleton height={COVER_H} radius={0} />
        <Stack className="p-5">
          <Skeleton width="70%" height={28} />
          <Skeleton width="45%" height={16} />
          <Skeleton height={120} radius={radius.xl} />
        </Stack>
      </Screen>
    );
  }
  if (shop.isError) {
    return (
      <Screen header={<Box style={{ height: insets.top + 64 }} />} headerDivider={false} overlay={back}>
        <ErrorState error={shop.error} onRetry={() => shop.refetch()} />
      </Screen>
    );
  }

  const s = shop.data;
  return (
    <Screen
      header={<Box />}
      padded={false}
      headerDivider={false}
      overlay={back}
      // the shop name moves up into a compact bar once the cover has scrolled away
      scrollTitle={s.name}
      scrollTitleAt={COVER_H - SHEET_OVERLAP - insets.top - 56}
      footer={<BookBar shop={s} onBook={() => book()} />}>
      <ParallaxCover>
        <ShopCover name={s.name} url={s.coverUrl} height={COVER_H} />
      </ParallaxCover>
      <Box className="-mt-8 overflow-hidden rounded-t-3xl">
        <Backdrop />
        <Box className="w-full max-w-160 gap-6 self-center px-5 pt-6">
          <Reveal>
            <Header shop={s} />
          </Reveal>
          <Reveal index={1}>
            <Services shop={s} onPick={(serviceId) => book({ serviceId })} />
          </Reveal>
          <Reveal index={2}>
            <Team shop={s} onPick={(barberId) => book({ barberId })} />
          </Reveal>
          <Reveal index={3}>
            <Hours shop={s} />
          </Reveal>
          {s.description && (
            <Reveal index={4}>
              <SectionHeader title={ar.shop.about} />
              <Text tone="textMuted">{s.description}</Text>
            </Reveal>
          )}
        </Box>
      </Box>
    </Screen>
  );
}

/**
 * The cover moves at half the scroll speed, so the content sheet appears to slide over it, and it
 * stretches from the top edge when the page is pulled down. With "Reduce Motion" on it scrolls normally.
 */
function ParallaxCover({ children }: { children: ReactNode }) {
  const scrollY = useScrollY();
  const reduceMotion = useReducedMotion();
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const y = scrollY.value;
    // pulled down (y < 0): pin to the top and grow by the overscroll distance
    const scale = interpolate(y, [-COVER_H, 0], [2, 1], Extrapolation.CLAMP);
    const translateY = y < 0 ? y / 2 : interpolate(y, [0, COVER_H], [0, COVER_H / 2], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Header({ shop: s }: { shop: PublicShop }) {
  const open = isOpenNow(s.hours, s.timezone);
  const place = [s.address, s.area, s.city].filter(Boolean).join('، ');
  const mapsUrl =
    s.latitude != null && s.longitude != null
      ? Platform.select({
          ios: `maps:?q=${encodeURIComponent(s.name)}&ll=${s.latitude},${s.longitude}`,
          default: `https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`,
        })
      : null;

  return (
    <Box className="gap-3">
      <Row className="flex-wrap">
        <Badge label={open ? ar.shop.openNow : ar.shop.closedNow} tone={open ? 'success' : 'neutral'} icon={Clock} />
        {s.isFoundingPartner && <Badge label={ar.home.foundingPartner} tone="accent" icon={Award} />}
      </Row>
      <Row className="items-start gap-3">
        <Box className="flex-1 gap-0.5">
          <Text variant="title" accessibilityRole="header">
            {s.name}
          </Text>
          {place ? (
            <Row className="items-start gap-1">
              <Icon icon={MapPin} size={16} tone="textSubtle" className="mt-0.5" />
              <Text variant="caption" tone="textMuted" className="flex-1">
                {place}
              </Text>
            </Row>
          ) : null}
        </Box>
        <Glass
          className="items-center rounded-lg px-3 py-2"
          accessibilityLabel={`تقييم ${formatRating(s.ratingAvg)}، ${ar.home.reviews(s.ratingCount)}`}>
          <Row className="gap-1">
            <Icon icon={Star} size={16} tone="accent" className="fill-accent-foreground" />
            <Text variant="bodyStrong">{formatRating(s.ratingAvg)}</Text>
          </Row>
          <Text variant="overline" tone="textSubtle">
            {ar.home.reviews(s.ratingCount)}
          </Text>
        </Glass>
      </Row>
      <Row className="gap-2">
        {s.phone && (
          <Box className="flex-1">
            <Button
              label={ar.shop.call}
              icon={Phone}
              variant="glass"
              size="md"
              onPress={() => Linking.openURL(`tel:${s.phone}`)}
            />
          </Box>
        )}
        {mapsUrl && (
          <Box className="flex-1">
            <Button
              label={ar.shop.directions}
              icon={Navigation}
              variant="glass"
              size="md"
              onPress={() => Linking.openURL(mapsUrl)}
            />
          </Box>
        )}
      </Row>
    </Box>
  );
}

/** Floating footer: the starting price next to the main CTA. */
function BookBar({ shop, onBook }: { shop: PublicShop; onBook: () => void }) {
  const from = minPrice(shop);
  return (
    <Row className="gap-3">
      {from != null && (
        <Box className="flex-1 ps-2">
          <Text variant="caption" tone="textMuted">
            {ar.shop.from}
          </Text>
          <Text variant="heading">{formatPrice(from)}</Text>
        </Box>
      )}
      {/* the CTA is wider than the price block; a fractional flex can't be a static class */}
      <Box style={{ flex: from != null ? 1.4 : 1 }}>
        <Button label={ar.shop.book} icon={Scissors} onPress={onBook} />
      </Box>
    </Row>
  );
}

function Services({ shop, onPick }: { shop: PublicShop; onPick: (id: string) => void }) {
  return (
    <Box>
      <SectionHeader title={ar.shop.services} />
      <Card padded={false}>
        {shop.services.map((svc, i) => (
          <Pressable
            key={svc.id}
            accessibilityRole="button"
            accessibilityLabel={`${svc.name}، ${formatDuration(svc.durationMin)}، ${formatPrice(svc.priceEgp)}`}
            onPress={() => onPick(svc.id)}
            className={`min-h-16 flex-row items-center gap-3 px-4 py-3 data-[active=true]:bg-glass-pressed ${
              i < shop.services.length - 1 ? 'border-b border-border' : ''
            }`}>
            <Box className="flex-1">
              <Text variant="bodyStrong">{svc.name}</Text>
              <Text variant="caption" tone="textSubtle">
                {formatDuration(svc.durationMin)}
              </Text>
            </Box>
            <Text variant="bodyStrong" tone="primary">
              {formatPrice(svc.priceEgp)}
            </Text>
          </Pressable>
        ))}
      </Card>
    </Box>
  );
}

function Team({ shop, onPick }: { shop: PublicShop; onPick: (id: string) => void }) {
  return (
    <Box>
      <SectionHeader title={ar.shop.team} />
      <Stack className="gap-2">
        {shop.barbers.map((b) => (
          <Card
            key={b.id}
            onPress={b.acceptsBookings ? () => onPick(b.id) : undefined}
            accessibilityLabel={`${b.displayName}، تقييم ${formatRating(b.ratingAvg)}`}
            className="py-3">
            <Row className="gap-3">
              <Avatar name={b.displayName} />
              <Box className="flex-1">
                <Text variant="bodyStrong">{b.displayName}</Text>
                <Text variant="caption" tone="textSubtle" numberOfLines={1}>
                  {b.acceptsBookings ? (b.bio ?? '') : ar.shop.notAccepting}
                </Text>
              </Box>
              <Row className="gap-1">
                <Icon icon={Star} size={14} tone="accent" className="fill-accent-foreground" />
                <Text variant="label">{formatRating(b.ratingAvg)}</Text>
              </Row>
            </Row>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

function Hours({ shop }: { shop: PublicShop }) {
  const today = todayWeekday(shop.timezone);
  // Start the week on Saturday, as is common in Egypt
  const order = [6, 0, 1, 2, 3, 4, 5];
  return (
    <Box>
      <SectionHeader title={ar.shop.hours} />
      <Card className="gap-1">
        {order.map((wd) => {
          const h = shop.hours.find((x) => x.weekday === wd);
          const isToday = wd === today;
          return (
            <Row
              key={wd}
              className={`rounded-md px-3 py-2 ${isToday ? 'bg-primary/10' : ''}`}
              accessibilityLabel={`${ar.shop.weekdays[wd]}: ${!h || h.isClosed ? ar.shop.closed : `${h.open} - ${h.close}`}`}>
              <Text
                variant={isToday ? 'bodyStrong' : 'body'}
                tone={isToday ? 'onPrimarySoft' : 'text'}
                className="flex-1">
                {ar.shop.weekdays[wd]}
              </Text>
              <Text
                variant={isToday ? 'bodyStrong' : 'body'}
                tone={!h || h.isClosed ? 'danger' : isToday ? 'onPrimarySoft' : 'textMuted'}
                style={{ writingDirection: 'ltr' }}>
                {!h || h.isClosed ? ar.shop.closed : `${h.open} – ${h.close}`}
              </Text>
            </Row>
          );
        })}
      </Card>
    </Box>
  );
}
