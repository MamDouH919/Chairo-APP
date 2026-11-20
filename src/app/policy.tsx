import { router } from 'expo-router';

import { Box } from '@/components/gluestack/box';
import { Button, Card, ErrorState, Row, Screen, ScreenHeader, Skeleton, Stack, Text } from '@/components/ui';
import { usePolicy } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { radius } from '@/theme';

/** The policy text comes from the API (built from the same numbers the server enforces). */
export default function PolicyScreen() {
  const q = usePolicy();

  return (
    <Screen
      header={<ScreenHeader title={ar.policy.title} />}
      footer={<Button label={ar.policy.accept} onPress={() => router.back()} />}>
      <Stack className="gap-4">
        <Text tone="textMuted">{ar.policy.intro}</Text>
        {q.isPending ? (
          <Skeleton height={360} radius={radius.xl} />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <Card className="gap-4">
            {q.data.ar.map((line, i) => (
              <Row key={i} className="items-start gap-3">
                <Box className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-secondary">
                  <Text variant="label" tone="onPrimarySoft">
                    {i + 1}
                  </Text>
                </Box>
                <Text className="flex-1">{line}</Text>
              </Row>
            ))}
          </Card>
        )}
      </Stack>
    </Screen>
  );
}
