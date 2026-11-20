import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarMenuButton, roleLine } from '@/components/mode-menu';
import { Row, Text } from '@/components/ui';
import { useCurrentMembership } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

/** Shop mode header: avatar menu, shop name, and the role line. */
export function ShopHeader({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const m = useCurrentMembership();
  return (
    <Row className="gap-3 px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
      <AvatarMenuButton />
      <Box className="flex-1">
        <Text variant="heading" numberOfLines={1} accessibilityRole="header">
          {title ?? m?.shopName ?? ''}
        </Text>
        <Text variant="caption" tone="textMuted" numberOfLines={1}>
          {m ? roleLine(m) : ''}
        </Text>
      </Box>
    </Row>
  );
}
