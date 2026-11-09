/**
 * DTOs mirroring chairo-api mappers (src/modules/** /*.mapper.ts).
 * Times are ISO-8601 UTC strings; money is whole EGP.
 */

export type ApiEnvelope<T> =
  | { success: true; data: T; meta?: PageMeta }
  | {
      success: false;
      error: { code: string; message: string; details?: unknown };
      requestId?: string;
    };

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

// ── auth / users ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  locale: 'ar' | 'en';
  createdAt: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface OtpRequestResult {
  expiresInSeconds?: number;
  resendInSeconds: number;
  /** dev only (OTP_DEV_ECHO) */
  devCode?: string;
}

export interface VerifyResult extends Tokens {
  isNewUser: boolean;
  user: User;
}

// ── public shop page ───────────────────────────────────────────────────────

export interface ShopHours {
  weekday: number; // 0 = Sunday
  open: string | null;
  close: string | null;
  closesNextDay: boolean;
  isClosed: boolean;
}

export interface PublicService {
  id: string;
  name: string;
  nameEn: string | null;
  durationMin: number;
  priceEgp: number;
}

export interface BarberOffer {
  serviceId: string;
  name: string;
  nameEn: string | null;
  priceEgp: number;
  durationMin: number;
}

export interface PublicBarber {
  id: string;
  displayName: string;
  photoUrl: string | null;
  bio: string | null;
  ratingAvg: number | string | null;
  ratingCount: number;
  acceptsBookings: boolean;
  queueMode: boolean;
  services: BarberOffer[];
}

export interface PublicShop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coverUrl: string | null;
  timezone: string;
  maxAdvanceDays: number;
  ratingAvg: number | string | null;
  ratingCount: number;
  isFoundingPartner: boolean;
  hours: ShopHours[];
  photos: { id: string; url: string; sortOrder: number }[];
  services: PublicService[];
  barbers: PublicBarber[];
}

export interface Slot {
  startsAt: string;
  endsAt?: string;
  /** only when barberId = "any" */
  availableBarbers?: number;
}

export interface Availability {
  date: string;
  timezone: string;
  serviceId: string;
  barberId: string | 'any';
  durationMin?: number;
  priceEgp?: number;
  slots: Slot[];
}

// ── bookings ───────────────────────────────────────────────────────────────

export type BookingStatus =
  'BOOKED' | 'CONFIRMED' | 'UNCONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'NO_SHOW';

export interface Booking {
  id: string;
  code: string;
  status: BookingStatus;
  source: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  priceEgp: number;
  delayMin: number | null;
  note: string | null;
  confirmedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  isLateCancel: boolean;
  noShowAt: string | null;
  createdAt: string;
  shop: { id: string; name: string; slug: string; address: string | null; timezone: string };
  barber: { id: string; displayName: string; photoUrl: string | null };
  service: { id: string; name: string; nameEn: string | null } | null;
  canCancel: boolean;
  canReschedule: boolean;
  isLateIfCancelledNow: boolean;
}

export interface BookingEvent {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorType: 'CUSTOMER' | 'BARBER' | 'OWNER' | 'ADMIN' | 'SYSTEM';
  meta: Record<string, unknown> | null;
  at: string;
}

export interface BookingDetail extends Booking {
  timeline: BookingEvent[];
}

export interface CreateBookingInput {
  shopId: string;
  serviceId: string;
  barberId: string | 'any';
  startsAt: string;
  note?: string;
}

// ── notifications / policy ─────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface PolicyText {
  ar: string[];
  en?: string[];
}

// ── my record (strikes) ────────────────────────────────────────────────────

export type BookingRestriction = 'NONE' | 'SAME_DAY_ONLY' | 'SUSPENDED_BOOKING';
export type AppealStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Strike {
  id: string;
  source: 'NO_SHOW' | 'VERY_LATE_CANCEL' | 'LATE_CANCELS';
  bookingId: string | null;
  createdAt: string;
  expiresAt: string;
  appealStatus: AppealStatus;
  appealedAt: string | null;
  resolutionNote: string | null;
  canAppeal: boolean;
}

export interface MyRecord {
  restriction: BookingRestriction;
  /** null while restricted = until changed again */
  restrictionUntil: string | null;
  recordClean: boolean;
  policyAcceptedAt: string | null;
  active: Strike[];
  history: Strike[];
}

// ── sessions ───────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  deviceId: string | null;
  userAgent: string | null;
  ip: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// ── app config ─────────────────────────────────────────────────────────────

/** GET /public/app-config. Only what the app reads so far; force update etc. arrive in Phase 5. */
export interface AppConfig {
  support: { phone: string; whatsapp: string; email: string; hours: string };
}

// ── staff (shop mode) ──────────────────────────────────────────────────────

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type ShopRole = 'OWNER' | 'BARBER';

/** One row of GET /me/staff-context. The role comes from here, never from `user.role`. */
export interface StaffMembership {
  shopId: string;
  shopName: string;
  slug: string;
  status: ShopStatus;
  coverUrl: string | null;
  coverThumbUrl?: string | null;
  role: ShopRole;
  /** the chair linked to this account at that shop (an owner may not cut hair) */
  barberId: string | null;
  barberName: string | null;
}

export interface StaffContext {
  memberships: StaffMembership[];
  pendingInvites: unknown[];
}

/** POST /shops (createShopSchema). The shop starts PENDING until an admin approves it. */
export interface CreateShopInput {
  name: string;
  city: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
}

export interface CreatedShop {
  id: string;
  name: string;
  slug: string;
  status: ShopStatus;
}
