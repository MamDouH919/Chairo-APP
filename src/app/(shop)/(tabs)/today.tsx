import { CalendarClock } from 'lucide-react-native';

import { ShopHeader } from '@/components/shop-header';
import { EmptyState, Screen } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { Box } from '@/components/gluestack/box';

/** Placeholder for step 3 (today's schedule). The header is final: shop + role, avatar menu. */
export default function Today() {
  return (
    <Screen edgeBottom={false} header={<ShopHeader />}>
      <Box className="pt-12">
        <EmptyState icon={CalendarClock} title={ar.common.today} hint={ar.staff.comingNext} />
      </Box>
    </Screen>
  );
}
