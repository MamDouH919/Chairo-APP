import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, BellRing, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/gluestack/box';

import {
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  LoadMore,
  PressableScale,
  Reveal,
  Row,
  Screen,
  Skeleton,
  Stack,
  Text,
} from '@/components/ui';
import { qk, useNotifications } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type AppNotification } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { radius } from '@/theme';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const q = useNotifications();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.notifications() });

  const markAll = useMutation({ mutationFn: api.notifications.markAllRead, onSuccess: refresh });
  const markOne = useMutation({ mutationFn: api.notifications.markRead, onSuccess: refresh });
  const hasUnread = q.data?.some((n) => !n.readAt);

  const open = (n: AppNotification) => {
    if (!n.readAt) markOne.mutate(n.id);
    const bookingId = typeof n.data?.bookingId === 'string' ? n.data.bookingId : null;
    if (bookingId) router.push({ pathname: '/booking/[id]', params: { id: bookingId } });
  };

  return (
    <Screen
      edgeBottom={false}
      header={
        <Row className="w-full max-w-170 justify-between self-center px-5" style={{ paddingTop: insets.top + 16 }}>
          <Text variant="title" accessibilityRole="header">
            {ar.notifications.title}
          </Text>
          {hasUnread && (
            <IconButton
              icon={CheckCheck}
              label={ar.notifications.markAll}
              variant="ghost"
              onPress={() => markAll.mutate()}
            />
          )}
        </Row>
      }
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}>
      <Box className="pt-4">
        {q.isPending ? (
          <Stack>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={84} radius={radius.xl} />
            ))}
          </Stack>
        ) : !q.data ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.data.length === 0 ? (
          <EmptyState icon={Bell} title={ar.notifications.empty} hint={ar.notifications.emptyHint} />
        ) : (
          <Stack className="gap-2">
            {q.data.map((n, i) => (
              <Reveal key={n.id} index={i}>
                <NotificationItem n={n} onPress={() => open(n)} />
              </Reveal>
            ))}
            <LoadMore query={q} />
          </Stack>
        )}
      </Box>
    </Screen>
  );
}

function NotificationItem({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const unread = !n.readAt;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'غير مقروء، ' : ''}${n.title}، ${n.body}`}
      onPress={onPress}
      scaleTo={0.98}
      dim={0.9}>
      <Card className={unread ? 'border-primary' : ''}>
        <Row className="items-start gap-3">
          <Box className={`h-10 w-10 items-center justify-center rounded-md ${unread ? 'bg-secondary' : 'bg-muted'}`}>
            <Icon icon={BellRing} size="md" tone={unread ? 'primary' : 'textSubtle'} />
          </Box>
          <Box className="flex-1 gap-0.5">
            <Row className="justify-between">
              <Text variant="bodyStrong" className="flex-1" numberOfLines={1}>
                {n.title}
              </Text>
              <Text variant="caption" tone="textSubtle">
                {timeAgo(n.createdAt)}
              </Text>
            </Row>
            <Text variant="caption" tone="textMuted">
              {n.body}
            </Text>
          </Box>
          {unread && <Box className="mt-2 h-2 w-2 rounded-full bg-primary" />}
        </Row>
      </Card>
    </PressableScale>
  );
}
