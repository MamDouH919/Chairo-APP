import { addDays, hhmmToMin, localDate, weekdayOf, zonedTime } from '@/lib/dates';

import { ApiError } from '../http';
import type { ChairoApi } from '../live';
import type {
  AppNotification,
  Booking,
  BookingDetail,
  BookingRestriction,
  BookingStatus,
  PublicShop,
  Session,
  Slot,
  Strike,
  User,
} from '../types';
import { mockNotifications, mockPolicy, mockShops } from './data';

/**
 * In-memory backend with the same rules the real API enforces for customers
 * (2 active bookings, 2 h free-cancel, policy acceptance, idempotency, slot clashes).
 * Resets on reload. Any 6-digit code works; the dev code is 123456.
 */

const wait = (ms = 350 + Math.random() * 300) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const fail = (code: string, status = 409, details?: unknown): never => {
  throw new ApiError(code, code, status, details);
};

const ACTIVE: BookingStatus[] = ['BOOKED', 'CONFIRMED', 'UNCONFIRMED', 'ARRIVED', 'IN_PROGRESS'];
const CANCELLABLE: BookingStatus[] = ['BOOKED', 'CONFIRMED', 'UNCONFIRMED'];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** No 0/O/1/I — the customer reads this code out loud at the shop. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const db = {
  user: null as User | null,
  policyAccepted: false,
  bookings: [] as (Omit<Booking, 'canCancel' | 'canReschedule' | 'isLateIfCancelledNow'> & {
    timeline: BookingDetail['timeline'];
  })[],
  notifications: mockNotifications(),
  idempotency: new Map<string, string>(),
  restriction: 'NONE' as BookingRestriction,
  restrictionUntil: null as string | null,
  strikes: [] as Omit<Strike, 'canAppeal'>[],
  lateReports: new Set<string>(),
  sessions: [
    {
      id: 'session-current',
      deviceId: 'this-device',
      userAgent: 'iPhone',
      ip: null,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
      isCurrent: true,
    },
    {
      id: 'session-tablet',
      deviceId: 'other-device',
      userAgent: 'iPad',
      ip: null,
      lastUsedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      createdAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
      isCurrent: false,
    },
  ] as Session[],
};

type MockBooking = (typeof db.bookings)[number];

/** Seed: upcoming + finished + a recent no-show with its strike, so every lifecycle screen has real states. */
function seedBooking(
  daysFromToday: number,
  minutes: number,
  status: BookingStatus,
  barberIdx: number,
  serviceIdx: number,
): MockBooking {
  const shop = mockShops[0];
  const barber = shop.barbers[barberIdx];
  const service = shop.services[serviceIdx];
  const start = zonedTime(addDays(localDate(new Date(), shop.timezone), daysFromToday), minutes, shop.timezone);
  const at = new Date(start.getTime() - 2 * 86_400_000).toISOString();
  const done = status === 'DONE';
  return {
    id: 'bk-seed-' + daysFromToday,
    code: done ? 'K7MPR' : 'H4QTX',
    status,
    source: 'APP',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + service.durationMin * 60_000).toISOString(),
    durationMin: service.durationMin,
    priceEgp: service.priceEgp,
    delayMin: null,
    note: null,
    confirmedAt: done ? at : null,
    arrivedAt: null,
    startedAt: null,
    completedAt: done ? start.toISOString() : null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    isLateCancel: false,
    noShowAt: null,
    createdAt: at,
    shop: { id: shop.id, name: shop.name, slug: shop.slug, address: shop.address, timezone: shop.timezone },
    barber: { id: barber.id, displayName: barber.displayName, photoUrl: null },
    service: { id: service.id, name: service.name, nameEn: service.nameEn },
    timeline: done
      ? [
          { fromStatus: null, toStatus: 'BOOKED', actorType: 'CUSTOMER', meta: null, at },
          { fromStatus: 'BOOKED', toStatus: 'CONFIRMED', actorType: 'CUSTOMER', meta: null, at },
          { fromStatus: 'CONFIRMED', toStatus: 'DONE', actorType: 'BARBER', meta: null, at: start.toISOString() },
        ]
      : [{ fromStatus: null, toStatus: 'BOOKED', actorType: 'CUSTOMER', meta: null, at }],
  };
}
db.bookings.push(seedBooking(2, 19 * 60 + 30, 'BOOKED', 0, 0), seedBooking(-6, 18 * 60, 'DONE', 1, 2));
const seedNoShow = seedBooking(-1, 12 * 60, 'NO_SHOW', 1, 0);
seedNoShow.code = 'N3VWZ';
seedNoShow.noShowAt = new Date(Date.now() - 3 * HOUR).toISOString();
seedNoShow.timeline.push({
  fromStatus: 'BOOKED',
  toStatus: 'NO_SHOW',
  actorType: 'BARBER',
  meta: null,
  at: seedNoShow.noShowAt,
});
db.bookings.push(seedNoShow);
db.strikes.push(
  {
    id: 'strike-no-show',
    source: 'NO_SHOW',
    bookingId: seedNoShow.id,
    createdAt: seedNoShow.noShowAt,
    expiresAt: new Date(Date.now() + 60 * DAY).toISOString(),
    appealStatus: 'NONE',
    appealedAt: null,
    resolutionNote: null,
  },
  {
    id: 'strike-old',
    source: 'LATE_CANCELS',
    bookingId: null,
    createdAt: new Date(Date.now() - 90 * DAY).toISOString(),
    expiresAt: new Date(Date.now() - 30 * DAY).toISOString(),
    appealStatus: 'NONE',
    appealedAt: null,
    resolutionNote: null,
  },
);

const isActiveStrike = (s: Omit<Strike, 'canAppeal'>) =>
  new Date(s.expiresAt).getTime() > Date.now() && s.appealStatus !== 'ACCEPTED';
const strikeView = (s: Omit<Strike, 'canAppeal'>): Strike => ({
  ...s,
  canAppeal: s.appealStatus === 'NONE' && isActiveStrike(s),
});
const paged = <T>(all: T[], page: number, limit = 20) => ({
  items: all.slice((page - 1) * limit, page * limit),
  meta: { page, limit, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / limit)) },
});

const shopById = (id: string) => mockShops.find((s) => s.id === id) ?? fail('SHOP_NOT_FOUND', 404);
const shopBySlug = (slug: string) => mockShops.find((s) => s.slug === slug) ?? fail('SHOP_NOT_FOUND', 404);

const view = (b: (typeof db.bookings)[number]): BookingDetail => {
  const msLeft = new Date(b.startsAt).getTime() - Date.now();
  const canCancel = CANCELLABLE.includes(b.status);
  // Copy nested data: a real response is a fresh object, never a reference to server state.
  return {
    ...structuredClone(b),
    canCancel,
    canReschedule: canCancel && (!!b.delayMin || msLeft >= 2 * HOUR),
    isLateIfCancelledNow: canCancel && msLeft < 2 * HOUR,
  };
};

const pushNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'readAt' | 'data'>) =>
  db.notifications.unshift({ ...n, id: uid(), data: null, readAt: null, createdAt: new Date().toISOString() });

/** Stable pseudo-random "busy" pattern so the grid looks lived-in but doesn't jump on refetch. */
const isBusy = (barberId: string, ts: number) => {
  let h = 0;
  const key = barberId + Math.floor(ts / (15 * 60_000));
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % 10 < 3;
};

function barberSlots(shop: PublicShop, barberId: string, durationMin: number, date: string): Slot[] {
  const day = shop.hours.find((h) => h.weekday === weekdayOf(date));
  if (!day || day.isClosed || !day.open || !day.close) return [];
  const open = hhmmToMin(day.open);
  let close = hhmmToMin(day.close);
  if (close <= open) close += 1440;
  const earliest = Date.now() + 10 * 60_000;
  const taken = db.bookings.filter((b) => b.barber.id === barberId && ACTIVE.includes(b.status));
  const out: Slot[] = [];
  for (let m = open; m + durationMin <= close; m += 15) {
    const start = zonedTime(date, m, shop.timezone).getTime();
    const end = start + durationMin * 60_000;
    if (start < earliest || isBusy(barberId, start)) continue;
    const clash = taken.some((b) => start < new Date(b.endsAt).getTime() && end > new Date(b.startsAt).getTime());
    if (!clash) out.push({ startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString() });
  }
  return out;
}

export const mockApi: ChairoApi = {
  auth: {
    async requestOtp() {
      await wait();
      return { resendInSeconds: 60, expiresInSeconds: 300, devCode: '123456' };
    },
    async verifyOtp({ phone, code, name }) {
      await wait();
      if (!/^\d{6}$/.test(code) || code === '000000') fail('OTP_INVALID', 400, { attemptsLeft: 2 });
      const isNewUser = !db.user || db.user.phone !== phone;
      if (isNewUser) {
        db.user = {
          id: 'user-' + uid(),
          phone,
          name: name ?? null,
          avatarUrl: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          locale: 'ar',
          createdAt: new Date().toISOString(),
        };
      }
      return {
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh.' + uid(),
        expiresIn: 900,
        tokenType: 'Bearer',
        isNewUser: isNewUser || !db.user!.name,
        user: db.user!,
      };
    },
    async logout() {
      await wait(150);
    },
    async logoutAll() {
      await wait();
      db.sessions = db.sessions.filter((s) => s.isCurrent);
    },
    async sessions() {
      await wait();
      return structuredClone(db.sessions);
    },
    async revokeSession(id) {
      await wait();
      db.sessions = db.sessions.filter((s) => s.id !== id);
    },
  },

  me: {
    async get() {
      await wait(150);
      return db.user ?? fail('UNAUTHENTICATED', 401);
    },
    async update(patch) {
      await wait();
      if (!db.user) fail('UNAUTHENTICATED', 401);
      db.user = { ...db.user!, ...patch };
      return db.user!;
    },
    async acceptPolicy() {
      await wait(200);
      db.policyAccepted = true;
    },
    async record() {
      await wait();
      const active = db.strikes.filter(isActiveStrike);
      return {
        restriction: db.restriction,
        restrictionUntil: db.restrictionUntil,
        recordClean: db.strikes.length === 0,
        policyAcceptedAt: db.policyAccepted ? new Date().toISOString() : null,
        active: active.map(strikeView),
        history: db.strikes.filter((s) => !active.includes(s)).map(strikeView),
      };
    },
    async appealStrike(id, _note) {
      await wait();
      const s = db.strikes.find((x) => x.id === id) ?? fail('STRIKE_NOT_FOUND', 404);
      if (s.appealStatus !== 'NONE') fail('APPEAL_EXISTS');
      s.appealStatus = 'PENDING';
      s.appealedAt = new Date().toISOString();
      return strikeView(s);
    },
  },

  shops: {
    async featured() {
      await wait();
      return mockShops;
    },
    async bySlug(slug) {
      await wait();
      return shopBySlug(slug);
    },
    async availability(slug, { serviceId, barberId, date }) {
      await wait(250);
      const shop = shopBySlug(slug);
      const service = shop.services.find((s) => s.id === serviceId) ?? fail('SERVICE_NOT_FOUND', 404);
      const day = date ?? localDate(new Date(), shop.timezone);
      const base = { date: day, timezone: shop.timezone, serviceId };
      const team = shop.barbers.filter((b) => b.acceptsBookings && b.services.some((o) => o.serviceId === serviceId));
      if (barberId !== 'any') {
        const b = team.find((x) => x.id === barberId) ?? fail('SERVICE_NOT_OFFERED');
        const offer = b.services.find((o) => o.serviceId === serviceId)!;
        return {
          ...base,
          barberId,
          durationMin: offer.durationMin,
          priceEgp: offer.priceEgp,
          slots: barberSlots(shop, b.id, offer.durationMin, day),
        };
      }
      const counts = new Map<string, number>();
      for (const b of team) {
        for (const s of barberSlots(shop, b.id, service.durationMin, day)) {
          counts.set(s.startsAt, (counts.get(s.startsAt) ?? 0) + 1);
        }
      }
      return {
        ...base,
        barberId: 'any',
        slots: [...counts.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([startsAt, availableBarbers]) => ({ startsAt, availableBarbers })),
      };
    },
  },

  bookings: {
    async create(input, key) {
      await wait();
      const existing = db.idempotency.get(key);
      if (existing) return view(db.bookings.find((b) => b.id === existing)!);
      if (!db.policyAccepted) fail('POLICY_NOT_ACCEPTED', 403);
      if (db.bookings.filter((b) => ACTIVE.includes(b.status)).length >= 2) fail('TOO_MANY_ACTIVE_BOOKINGS');

      const shop = shopById(input.shopId);
      const service = shop.services.find((s) => s.id === input.serviceId) ?? fail('SERVICE_NOT_FOUND', 404);
      const date = localDate(input.startsAt, shop.timezone);
      const start = new Date(input.startsAt).getTime();
      const candidates = input.barberId === 'any' ? shop.barbers : shop.barbers.filter((b) => b.id === input.barberId);
      const barber = candidates.find((b) => {
        const offer = b.services.find((o) => o.serviceId === service.id);
        return (
          offer &&
          barberSlots(shop, b.id, offer.durationMin, date).some((s) => new Date(s.startsAt).getTime() === start)
        );
      });
      if (!barber) fail('SLOT_TAKEN');
      const offer = barber!.services.find((o) => o.serviceId === service.id)!;

      const now = new Date().toISOString();
      const row = {
        id: 'bk-' + uid(),
        code: Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join(''),
        status: 'BOOKED' as const,
        source: 'APP',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + offer.durationMin * 60_000).toISOString(),
        durationMin: offer.durationMin,
        priceEgp: offer.priceEgp,
        delayMin: null,
        note: input.note ?? null,
        confirmedAt: null,
        arrivedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        isLateCancel: false,
        noShowAt: null,
        createdAt: now,
        shop: { id: shop.id, name: shop.name, slug: shop.slug, address: shop.address, timezone: shop.timezone },
        barber: { id: barber!.id, displayName: barber!.displayName, photoUrl: barber!.photoUrl },
        service: { id: service.id, name: service.name, nameEn: service.nameEn },
        timeline: [
          { fromStatus: null, toStatus: 'BOOKED' as const, actorType: 'CUSTOMER' as const, meta: null, at: now },
        ],
      };
      db.bookings.unshift(row);
      db.idempotency.set(key, row.id);
      pushNotification({
        type: 'BOOKING_CREATED',
        title: 'تم الحجز',
        body: `${barber!.displayName} مستنيك في ${shop.name}. هنفكرك قبل الميعاد بساعتين.`,
      });
      return view(row);
    },

    async mine(scope, page = 1) {
      await wait();
      const now = Date.now();
      const items = db.bookings
        .filter((b) =>
          scope === 'upcoming'
            ? ACTIVE.includes(b.status) && new Date(b.endsAt).getTime() > now - 2 * HOUR
            : !ACTIVE.includes(b.status) || new Date(b.endsAt).getTime() <= now - 2 * HOUR,
        )
        .sort((a, b) =>
          scope === 'upcoming' ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt),
        )
        .map(view);
      return paged(items, page);
    },

    async get(id) {
      await wait(200);
      return view(db.bookings.find((b) => b.id === id) ?? fail('BOOKING_NOT_FOUND', 404));
    },

    async confirm(id) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      if (!['BOOKED', 'UNCONFIRMED'].includes(b.status)) fail('INVALID_TRANSITION');
      const at = new Date().toISOString();
      b.timeline.push({ fromStatus: b.status, toStatus: 'CONFIRMED', actorType: 'CUSTOMER', meta: null, at });
      b.status = 'CONFIRMED';
      b.confirmedAt = at;
      return view(b);
    },

    async cancel(id, reason) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      if (!CANCELLABLE.includes(b.status)) fail('INVALID_TRANSITION');
      const late = !b.delayMin && new Date(b.startsAt).getTime() - Date.now() < 2 * HOUR;
      const at = new Date().toISOString();
      b.timeline.push({ fromStatus: b.status, toStatus: 'CANCELLED', actorType: 'CUSTOMER', meta: null, at });
      Object.assign(b, {
        status: 'CANCELLED',
        cancelledAt: at,
        cancelledBy: 'CUSTOMER',
        cancelReason: reason ?? null,
        isLateCancel: late,
      });
      return view(b);
    },

    async reschedule(id, { startsAt, barberId }) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      if (!view(b).canReschedule) fail('RESCHEDULE_TOO_LATE');
      const shop = shopById(b.shop.id);
      const barber = shop.barbers.find((x) => x.id === (barberId ?? b.barber.id))!;
      const free = barberSlots(shop, barber.id, b.durationMin, localDate(startsAt, shop.timezone));
      if (!free.some((s) => s.startsAt === new Date(startsAt).toISOString())) fail('SLOT_TAKEN');
      const start = new Date(startsAt).getTime();
      Object.assign(b, {
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + b.durationMin * 60_000).toISOString(),
        barber: { id: barber.id, displayName: barber.displayName, photoUrl: barber.photoUrl },
      });
      return view(b);
    },

    async checkIn(id, token) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      const now = Date.now();
      const opensAt = new Date(b.startsAt).getTime() - 30 * 60_000;
      if (!ACTIVE.includes(b.status) || now < opensAt || now > new Date(b.endsAt).getTime()) {
        fail('CHECKIN_WINDOW_CLOSED');
      }
      if (token.length < 8) fail('CHECKIN_INVALID', 400);
    },

    async dispute(id, _note) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      if (b.status !== 'NO_SHOW' || !b.noShowAt) fail('INVALID_TRANSITION');
      if (Date.now() - new Date(b.noShowAt!).getTime() > DAY) fail('DISPUTE_WINDOW_CLOSED');
      const s = db.strikes.find((x) => x.bookingId === id);
      if (s && s.appealStatus !== 'NONE') fail('APPEAL_EXISTS');
      if (s) {
        s.appealStatus = 'PENDING';
        s.appealedAt = new Date().toISOString();
      }
    },

    async reportLate(id, _note) {
      await wait();
      const b = db.bookings.find((x) => x.id === id) ?? fail('BOOKING_NOT_FOUND', 404);
      const sinceStart = Date.now() - new Date(b.startsAt).getTime();
      const happened = ['ARRIVED', 'IN_PROGRESS', 'DONE'].includes(b.status);
      if (!happened || sinceStart < 0 || sinceStart > DAY || (b.delayMin ?? 0) >= 15 || db.lateReports.has(id)) {
        fail('REPORT_NOT_ALLOWED');
      }
      db.lateReports.add(id);
    },
  },

  notifications: {
    async list(page = 1) {
      await wait();
      return paged(db.notifications, page);
    },
    async unreadCount() {
      await wait(100);
      return db.notifications.filter((n) => !n.readAt).length;
    },
    async markRead(id) {
      await wait(100);
      const n = db.notifications.find((x) => x.id === id);
      if (n && !n.readAt) n.readAt = new Date().toISOString();
    },
    async markAllRead() {
      await wait(150);
      const at = new Date().toISOString();
      db.notifications.forEach((n) => (n.readAt ??= at));
    },
  },

  policy: {
    async get() {
      await wait(200);
      return mockPolicy;
    },
  },

  config: {
    async get() {
      await wait(150);
      return {
        support: { phone: '+201000000000', whatsapp: '+201000000000', email: 'support@chairo.app', hours: '10 ص – 10 م' },
      };
    },
  },
};
