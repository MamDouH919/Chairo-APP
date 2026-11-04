import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, BellRing, CheckCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  LoadMore,
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
import { radius, space, useTheme } from '@/theme';

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
        <Row
          style={{
            paddingTop: insets.top + space.lg,
            paddingHorizontal: space.xl,
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
          }}>
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
      <View style={{ paddingTop: space.lg }}>
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
          <Stack gap={space.sm}>
            {q.data.map((n) => (
              <NotificationItem key={n.id} n={n} onPress={() => open(n)} />
            ))}
            <LoadMore query={q} />
          </Stack>
        )}
      </View>
    </Screen>
  );
}

function NotificationItem({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const { colors } = useTheme();
  const unread = !n.readAt;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'غير مقروء، ' : ''}${n.title}، ${n.body}`}
      onPress={onPress}>
      {({ pressed }) => (
        <Card style={[{ opacity: pressed ? 0.85 : 1 }, unread && { borderColor: colors.primary }]}>
          <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
            <View style={[styles.icon, { backgroundColor: unread ? colors.primarySoft : colors.surfaceMuted }]}>
              <Icon icon={BellRing} size="md" tone={unread ? 'primary' : 'textSubtle'} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {n.title}
                </Text>
                <Text variant="caption" tone="textSubtle">
                  {timeAgo(n.createdAt)}
                </Text>
              </Row>
              <Text variant="caption" tone="textMuted">
                {n.body}
              </Text>
            </View>
            {unread && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 9 },
});
