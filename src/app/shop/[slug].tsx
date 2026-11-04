import { router, useLocalSearchParams } from 'expo-router';
import { Award, Clock, MapPin, Navigation, Phone, Scissors, Star } from 'lucide-react-native';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShopCover } from '@/components/shop-cover';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ChevronBack,
  ErrorState,
  Icon,
  IconButton,
  Row,
  Screen,
  SectionHeader,
  Skeleton,
  Stack,
  Text,
} from '@/components/ui';
import { useShop } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import type { PublicShop } from '@/lib/api';
import { formatDuration, formatPrice, formatRating } from '@/lib/format';
import { isOpenNow, todayWeekday } from '@/lib/hours';
import { radius, space, useTheme } from '@/theme';

const COVER_H = 240;

export default function ShopScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const shop = useShop(slug);
  const insets = useSafeAreaInsets();

  const book = (params: { serviceId?: string; barberId?: string } = {}) =>
    router.push({ pathname: '/book/[slug]', params: { slug, ...params } });

  const back = (
    <View style={[styles.backBtn, { top: insets.top + space.sm }]}>
      <IconButton
        icon={ChevronBack}
        label={ar.common.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
    </View>
  );

  if (shop.isPending) {
    return (
      <Screen header={<View />} padded={false}>
        <Skeleton height={COVER_H} radius={0} />
        <Stack style={{ padding: space.xl }}>
          <Skeleton width="70%" height={28} />
          <Skeleton width="45%" height={16} />
          <Skeleton height={120} radius={radius.xl} />
        </Stack>
        {back}
      </Screen>
    );
  }
  if (shop.isError) {
    return (
      <Screen header={<View style={{ height: insets.top + 64 }} />}>
        <ErrorState error={shop.error} onRetry={() => shop.refetch()} />
        {back}
      </Screen>
    );
  }

  const s = shop.data;
  return (
    <Screen
      header={<View />}
      padded={false}
      footer={<Button label={ar.shop.book} icon={Scissors} onPress={() => book()} />}>
      <ShopCover name={s.name} url={s.coverUrl} height={COVER_H} />
      <View style={styles.body}>
        <Header shop={s} />
        <Services shop={s} onPick={(serviceId) => book({ serviceId })} />
        <Team shop={s} onPick={(barberId) => book({ barberId })} />
        <Hours shop={s} />
        {s.description && (
          <View>
            <SectionHeader title={ar.shop.about} />
            <Text tone="textMuted">{s.description}</Text>
          </View>
        )}
      </View>
      {back}
    </Screen>
  );
}

function Header({ shop: s }: { shop: PublicShop }) {
  const { colors } = useTheme();
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
    <Card style={{ marginTop: -56, gap: space.md }}>
      <Row style={{ flexWrap: 'wrap' }}>
        <Badge label={open ? ar.shop.openNow : ar.shop.closedNow} tone={open ? 'success' : 'neutral'} icon={Clock} />
        {s.isFoundingPartner && <Badge label={ar.home.foundingPartner} tone="accent" icon={Award} />}
      </Row>
      <Text variant="title" accessibilityRole="header">
        {s.name}
      </Text>
      <Row gap={space.xs}>
        <Icon icon={Star} size={18} tone="accent" fill={colors.accent} />
        <Text variant="bodyStrong">{formatRating(s.ratingAvg)}</Text>
        <Text variant="caption" tone="textSubtle">
          · {ar.home.reviews(s.ratingCount)}
        </Text>
      </Row>
      {place ? (
        <Row gap={space.xs} style={{ alignItems: 'flex-start' }}>
          <Icon icon={MapPin} size={18} tone="textSubtle" />
          <Text variant="caption" tone="textMuted" style={{ flex: 1 }}>
            {place}
          </Text>
        </Row>
      ) : null}
      <Row gap={space.sm}>
        {s.phone && (
          <View style={{ flex: 1 }}>
            <Button
              label={ar.shop.call}
              icon={Phone}
              variant="outline"
              size="md"
              onPress={() => Linking.openURL(`tel:${s.phone}`)}
            />
          </View>
        )}
        {mapsUrl && (
          <View style={{ flex: 1 }}>
            <Button
              label={ar.shop.directions}
              icon={Navigation}
              variant="outline"
              size="md"
              onPress={() => Linking.openURL(mapsUrl)}
            />
          </View>
        )}
      </Row>
    </Card>
  );
}

function Services({ shop, onPick }: { shop: PublicShop; onPick: (id: string) => void }) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionHeader title={ar.shop.services} />
      <Card padded={false}>
        {shop.services.map((svc, i) => (
          <Pressable
            key={svc.id}
            accessibilityRole="button"
            accessibilityLabel={`${svc.name}، ${formatDuration(svc.durationMin)}، ${formatPrice(svc.priceEgp)}`}
            onPress={() => onPick(svc.id)}
            style={({ pressed }) => [
              styles.serviceRow,
              i < shop.services.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
              pressed && { backgroundColor: colors.surfaceMuted },
            ]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{svc.name}</Text>
              <Text variant="caption" tone="textSubtle">
                {formatDuration(svc.durationMin)}
              </Text>
            </View>
            <Text variant="bodyStrong" tone="primary">
              {formatPrice(svc.priceEgp)}
            </Text>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

function Team({ shop, onPick }: { shop: PublicShop; onPick: (id: string) => void }) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionHeader title={ar.shop.team} />
      <Stack gap={space.sm}>
        {shop.barbers.map((b) => (
          <Card
            key={b.id}
            onPress={b.acceptsBookings ? () => onPick(b.id) : undefined}
            accessibilityLabel={`${b.displayName}، تقييم ${formatRating(b.ratingAvg)}`}
            style={{ paddingVertical: space.md }}>
            <Row gap={space.md}>
              <Avatar name={b.displayName} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{b.displayName}</Text>
                <Text variant="caption" tone="textSubtle" numberOfLines={1}>
                  {b.acceptsBookings ? (b.bio ?? '') : ar.shop.notAccepting}
                </Text>
              </View>
              <Row gap={4}>
                <Icon icon={Star} size={14} tone="accent" fill={colors.accent} />
                <Text variant="label">{formatRating(b.ratingAvg)}</Text>
              </Row>
            </Row>
          </Card>
        ))}
      </Stack>
    </View>
  );
}

function Hours({ shop }: { shop: PublicShop }) {
  const { colors } = useTheme();
  const today = todayWeekday(shop.timezone);
  // Start the week on Saturday, as is common in Egypt
  const order = [6, 0, 1, 2, 3, 4, 5];
  return (
    <View>
      <SectionHeader title={ar.shop.hours} />
      <Card style={{ gap: space.xs }}>
        {order.map((wd) => {
          const h = shop.hours.find((x) => x.weekday === wd);
          const isToday = wd === today;
          return (
            <Row
              key={wd}
              style={[styles.hoursRow, isToday && { backgroundColor: colors.primarySoft }]}
              accessibilityLabel={`${ar.shop.weekdays[wd]}: ${!h || h.isClosed ? ar.shop.closed : `${h.open} - ${h.close}`}`}>
              <Text
                variant={isToday ? 'bodyStrong' : 'body'}
                tone={isToday ? 'onPrimarySoft' : 'text'}
                style={{ flex: 1 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.xl, gap: space.xxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  backBtn: { position: 'absolute', start: space.lg },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  hoursRow: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md },
});
