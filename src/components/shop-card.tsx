import { router } from 'expo-router';
import { Award, MapPin, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ar } from '@/i18n/ar';
import type { PublicShop } from '@/lib/api';
import { formatPrice, formatRating } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

import { ShopCover } from './shop-cover';
import { Badge, Card, Icon, Row, Skeleton, Text } from './ui';

export const minPrice = (shop: PublicShop) =>
  shop.services.length ? Math.min(...shop.services.map((s) => s.priceEgp)) : null;

export function ShopCard({ shop }: { shop: PublicShop }) {
  const { colors } = useTheme();
  const from = minPrice(shop);
  const place = [shop.area, shop.city].filter(Boolean).join('، ');

  return (
    <Card
      padded={false}
      onPress={() => router.push({ pathname: '/shop/[slug]', params: { slug: shop.slug } })}
      accessibilityLabel={`${shop.name}، ${place}، تقييم ${formatRating(shop.ratingAvg)}`}
      style={{ overflow: 'hidden' }}>
      <View>
        <ShopCover name={shop.name} url={shop.coverUrl} height={150} />
        {shop.isFoundingPartner && (
          <View style={styles.coverBadge}>
            <Badge label={ar.home.foundingPartner} tone="accent" icon={Award} />
          </View>
        )}
      </View>
      <View style={{ padding: space.lg, gap: space.xs }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {shop.name}
          </Text>
          <Row gap={4}>
            <Icon icon={Star} size={16} tone="accent" fill={colors.accent} />
            <Text variant="label">{formatRating(shop.ratingAvg)}</Text>
            <Text variant="caption" tone="textSubtle">
              ({shop.ratingCount})
            </Text>
          </Row>
        </Row>
        <Row gap={space.xs}>
          <Icon icon={MapPin} size={16} tone="textSubtle" />
          <Text variant="caption" tone="textMuted" numberOfLines={1} style={{ flex: 1 }}>
            {place}
          </Text>
          {from != null && (
            <Text variant="caption" tone="textMuted">
              {ar.shop.from} <Text variant="label">{formatPrice(from)}</Text>
            </Text>
          )}
        </Row>
      </View>
    </Card>
  );
}

export function ShopCardSkeleton() {
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Skeleton height={150} radius={0} />
      <View style={{ padding: space.lg, gap: space.sm }}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={14} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  coverBadge: { position: 'absolute', top: space.md, start: space.md, borderRadius: radius.pill },
});
