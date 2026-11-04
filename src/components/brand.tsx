import { Scissors } from 'lucide-react-native';
import { View } from 'react-native';

import { env } from '@/config/env';
import { ar } from '@/i18n/ar';
import { radius, space, useTheme } from '@/theme';

import { Badge, Icon, Row, Text } from './ui';

export function BrandMark({ size = 44, onInk }: { size?: number; onInk?: boolean }) {
  const { colors } = useTheme();
  return (
    <Row gap={space.sm} style={{ alignSelf: 'flex-start' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-8deg' }],
        }}>
        <Icon icon={Scissors} size={size * 0.5} tone="onPrimary" />
      </View>
      <Text variant="title" tone={onInk ? 'onInk' : 'text'} style={{ letterSpacing: 0.5 }}>
        {ar.appName}
      </Text>
    </Row>
  );
}

/** Small reminder that data is fake, so nobody mistakes a demo for production. */
export function MockBadge() {
  if (!env.useMocks) return null;
  return <Badge label={ar.common.mockBadge} tone="warning" />;
}
