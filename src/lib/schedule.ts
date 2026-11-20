import type { ShopHours, ShopHoursInput, WorkingShift } from './api/types';
import { hhmmToMin } from './dates';

/** Saturday first, the way the week reads in Egypt. API weekdays: 0 = Sunday. */
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

export interface DayHours {
  weekday: number;
  open: string;
  close: string;
  isClosed: boolean;
}

export const DEFAULT_OPEN = '12:00';
export const DEFAULT_CLOSE = '01:00';

/** The API's 7 rows (any order) → one editable row per weekday, Saturday first. */
export function toDays(hours: ShopHours[]): DayHours[] {
  return WEEK_ORDER.map((weekday) => {
    const h = hours.find((x) => x.weekday === weekday);
    return {
      weekday,
      open: h?.open ?? DEFAULT_OPEN,
      close: h?.close ?? DEFAULT_CLOSE,
      // a day the API has no row for is closed, not "open with made-up hours"
      isClosed: h ? h.isClosed : true,
    };
  });
}

export const toHoursPayload = (days: DayHours[]): ShopHoursInput[] =>
  [...days]
    .sort((a, b) => a.weekday - b.weekday)
    .map((d) =>
      d.isClosed ? { weekday: d.weekday, isClosed: true } : { weekday: d.weekday, open: d.open, close: d.close, isClosed: false },
    );

/** Opening and closing at the same minute is almost certainly a slip, and the API rejects it. */
export const dayError = (d: DayHours) => !d.isClosed && d.open === d.close;

export const closesNextDay = (open: string, close: string) => hhmmToMin(close) <= hhmmToMin(open);

/** "13:30" → "1:30 م". Latin digits, Arabic day-part. */
export function formatTime12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const part = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${part}`;
}

export interface Shift {
  start: string;
  end: string;
}

/** Shift as a minute range; "18:00 → 01:00" runs past midnight. */
const range = (s: Shift) => {
  const start = hhmmToMin(s.start);
  let end = hhmmToMin(s.end);
  if (end <= start) end += 1440;
  return { start, end };
};

export const shiftError = (s: Shift) => s.start === s.end;

/** True when two shifts of the same day share any minute. */
export function overlapping(shifts: Shift[]) {
  const sorted = shifts.map(range).sort((a, b) => a.start - b.start);
  return sorted.some((r, i) => i > 0 && r.start < sorted[i - 1].end);
}

export type WeekShifts = Record<number, Shift[]>;

export function toWeekShifts(shifts: WorkingShift[]): WeekShifts {
  const week: WeekShifts = {};
  for (const w of WEEK_ORDER) week[w] = [];
  for (const s of shifts) week[s.weekday]?.push({ start: s.start, end: s.end });
  for (const w of WEEK_ORDER) week[w].sort((a, b) => hhmmToMin(a.start) - hhmmToMin(b.start));
  return week;
}

export const fromWeekShifts = (week: WeekShifts): WorkingShift[] =>
  WEEK_ORDER.flatMap((weekday) => (week[weekday] ?? []).map((s) => ({ weekday, ...s })));

/** What blocks saving, if anything: first offending weekday. The API allows at most 28 shifts. */
export function weekProblem(week: WeekShifts): { weekday: number; kind: 'same' | 'overlap' | 'tooMany' } | null {
  if (fromWeekShifts(week).length > 28) return { weekday: WEEK_ORDER[0], kind: 'tooMany' };
  for (const weekday of WEEK_ORDER) {
    const day = week[weekday] ?? [];
    if (day.some(shiftError)) return { weekday, kind: 'same' };
    if (overlapping(day)) return { weekday, kind: 'overlap' };
  }
  return null;
}

/** Hours picked on the clock: every 15 minutes is plenty for a barber's day. */
export const MINUTE_CHOICES = ['00', '15', '30', '45'] as const;
