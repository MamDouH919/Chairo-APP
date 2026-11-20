import {
  closesNextDay,
  dayError,
  formatTime12,
  fromWeekShifts,
  overlapping,
  toDays,
  toHoursPayload,
  toWeekShifts,
  weekProblem,
} from '@/lib/schedule';

describe('shop hours', () => {
  it('lists Saturday first and sends Sunday-first rows to the API', () => {
    const days = toDays([{ weekday: 1, open: '10:00', close: '22:00', closesNextDay: false, isClosed: false }]);
    expect(days.map((d) => d.weekday)).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(toHoursPayload(days).map((d) => d.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('treats a weekday the API did not return as closed', () => {
    expect(toDays([]).every((d) => d.isClosed)).toBe(true);
  });

  it('omits times for closed days', () => {
    const payload = toHoursPayload(toDays([{ weekday: 0, open: '09:00', close: '17:00', closesNextDay: false, isClosed: false }]));
    expect(payload[0]).toEqual({ weekday: 0, open: '09:00', close: '17:00', isClosed: false });
    expect(payload[1]).toEqual({ weekday: 1, isClosed: true });
  });

  it('flags equal open and close, and closing after midnight', () => {
    expect(dayError({ weekday: 0, open: '10:00', close: '10:00', isClosed: false })).toBe(true);
    expect(dayError({ weekday: 0, open: '10:00', close: '10:00', isClosed: true })).toBe(false);
    expect(closesNextDay('14:00', '01:00')).toBe(true);
    expect(closesNextDay('10:00', '22:00')).toBe(false);
  });

  it('formats 12-hour times', () => {
    expect(formatTime12('00:00')).toBe('12:00 ص');
    expect(formatTime12('13:30')).toBe('1:30 م');
    expect(formatTime12('12:15')).toBe('12:15 م');
  });
});

describe('barber shifts', () => {
  it('detects overlaps, including shifts past midnight', () => {
    expect(overlapping([{ start: '10:00', end: '14:00' }, { start: '16:00', end: '22:00' }])).toBe(false);
    expect(overlapping([{ start: '10:00', end: '14:00' }, { start: '13:00', end: '18:00' }])).toBe(true);
    expect(overlapping([{ start: '18:00', end: '02:00' }, { start: '23:00', end: '23:30' }])).toBe(true);
  });

  it('round-trips a week and keeps shifts in time order', () => {
    const week = toWeekShifts([
      { weekday: 2, start: '16:00', end: '20:00' },
      { weekday: 2, start: '09:00', end: '13:00' },
    ]);
    expect(week[2]).toEqual([{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }]);
    expect(fromWeekShifts(week)).toEqual([
      { weekday: 2, start: '09:00', end: '13:00' },
      { weekday: 2, start: '16:00', end: '20:00' },
    ]);
  });

  it('reports the first day that cannot be saved', () => {
    expect(weekProblem(toWeekShifts([]))).toBeNull();
    expect(weekProblem(toWeekShifts([{ weekday: 3, start: '10:00', end: '10:00' }]))).toEqual({ weekday: 3, kind: 'same' });
    expect(
      weekProblem(
        toWeekShifts([
          { weekday: 0, start: '10:00', end: '14:00' },
          { weekday: 0, start: '12:00', end: '16:00' },
        ]),
      ),
    ).toEqual({ weekday: 0, kind: 'overlap' });
  });
});
