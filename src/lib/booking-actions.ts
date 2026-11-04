import type { Booking, BookingStatus } from '@/lib/api';

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Mirrors `POLICY` in chairo-api. The API has no `can*` flags for these, so a stale answer ends in a mapped error. */
const CHECKIN_WINDOW_BEFORE_MIN = 30;
const DISPUTE_WINDOW_HOURS = 24;
const LATE_REPORT_WINDOW_HOURS = 24;
const LATE_REPORT_MIN_DELAY_MIN = 15;

const CHECKIN_STATUSES: BookingStatus[] = ['BOOKED', 'CONFIRMED', 'UNCONFIRMED', 'ARRIVED', 'IN_PROGRESS'];

type Rules = Pick<Booking, 'status' | 'startsAt' | 'endsAt' | 'delayMin' | 'noShowAt'>;

export function canCheckIn(b: Rules, now = new Date()) {
  const t = now.getTime();
  return (
    CHECKIN_STATUSES.includes(b.status) &&
    t >= new Date(b.startsAt).getTime() - CHECKIN_WINDOW_BEFORE_MIN * MIN &&
    t <= new Date(b.endsAt).getTime()
  );
}

export function canDispute(b: Rules, now = new Date()) {
  if (b.status !== 'NO_SHOW' || !b.noShowAt) return false;
  return now.getTime() - new Date(b.noShowAt).getTime() <= DISPUTE_WINDOW_HOURS * HOUR;
}

export function canReportLate(b: Rules, now = new Date()) {
  if (!['ARRIVED', 'IN_PROGRESS', 'DONE'].includes(b.status)) return false;
  const sinceStart = now.getTime() - new Date(b.startsAt).getTime();
  return (
    sinceStart >= 0 && sinceStart <= LATE_REPORT_WINDOW_HOURS * HOUR && (b.delayMin ?? 0) < LATE_REPORT_MIN_DELAY_MIN
  );
}

export type BookingAction = { kind: 'confirm' } | { kind: 'checkIn' } | { kind: 'late'; delayMin: number };

/** The one thing this booking needs from the customer right now. The order is the priority. */
export function nextAction(
  b: Rules & Pick<Booking, 'canReschedule'>,
  { now = new Date(), checkedIn = false }: { now?: Date; checkedIn?: boolean } = {},
): BookingAction | null {
  if (b.status === 'BOOKED' || b.status === 'UNCONFIRMED') return { kind: 'confirm' };
  if (!checkedIn && canCheckIn(b, now)) return { kind: 'checkIn' };
  if (b.delayMin && b.canReschedule) return { kind: 'late', delayMin: b.delayMin };
  return null;
}

/** The check-in QR holds `https://chairo.app/checkin/{shopId}?t={token}`. Returns null for any other QR code. */
export function parseCheckinToken(data: string): string | null {
  const token = /\/checkin\/[^?#]+\?(?:[^#]*&)?t=([^&#]+)/.exec(data)?.[1];
  return token ? decodeURIComponent(token) : null;
}
