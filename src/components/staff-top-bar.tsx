import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand';
import { Row } from '@/components/ui';
import { space } from '@/theme';

/** Top bar for the staff onboarding screens: brand + avatar menu, no back (these are landings). */
export function StaffTopBar({ right }: { right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Row
      style={{
        paddingTop: insets.top + space.sm,
        paddingHorizontal: space.xl,
        paddingBottom: space.sm,
        justifyContent: 'space-between',
      }}>
      <BrandMark size={36} />
      {right}
    </Row>
  );
}
