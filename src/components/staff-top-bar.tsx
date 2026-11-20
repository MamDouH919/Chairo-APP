import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand';
import { Row } from '@/components/ui';

/** Top bar for the staff onboarding screens: brand + avatar menu, no back (these are landings). */
export function StaffTopBar({ right }: { right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Row className="justify-between px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
      <BrandMark size={36} />
      {right}
    </Row>
  );
}
