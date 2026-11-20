import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';

import { TimeField } from '@/components/time-picker';
import { Switch } from '@/components/gluestack/switch';
import {
  Button,
  Card,
  ErrorState,
  IconButton,
  Row,
  Screen,
  ScreenHeader,
  Skeleton,
  Stack,
  Text,
  toast,
} from '@/components/ui';
import { useSaveWorkingHours, useShopHours, useWorkingHours } from '@/hooks/manage';
import { ar } from '@/i18n/ar';
import { errorMessage } from '@/lib/errors';
import {
  WEEK_ORDER,
  closesNextDay,
  fromWeekShifts,
  overlapping,
  shiftError,
  toWeekShifts,
  weekProblem,
  type Shift,
  type WeekShifts,
} from '@/lib/schedule';
import { useCurrentMembership } from '@/stores/mode';

/** One chair's weekly shifts. Own chair for a barber; any chair for the owner. Split shifts are fine. */
export default function BarberHours() {
  const { barberId = '', name = '' } = useLocalSearchParams<{ barberId: string; name?: string }>();
  const m = useCurrentMembership();
  const shopId = m?.shopId ?? '';
  const mine = barberId === m?.barberId;
  const shifts = useWorkingHours(shopId, barberId);
  const shopHours = useShopHours(shopId);
  const save = useSaveWorkingHours(shopId, barberId);
  // Edits live in `draft`; until the first one, the week comes straight from the server.
  const [draft, setDraft] = useState<WeekShifts | null>(null);
  const week = draft ?? (shifts.data ? toWeekShifts(shifts.data) : null);

  const setDay = (weekday: number, next: Shift[]) => week && setDraft({ ...week, [weekday]: next });

  const toggle = (weekday: number, on: boolean) => {
    // Turning a day on starts from the shop's hours for that day, so most barbers never touch a clock.
    const h = shopHours.data?.find((x) => x.weekday === weekday);
    const start = !h || h.isClosed || !h.open ? '12:00' : h.open;
    const end = !h || h.isClosed || !h.close ? '20:00' : h.close;
    setDay(weekday, on ? [{ start, end }] : []);
  };

  const useShop = () => {
    if (!shopHours.data) return;
    const next: WeekShifts = {};
    for (const w of WEEK_ORDER) {
      const h = shopHours.data.find((x) => x.weekday === w);
      next[w] = h && !h.isClosed && h.open && h.close ? [{ start: h.open, end: h.close }] : [];
    }
    setDraft(next);
    toast(ar.manage.useShopHoursDone);
  };

  const problem = week ? weekProblem(week) : null;

  const submit = () => {
    if (!week || problem) return;
    save.mutate(fromWeekShifts(week), {
      onSuccess: (r) => {
        if (r.bookingsOutsideHours.length > 0) toast(ar.manage.bookingsOutside);
        else if (r.warnings.length > 0) toast(ar.manage.outsideShop);
        else toast(ar.manage.saved, 'success');
        router.back();
      },
      onError: (e) => toast(errorMessage(e), 'error'),
    });
  };

  return (
    <Screen
      keyboard
      header={<ScreenHeader title={mine ? ar.manage.myHoursTitle : ar.manage.barberHoursOf(name)} />}
      footer={
        <Button label={ar.manage.save} loading={save.isPending} disabled={!week || !!problem} onPress={submit} />
      }>
      <Stack className="gap-3 pt-2">
        <Text tone="textMuted">{ar.manage.myHoursHint}</Text>
        {shifts.isError && <ErrorState error={shifts.error} onRetry={() => void shifts.refetch()} />}
        {!week && !shifts.isError && [0, 1, 2].map((i) => <Skeleton key={i} height={96} />)}
        {week && shopHours.data && <Button variant="secondary" label={ar.manage.useShopHours} onPress={useShop} />}
        {problem && (
          <Text variant="caption" tone="danger" accessibilityRole="alert">
            {ar.manage.weekdays[problem.weekday]}:{' '}
            {problem.kind === 'same'
              ? ar.manage.sameTime
              : problem.kind === 'overlap'
                ? ar.manage.overlap
                : ar.manage.tooMany}
          </Text>
        )}
        {week &&
          WEEK_ORDER.map((weekday) => {
            const day = week[weekday] ?? [];
            const on = day.length > 0;
            const clash = overlapping(day);
            return (
              <Card key={weekday}>
                <Stack className="gap-3">
                  <Row className="gap-3">
                    <Text variant="heading" className="flex-1">
                      {ar.manage.weekdays[weekday]}
                    </Text>
                    <Text variant="label" tone={on ? 'primary' : 'textSubtle'}>
                      {on ? ar.manage.working : ar.manage.dayOff}
                    </Text>
                    <Switch
                      value={on}
                      onValueChange={(v) => toggle(weekday, v)}
                      accessibilityLabel={`${ar.manage.weekdays[weekday]}: ${ar.manage.working}`}
                    />
                  </Row>
                  {day.map((s, i) => (
                    <Stack key={i} className="gap-1">
                      <Row className="gap-3 items-end">
                        <TimeField
                          label={ar.manage.from}
                          value={s.start}
                          error={shiftError(s) || clash}
                          onChange={(start) =>
                            setDay(
                              weekday,
                              day.map((x, j) => (j === i ? { ...x, start } : x)),
                            )
                          }
                        />
                        <TimeField
                          label={ar.manage.to}
                          value={s.end}
                          error={shiftError(s) || clash}
                          onChange={(end) =>
                            setDay(
                              weekday,
                              day.map((x, j) => (j === i ? { ...x, end } : x)),
                            )
                          }
                        />
                        {day.length > 1 && (
                          <IconButton
                            icon={Trash2}
                            label={ar.manage.removeShift}
                            variant="ghost"
                            onPress={() =>
                              setDay(
                                weekday,
                                day.filter((_, j) => j !== i),
                              )
                            }
                          />
                        )}
                      </Row>
                      {!shiftError(s) && closesNextDay(s.start, s.end) && (
                        <Text variant="caption" tone="textSubtle">
                          {ar.manage.nextDay}
                        </Text>
                      )}
                    </Stack>
                  ))}
                  {on && (
                    <Button
                      variant="ghost"
                      size="md"
                      fullWidth={false}
                      icon={Plus}
                      label={ar.manage.addShift}
                      onPress={() => setDay(weekday, [...day, { start: '18:00', end: '22:00' }])}
                    />
                  )}
                </Stack>
              </Card>
            );
          })}
      </Stack>
    </Screen>
  );
}
