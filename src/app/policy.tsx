import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, ErrorState, Row, Screen, ScreenHeader, Skeleton, Stack, Text } from '@/components/ui';
import { usePolicy } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { radius, space, useTheme } from '@/theme';

/** The policy text comes from the API (built from the same numbers the server enforces). */
export default function PolicyScreen() {
  const { colors } = useTheme();
  const q = usePolicy();

  return (
    <Screen
      header={<ScreenHeader title={ar.policy.title} />}
      footer={<Button label={ar.policy.accept} onPress={() => router.back()} />}>
      <Stack gap={space.lg}>
        <Text tone="textMuted">{ar.policy.intro}</Text>
        {q.isPending ? (
          <Skeleton height={360} radius={radius.xl} />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <Card style={{ gap: space.lg }}>
            {q.data.ar.map((line, i) => (
              <Row key={i} gap={space.md} style={{ alignItems: 'flex-start' }}>
                <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
                  <Text variant="label" tone="onPrimarySoft">
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1 }}>{line}</Text>
              </Row>
            ))}
          </Card>
        )}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
