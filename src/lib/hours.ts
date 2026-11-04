import type { ShopHours } from './api/types';
import { addDays, hhmmToMin, localDate, weekdayOf } from './dates';

/** Minutes since local midnight in a zone */
const nowMinutes = (tz: string) => {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date())
    .split(':')
    .map(Number);
  return p[0] * 60 + p[1];
};

const span = (h: ShopHours | undefined) => {
  if (!h || h.isClosed || !h.open || !h.close) return null;
  const open = hhmmToMin(h.open);
  let close = hhmmToMin(h.close);
  if (close <= open) close += 1440;
  return { open, close };
};

/** Handles "14:00 → 01:00" shifts: yesterday's shift can still be running after midnight. */
export function isOpenNow(hours: ShopHours[], tz: string) {
  const today = localDate(new Date(), tz);
  const now = nowMinutes(tz);
  const t = span(hours.find((h) => h.weekday === weekdayOf(today)));
  const y = span(hours.find((h) => h.weekday === weekdayOf(addDays(today, -1))));
  return (!!t && now >= t.open && now < t.close) || (!!y && now + 1440 < y.close);
}

export const todayWeekday = (tz: string) => weekdayOf(localDate(new Date(), tz));

/** First shop-local date (today included) the shop is open, within its booking window. */
export function firstOpenDay(hours: ShopHours[], tz: string, maxAdvanceDays: number) {
  const today = localDate(new Date(), tz);
  for (let i = 0; i <= maxAdvanceDays; i++) {
    const d = addDays(today, i);
    if (!hours.find((h) => h.weekday === weekdayOf(d))?.isClosed) return d;
  }
  return today;
}
