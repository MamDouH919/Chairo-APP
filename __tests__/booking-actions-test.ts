import { canCheckIn, canDispute, canReportLate, nextAction, parseCheckinToken } from '@/lib/booking-actions';
import type { BookingStatus } from '@/lib/api';

const NOW = new Date('2026-11-04T12:00:00.000Z');
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000).toISOString();

const booking = (
  status: BookingStatus,
  startsInMin: number,
  extra: { delayMin?: number | null; noShowAt?: string | null; canReschedule?: boolean } = {},
) => ({
  status,
  startsAt: minutes(startsInMin),
  endsAt: minutes(startsInMin + 30),
  delayMin: null,
  noShowAt: null,
  canReschedule: true,
  ...extra,
});

describe('nextAction', () => {
  it('asks to confirm first, even inside the check-in window or while the barber is late', () => {
    expect(nextAction(booking('BOOKED', 300), { now: NOW })).toEqual({ kind: 'confirm' });
    expect(nextAction(booking('UNCONFIRMED', 20), { now: NOW })).toEqual({ kind: 'confirm' });
    expect(nextAction(booking('BOOKED', 20, { delayMin: 15 }), { now: NOW })).toEqual({ kind: 'confirm' });
  });

  it('asks to check in from 30 minutes before the start', () => {
    expect(nextAction(booking('CONFIRMED', 31), { now: NOW })).toBeNull();
    expect(nextAction(booking('CONFIRMED', 30), { now: NOW })).toEqual({ kind: 'checkIn' });
  });

  it('moves on from check-in once the customer has checked in', () => {
    expect(nextAction(booking('CONFIRMED', 10), { now: NOW, checkedIn: true })).toBeNull();
    expect(nextAction(booking('CONFIRMED', 10, { delayMin: 15 }), { now: NOW, checkedIn: true })).toEqual({
      kind: 'late',
      delayMin: 15,
    });
  });

  it('shows the delay when the barber is running late and the booking can still move', () => {
    expect(nextAction(booking('CONFIRMED', 60, { delayMin: 10 }), { now: NOW })).toEqual({ kind: 'late', delayMin: 10 });
    expect(nextAction(booking('CONFIRMED', 60, { delayMin: 10, canReschedule: false }), { now: NOW })).toBeNull();
    expect(nextAction(booking('CONFIRMED', 60, { delayMin: 0 }), { now: NOW })).toBeNull();
  });

  it('has nothing to ask on finished bookings', () => {
    for (const status of ['DONE', 'CANCELLED', 'NO_SHOW'] as const) {
      expect(nextAction(booking(status, -60), { now: NOW })).toBeNull();
    }
  });
});

describe('canCheckIn', () => {
  it('closes when the booking ends', () => {
    expect(canCheckIn(booking('ARRIVED', -30), NOW)).toBe(true);
    expect(canCheckIn(booking('ARRIVED', -31), NOW)).toBe(false);
  });
  it('is closed for bookings that are over', () => {
    expect(canCheckIn(booking('CANCELLED', 10), NOW)).toBe(false);
  });
});

describe('canDispute', () => {
  it('is open for 24 hours after a no-show', () => {
    expect(canDispute(booking('NO_SHOW', -600, { noShowAt: minutes(-24 * 60) }), NOW)).toBe(true);
    expect(canDispute(booking('NO_SHOW', -2000, { noShowAt: minutes(-24 * 60 - 1) }), NOW)).toBe(false);
  });
  it('needs a no-show', () => {
    expect(canDispute(booking('DONE', -60), NOW)).toBe(false);
  });
});

describe('canReportLate', () => {
  it('is open for 24 hours from the start of a booking that took place', () => {
    expect(canReportLate(booking('DONE', -24 * 60), NOW)).toBe(true);
    expect(canReportLate(booking('DONE', -24 * 60 - 1), NOW)).toBe(false);
    expect(canReportLate(booking('ARRIVED', 5), NOW)).toBe(false);
    expect(canReportLate(booking('NO_SHOW', -60), NOW)).toBe(false);
  });
  it('is closed when the barber already reported 15+ minutes', () => {
    expect(canReportLate(booking('DONE', -60, { delayMin: 14 }), NOW)).toBe(true);
    expect(canReportLate(booking('DONE', -60, { delayMin: 15 }), NOW)).toBe(false);
  });
});

describe('parseCheckinToken', () => {
  it('reads the token from the check-in URL', () => {
    expect(parseCheckinToken('https://chairo.app/checkin/abc-123?t=tok%2Ben')).toBe('tok+en');
    expect(parseCheckinToken('https://chairo.app/checkin/abc?x=1&t=token#top')).toBe('token');
  });
  it('rejects other QR codes', () => {
    expect(parseCheckinToken('https://chairo.app/s/my-shop')).toBeNull();
    expect(parseCheckinToken('https://example.com/?t=token')).toBeNull();
    expect(parseCheckinToken('just text')).toBeNull();
  });
});
