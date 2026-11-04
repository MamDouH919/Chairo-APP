import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ErrorState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  Sheet,
  Skeleton,
  Stack,
  Text,
  toast,
} from '@/components/ui';
import { qk, useSessions } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type Session } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { radius, space } from '@/theme';

export default function Sessions() {
  const qc = useQueryClient();
  const q = useSessions();
  const [askLogoutAll, setAskLogoutAll] = useState(false);

  const revoke = useMutation({
    mutationFn: api.auth.revokeSession,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.sessions() });
      toast(ar.sessions.revoked);
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });
  const logoutAll = useMutation({
    mutationFn: api.auth.logoutAll,
    // This device's session is gone too, so there's nothing left to log out on the server.
    onSuccess: () => useAuth.getState().signOut({ remote: false }),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const header = <ScreenHeader title={ar.sessions.title} />;
  if (!q.data) {
    return (
      <Screen header={header}>
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <Stack>
            <Skeleton height={96} radius={radius.xl} />
            <Skeleton height={96} radius={radius.xl} />
          </Stack>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      footer={<Button label={ar.sessions.logoutAll} variant="danger" onPress={() => setAskLogoutAll(true)} />}>
      <Stack gap={space.lg}>
        <Text tone="textMuted">{ar.sessions.hint}</Text>
        <Stack gap={space.sm}>
          {q.data.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              revoking={revoke.isPending && revoke.variables === s.id}
              onRevoke={() => revoke.mutate(s.id)}
            />
          ))}
        </Stack>
      </Stack>

      <Sheet visible={askLogoutAll} onClose={() => setAskLogoutAll(false)}>
        <Text variant="heading" align="center" accessibilityRole="header">
          {ar.sessions.logoutAllConfirm}
        </Text>
        <Stack gap={space.sm} style={{ alignSelf: 'stretch', marginTop: space.sm }}>
          <Button
            label={ar.sessions.logoutAll}
            variant="danger"
            loading={logoutAll.isPending}
            onPress={() => logoutAll.mutate()}
          />
          <Button label={ar.common.cancel} variant="ghost" onPress={() => setAskLogoutAll(false)} />
        </Stack>
      </Sheet>
    </Screen>
  );
}

function SessionCard({
  session: s,
  revoking,
  onRevoke,
}: {
  session: Session;
  revoking: boolean;
  onRevoke: () => void;
}) {
  return (
    <Card>
      <Stack gap={space.md}>
        <Row gap={space.md}>
          <Icon icon={Smartphone} tone="textMuted" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {s.userAgent ?? ar.sessions.unknownDevice}
            </Text>
            <Text variant="caption" tone="textSubtle">
              {ar.sessions.lastUsed(timeAgo(s.lastUsedAt))}
            </Text>
          </View>
          {s.isCurrent && <Badge label={ar.sessions.thisDevice} tone="success" />}
        </Row>
        {!s.isCurrent && (
          <Button label={ar.sessions.revoke} variant="outline" size="md" loading={revoking} onPress={onRevoke} />
        )}
      </Stack>
    </Card>
  );
}
