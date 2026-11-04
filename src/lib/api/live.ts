import { env } from '@/config/env';

import { request, requestPaged } from './http';
import type {
  AppConfig,
  AppNotification,
  Availability,
  Booking,
  BookingDetail,
  CreateBookingInput,
  MyRecord,
  OtpRequestResult,
  Paged,
  PolicyText,
  PublicShop,
  Session,
  Strike,
  Tokens,
  User,
  VerifyResult,
} from './types';

/** Every call the app makes. `mock.ts` implements the same shape. */
export interface ChairoApi {
  auth: {
    requestOtp(phone: string): Promise<OtpRequestResult>;
    verifyOtp(input: { phone: string; code: string; deviceId?: string; name?: string }): Promise<VerifyResult>;
    logout(): Promise<void>;
    logoutAll(): Promise<void>;
    sessions(): Promise<Session[]>;
    revokeSession(id: string): Promise<void>;
  };
  me: {
    get(): Promise<User>;
    update(patch: Partial<Pick<User, 'name' | 'locale' | 'avatarUrl'>>): Promise<User>;
    acceptPolicy(): Promise<void>;
    record(): Promise<MyRecord>;
    appealStrike(id: string, note: string): Promise<Strike>;
  };
  shops: {
    /** TODO(API Phase 6): replace with nearby/search once discovery exists. */
    featured(): Promise<PublicShop[]>;
    bySlug(slug: string): Promise<PublicShop>;
    availability(
      slug: string,
      q: { serviceId: string; barberId: string | 'any'; date?: string },
    ): Promise<Availability>;
  };
  bookings: {
    create(input: CreateBookingInput, idempotencyKey: string): Promise<Booking>;
    mine(scope: 'upcoming' | 'past', page?: number): Promise<Paged<Booking>>;
    get(id: string): Promise<BookingDetail>;
    confirm(id: string): Promise<Booking>;
    cancel(id: string, reason?: string): Promise<Booking>;
    reschedule(id: string, input: { startsAt: string; barberId?: string }): Promise<Booking>;
    checkIn(id: string, token: string): Promise<void>;
    dispute(id: string, note: string): Promise<void>;
    reportLate(id: string, note?: string): Promise<void>;
  };
  notifications: {
    list(page?: number): Promise<Paged<AppNotification>>;
    unreadCount(): Promise<number>;
    markRead(id: string): Promise<void>;
    markAllRead(): Promise<void>;
  };
  policy: {
    get(): Promise<PolicyText>;
  };
  config: {
    get(): Promise<AppConfig>;
  };
  /** used by the auth store only */
  _refreshShape?: Tokens;
}

export const liveApi: ChairoApi = {
  auth: {
    requestOtp: (phone) => request('/auth/otp/request', { method: 'POST', body: { phone }, auth: false }),
    verifyOtp: (input) => request('/auth/otp/verify', { method: 'POST', body: input, auth: false }),
    logout: async () => {
      await request('/auth/logout', { method: 'POST' });
    },
    logoutAll: async () => {
      await request('/auth/logout-all', { method: 'POST' });
    },
    sessions: () => request('/auth/sessions'),
    revokeSession: async (id) => {
      await request(`/auth/sessions/${id}`, { method: 'DELETE' });
    },
  },
  me: {
    get: () => request('/users/me'),
    update: (patch) => request('/users/me', { method: 'PATCH', body: patch }),
    acceptPolicy: async () => {
      await request('/me/policy/accept', { method: 'POST' });
    },
    record: () => request('/me/strikes'),
    appealStrike: (id, note) => request(`/me/strikes/${id}/appeal`, { method: 'POST', body: { note } }),
  },
  shops: {
    featured: async () => {
      const results = await Promise.allSettled(
        env.featuredSlugs.map((slug) => request<PublicShop>(`/public/shops/${slug}`, { auth: false })),
      );
      return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    },
    bySlug: (slug) => request(`/public/shops/${encodeURIComponent(slug)}`, { auth: false }),
    availability: (slug, q) =>
      request(`/public/shops/${encodeURIComponent(slug)}/availability`, { query: q, auth: false }),
  },
  bookings: {
    create: (input, idempotencyKey) =>
      request('/bookings', {
        method: 'POST',
        body: { ...input, source: 'APP' },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    mine: (scope, page = 1) => requestPaged('/bookings/mine', { query: { scope, page, limit: 20 } }),
    get: (id) => request(`/bookings/${id}`),
    confirm: (id) => request(`/bookings/${id}/confirm`, { method: 'POST' }),
    cancel: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } }),
    reschedule: (id, input) => request(`/bookings/${id}/reschedule`, { method: 'POST', body: input }),
    checkIn: async (id, token) => {
      await request(`/bookings/${id}/check-in`, { method: 'POST', body: { token } });
    },
    dispute: async (id, note) => {
      await request(`/bookings/${id}/dispute`, { method: 'POST', body: { note } });
    },
    reportLate: async (id, note) => {
      await request(`/bookings/${id}/report-late`, { method: 'POST', body: { note } });
    },
  },
  notifications: {
    list: (page = 1) => requestPaged('/notifications', { query: { page, limit: 20 } }),
    unreadCount: async () => {
      const r = await request<{ unread: number }>('/notifications/unread-count');
      return r.unread;
    },
    markRead: async (id) => {
      await request(`/notifications/${id}/read`, { method: 'POST' });
    },
    markAllRead: async () => {
      await request('/notifications/read-all', { method: 'POST' });
    },
  },
  policy: {
    get: () => request('/public/policy', { auth: false }),
  },
  config: {
    get: () => request('/public/app-config', { auth: false }),
  },
};
