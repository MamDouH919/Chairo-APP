import { env } from '@/config/env';
import { ar } from '@/i18n/ar';

import { addDays, localDate } from './dates';

/** Arabic words, Latin digits — easier to scan for times, prices and codes. */
const LOCALE = 'ar-EG-u-nu-latn';

const fmt = (opts: Intl.DateTimeFormatOptions, tz: string = env.timezone) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, ...opts });

export const formatTime = (iso: string, tz?: string) =>
  fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, tz).format(new Date(iso));

export const formatWeekday = (iso: string | Date, tz?: string) => fmt({ weekday: 'long' }, tz).format(new Date(iso));

export const formatDayMonth = (iso: string | Date, tz?: string) =>
  fmt({ day: 'numeric', month: 'long' }, tz).format(new Date(iso));

/** "النهارده" / "بكرة" / "الخميس 6 نوفمبر" */
export function formatRelativeDay(iso: string, tz: string = env.timezone) {
  const day = localDate(iso, tz);
  const today = localDate(new Date(), tz);
  if (day === today) return ar.common.today;
  if (day === addDays(today, 1)) return ar.common.tomorrow;
  return `${formatWeekday(iso, tz)} ${formatDayMonth(iso, tz)}`;
}

export const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

export const formatWhen =(iso: string, tz?: string) => `${formatRelativeDay(iso, tz)}، ${formatTime(iso, tz)}`;

export const formatPrice = (egp: number) => `${egp.toLocaleString('en-US')} ${ar.common.egp}`;

export const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)} س${min % 60 ? ` ${min % 60} د` : ''}` : `${min} ${ar.common.min}`;

export const formatRating = (v: number | string | null) => (v == null ? '—' : Number(v).toFixed(1));

/** Wrap in Unicode LTR isolates so digit groups don't get reordered inside Arabic text. */
export const ltr = (s: string) => `\u2066${s}\u2069`;

/** +201012345678 → 0101 234 5678 */
export function formatPhone(e164: string) {
  const local = e164.replace(/^\+20/, '0');
  return ltr(local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local);
}

/** Accepts Arabic-Indic digits and spaces; returns 11-digit local or null. */
export function normalizeEgyptPhone(input: string): string | null {
  const digits = input
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '')
    .replace(/^20(?=1)/, '0')
    .replace(/^(?=1[0125])/, '0');
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

export const toE164 = (local: string) => `+2${local}`;

/** wa.me wants the international number, digits only: +20 101… or 0101… → 20101… */
export const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0(?=1)/, '20')}`;

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'دلوقتي';
  if (min < 60) return `من ${min} د`;
  const h = Math.round(min / 60);
  if (h < 24) return `من ${h} س`;
  const d = Math.round(h / 24);
  return d === 1 ? 'امبارح' : `من ${d} يوم`;
}
