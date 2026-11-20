import { router } from 'expo-router';
import { Award, MapPin, Star } from 'lucide-react-native';

import { Box } from '@/components/gluestack/box';
import { ar } from '@/i18n/ar';
import type { PublicShop } from '@/lib/api';
import { formatPrice, formatRating } from '@/lib/format';
import { radius } from '@/theme';

import { ShopCover } from './shop-cover';
import { Badge, Button, Card, Icon, PressableScale, Row, Skeleton, Text } from './ui';

export const minPrice = (shop: PublicShop) =>
  shop.services.length ? Math.min(...shop.services.map((s) => s.priceEgp)) : null;

export function ShopCard({ shop }: { shop: PublicShop }) {
  const from = minPrice(shop);
  const place = [shop.area, shop.city].filter(Boolean).join('، ');

  // The card opens the shop; "احجز" is a sibling (not a child) so a button never nests inside a button.
  return (
    <Card padded={false} className="rounded-2xl p-2">
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${shop.name}، ${place}، تقييم ${formatRating(shop.ratingAvg)}`}
        onPress={() => router.push({ pathname: '/shop/[slug]', params: { slug: shop.slug } })}
        scaleTo={0.985}
        dim={0.9}>
        <Box className="overflow-hidden rounded-lg">
          <ShopCover name={shop.name} url={shop.coverUrl} height={156} />
          <Row className="absolute start-2.5 top-2.5 h-7.5 gap-1 rounded-full bg-card px-3">
            <Icon icon={Star} size={14} tone="accent" className="fill-accent-foreground" />
            <Text variant="label">{formatRating(shop.ratingAvg)}</Text>
            <Text variant="caption" tone="textSubtle">
              ({shop.ratingCount})
            </Text>
          </Row>
          {shop.isFoundingPartner && (
            <Box className="absolute bottom-2.5 start-2.5">
              <Badge label={ar.home.foundingPartner} tone="accent" icon={Award} />
            </Box>
          )}
        </Box>
        {/* pe-24 leaves room for the absolutely placed "احجز" button */}
        <Box className="gap-0.5 px-2 pb-1 pe-24 pt-3">
          <Text variant="heading" numberOfLines={1}>
            {shop.name}
          </Text>
          <Row className="gap-1">
            <Icon icon={MapPin} size={14} tone="textSubtle" />
            <Text variant="caption" tone="textMuted" numberOfLines={1} className="shrink">
              {place}
              {from != null ? ` · ${ar.shop.from} ${formatPrice(from)}` : ''}
            </Text>
          </Row>
        </Box>
      </PressableScale>
      <Box className="absolute bottom-3 end-3">
        <Button
          label={ar.home.bookNow}
          size="md"
          fullWidth={false}
          accessibilityHint={shop.name}
          onPress={() => router.push({ pathname: '/book/[slug]', params: { slug: shop.slug } })}
          className="min-h-10.5"
        />
      </Box>
    </Card>
  );
}

export function ShopCardSkeleton() {
  return (
    <Card padded={false} className="rounded-2xl p-2">
      <Skeleton height={156} radius={radius.xl - 4} />
      <Box className="gap-2 p-4">
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={14} />
      </Box>
    </Card>
  );
}
