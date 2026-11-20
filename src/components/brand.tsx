import { Scissors } from 'lucide-react-native';

import { Box } from '@/components/gluestack/box';
import { ar } from '@/i18n/ar';

import { Icon, Row, Text } from './ui';

export function BrandMark({ size = 44, onInk }: { size?: number; onInk?: boolean }) {
  return (
    <Row className="self-start">
      {/* dynamic size: the mark scales with its caller */}
      <Box
        className="-rotate-8 items-center justify-center rounded-md bg-primary"
        style={{ width: size, height: size }}>
        <Icon icon={Scissors} size={size * 0.5} tone="onPrimary" />
      </Box>
      <Text variant="title" tone={onInk ? 'onInk' : 'text'} className="tracking-wide">
        {ar.appName}
      </Text>
    </Row>
  );
}
