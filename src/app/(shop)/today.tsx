import { CalendarClock } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarMenuButton, roleLine } from '@/components/mode-menu';
import { EmptyState, Row, Screen, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { useCurrentMembership } from '@/stores/mode';
import { space } from '@/theme';

/** Placeholder for step 3 (today's schedule). The header is final: shop + role, avatar menu. */
export default function Today() {
  return (
    <Screen edgeBottom={false} header={<ShopHeader />}>
      <View style={{ paddingTop: space.huge }}>
        <EmptyState icon={CalendarClock} title={ar.common.today} hint={ar.staff.comingNext} />
      </View>
    </Screen>
  );
}

function ShopHeader() {
  const insets = useSafeAreaInsets();
  const m = useCurrentMembership();
  return (
    <Row
      gap={space.md}
      style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.xl, paddingBottom: space.sm }}>
      <AvatarMenuButton />
      <View style={{ flex: 1 }}>
        <Text variant="heading" numberOfLines={1} accessibilityRole="header">
          {m?.shopName ?? ''}
        </Text>
        <Text variant="caption" tone="textMuted" numberOfLines={1}>
          {m ? roleLine(m) : ''}
        </Text>
      </View>
    </Row>
  );
}
