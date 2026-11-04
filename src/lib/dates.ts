/** Time-zone helpers. The API speaks UTC; shops live in their own zone (Africa/Cairo). */

const partsIn = (ts: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, mi: get('minute'), s: get('second') };
};

const offsetMs = (ts: number, timeZone: string) => {
  const p = partsIn(ts, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
};

/** 'YYYY-MM-DD' of an instant in a zone */
export const localDate = (at: Date | string | number, timeZone: string) => {
  const p = partsIn(new Date(at).getTime(), timeZone);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
};

/** Shop-local wall time → UTC instant. `minutes` may exceed 1440 (after midnight). */
export const zonedTime = (date: string, minutes: number, timeZone: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const first = guess - offsetMs(guess, timeZone);
  return new Date(guess - offsetMs(first, timeZone));
};

export const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

/** 0 = Sunday, like the API's `weekday` */
export const weekdayOf = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const hhmmToMin = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};
