import { router } from 'expo-router';
import { useState } from 'react';

import { TimeField } from '@/components/time-picker';
import { Button, Card, ErrorState, Row, Screen, ScreenHeader, Skeleton, Stack, Text, toast } from '@/components/ui';
import { useSaveShopHours, useShopHours } from '@/hooks/manage';
import { ar } from '@/i18n/ar';
import { errorMessage } from '@/lib/errors';
import { closesNextDay, dayError, toDays, toHoursPayload, type DayHours } from '@/lib/schedule';
import { useCurrentMembership } from '@/stores/mode';
import { Switch } from '@/components/gluestack/switch';
import { Box } from '@/components/gluestack/box';

/** Owner: when the shop is open, day by day. Customers can only book inside these hours. */
export default function ShopHoursScreen() {
  const m = useCurrentMembership();
  const shopId = m?.shopId ?? '';
  const hours = useShopHours(shopId);
  const save = useSaveShopHours(shopId);
  // Edits live in `draft`; until the first one, the days come straight from the server.
  const [draft, setDraft] = useState<DayHours[] | null>(null);
  const days = draft ?? (hours.data ? toDays(hours.data) : null);

  const edit = (change: (d: DayHours[]) => DayHours[]) => {
    if (days) setDraft(change(days));
  };
  const patch = (weekday: number, change: Partial<DayHours>) =>
    edit((d) => d.map((x) => (x.weekday === weekday ? { ...x, ...change } : x)));

  const copyToAll = (from: DayHours) => {
    edit((d) => d.map((x) => (x.isClosed ? x : { ...x, open: from.open, close: from.close })));
    toast(ar.manage.copyToAllDone);
  };

  const problem = days?.some(dayError) ?? false;
  const nobody = days?.every((d) => d.isClosed) ?? false;

  const submit = () => {
    if (!days || problem || nobody) return;
    save.mutate(toHoursPayload(days), {
      onSuccess: () => {
        toast(ar.manage.saved, 'success');
        router.back();
      },
      onError: (e) => toast(errorMessage(e), 'error'),
    });
  };

  return (
    <Screen
      keyboard
      header={<ScreenHeader title={ar.manage.shopHoursTitle} />}
      footer={
        <Button
          label={ar.manage.save}
          loading={save.isPending}
          disabled={!days || problem || nobody}
          onPress={submit}
        />
      }>
      <Stack className="gap-3 pt-2">
        <Text tone="textMuted">{ar.manage.shopHoursHint}</Text>
        {hours.isError && <ErrorState error={hours.error} onRetry={() => void hours.refetch()} />}
        {!days && !hours.isError && [0, 1, 2].map((i) => <Skeleton key={i} height={96} />)}
        {nobody && (
          <Text variant="caption" tone="danger" accessibilityRole="alert">
            {ar.manage.emptyHours}
          </Text>
        )}
        {days?.map((d) => (
          <Card key={d.weekday}>
            <Stack className="gap-3">
              <Row className="gap-3">
                <Text variant="heading" className="flex-1">
                  {ar.manage.weekdays[d.weekday]}
                </Text>
                <Text variant="label" tone={d.isClosed ? 'textSubtle' : 'primary'}>
                  {d.isClosed ? ar.manage.closed : ar.manage.open}
                </Text>
                <Switch
                  value={!d.isClosed}
                  onValueChange={(on) => patch(d.weekday, { isClosed: !on })}
                  accessibilityLabel={`${ar.manage.weekdays[d.weekday]}: ${ar.manage.open}`}
                />
              </Row>
              {!d.isClosed && (
                <Stack className="gap-2">
                  <Row className="gap-3 items-start">
                    <TimeField
                      label={ar.manage.from}
                      value={d.open}
                      onChange={(open) => patch(d.weekday, { open })}
                      error={dayError(d)}
                    />
                    <TimeField
                      label={ar.manage.to}
                      value={d.close}
                      onChange={(close) => patch(d.weekday, { close })}
                      error={dayError(d)}
                    />
                  </Row>
                  {dayError(d) ? (
                    <Text variant="caption" tone="danger" accessibilityRole="alert">
                      {ar.manage.sameTime}
                    </Text>
                  ) : closesNextDay(d.open, d.close) ? (
                    <Text variant="caption" tone="textSubtle">
                      {ar.manage.nextDay}
                    </Text>
                  ) : (
                    <Box />
                  )}
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth={false}
                    label={ar.manage.copyToAll}
                    onPress={() => copyToAll(d)}
                  />
                </Stack>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Screen>
  );
}
