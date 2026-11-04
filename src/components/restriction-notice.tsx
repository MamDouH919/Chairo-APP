import { router } from 'expo-router';
import { Ban, CalendarClock } from 'lucide-react-native';
import { View } from 'react-native';

import { useMyRecord } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { formatDayMonth } from '@/lib/format';
import { space } from '@/theme';

import { Card, Icon, Row, Text } from './ui';

/** Explains a booking restriction. Renders nothing for a customer without one. */
export function RestrictionNotice({ linkToRecord }: { linkToRecord?: boolean }) {
  const record = useMyRecord().data;
  if (!record || record.restriction === 'NONE') return null;
  const suspended = record.restriction === 'SUSPENDED_BOOKING';
  const until = record.restrictionUntil
    ? ar.record.until(formatDayMonth(record.restrictionUntil))
    : ar.record.untilChanged;
  const title = `${suspended ? ar.record.suspendedTitle : ar.record.sameDayTitle} (${until})`;
  const hint = suspended ? ar.record.suspendedHint : ar.record.sameDayHint;

  return (
    <Card
      tone="muted"
      onPress={linkToRecord ? () => router.push('/account/strikes') : undefined}
      accessibilityLabel={linkToRecord ? `${title}. ${hint} ${ar.record.openRecord}` : undefined}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <Icon icon={suspended ? Ban : CalendarClock} tone={suspended ? 'danger' : 'warning'} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="caption" tone="textMuted">
            {hint}
          </Text>
          {linkToRecord && (
            <Text variant="caption" tone="primary">
              {ar.record.openRecord}
            </Text>
          )}
        </View>
      </Row>
    </Card>
  );
}
