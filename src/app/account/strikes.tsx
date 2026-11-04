import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { NoteSheet } from '@/components/note-sheet';
import { RestrictionNotice } from '@/components/restriction-notice';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Skeleton,
  Stack,
  Text,
  toast,
} from '@/components/ui';
import { qk, useMyRecord } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type AppealStatus, type Strike } from '@/lib/api';
import { formatDayMonth, isPast } from '@/lib/format';
import { radius, space } from '@/theme';

const APPEAL_TONE: Record<Exclude<AppealStatus, 'NONE'>, 'info' | 'success' | 'danger'> = {
  PENDING: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export default function MyRecordScreen() {
  const qc = useQueryClient();
  const q = useMyRecord();
  const [appealing, setAppealing] = useState<string | null>(null);

  const appeal = useMutation({
    mutationFn: (note: string) => api.me.appealStrike(appealing!, note),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.record() });
      setAppealing(null);
      toast(ar.record.appealSent);
    },
  });

  const header = <ScreenHeader title={ar.record.title} />;
  if (!q.data) {
    return (
      <Screen header={header}>
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <Stack>
            <Skeleton height={96} radius={radius.xl} />
            <Skeleton height={140} radius={radius.xl} />
          </Stack>
        )}
      </Screen>
    );
  }

  const { active, history } = q.data;
  return (
    <Screen header={header} refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Stack gap={space.xxl}>
        <RestrictionNotice />

        <Card tone={active.length ? 'muted' : 'surface'}>
          <Row gap={space.md}>
            <Icon icon={active.length ? ShieldAlert : ShieldCheck} size="xl" tone={active.length ? 'warning' : 'success'} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">{active.length ? ar.record.activeTitle(active.length) : ar.record.clean}</Text>
              {!active.length && (
                <Text variant="caption" tone="textMuted">
                  {ar.record.cleanHint}
                </Text>
              )}
            </View>
          </Row>
        </Card>

        {active.length > 0 && (
          <View>
            <SectionHeader title={ar.record.active} />
            <Stack gap={space.sm}>
              {active.map((s) => (
                <StrikeCard key={s.id} strike={s} onAppeal={() => setAppealing(s.id)} />
              ))}
            </Stack>
          </View>
        )}

        {history.length > 0 && (
          <View>
            <SectionHeader title={ar.record.history} />
            <Stack gap={space.sm}>
              {history.map((s) => (
                <StrikeCard key={s.id} strike={s} />
              ))}
            </Stack>
          </View>
        )}
      </Stack>

      {appealing && (
        <NoteSheet
          title={ar.record.appealTitle}
          hint={ar.record.appealHint}
          label={ar.record.appealLabel}
          loading={appeal.isPending}
          error={appeal.error}
          onClose={() => {
            setAppealing(null);
            appeal.reset();
          }}
          onSubmit={(note) => appeal.mutate(note)}
        />
      )}
    </Screen>
  );
}

function StrikeCard({ strike: s, onAppeal }: { strike: Strike; onAppeal?: () => void }) {
  const bookingId = s.bookingId;
  return (
    <Card>
      <Stack gap={space.sm}>
        <Text variant="bodyStrong">{ar.record.source[s.source]}</Text>
        <Text variant="caption" tone="textSubtle">
          {ar.record.issuedOn(formatDayMonth(s.createdAt))} ·{' '}
          {(isPast(s.expiresAt) ? ar.record.expiredOn : ar.record.expiresOn)(formatDayMonth(s.expiresAt))}
        </Text>
        {s.appealStatus !== 'NONE' && (
          <View style={{ alignSelf: 'flex-start' }}>
            <Badge label={ar.record.appealStatus[s.appealStatus]} tone={APPEAL_TONE[s.appealStatus]} />
          </View>
        )}
        {s.resolutionNote && (
          <Text variant="caption" tone="textMuted">
            {s.resolutionNote}
          </Text>
        )}
        {(bookingId || s.canAppeal) && (
          <Row gap={space.sm}>
            {s.canAppeal && onAppeal && (
              <View style={{ flex: 1 }}>
                <Button label={ar.record.appeal} variant="secondary" size="md" onPress={onAppeal} />
              </View>
            )}
            {bookingId && (
              <View style={{ flex: 1 }}>
                <Button
                  label={ar.record.viewBooking}
                  variant="outline"
                  size="md"
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: bookingId } })}
                />
              </View>
            )}
          </Row>
        )}
      </Stack>
    </Card>
  );
}
