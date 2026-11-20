import { env } from '@/config/env';

import { request, requestPaged } from './http';
import type {
  AddBarberInput,
  AppConfig,
  AppNotification,
  Availability,
  Booking,
  BookingDetail,
  CreateBookingInput,
  CreatedShop,
  CreateShopInput,
  ManagedBarber,
  ManagedService,
  MyRecord,
  OtpRequestResult,
  Paged,
  PolicyText,
  PublicShop,
  ServiceInput,
  Session,
  ShopHours,
  ShopHoursInput,
  StaffContext,
  Strike,
  Tokens,
  User,
  VerifyResult,
  WorkingHoursResult,
  WorkingShift,
} from './types';

/** Every call the app makes. */
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
  staff: {
    /** Memberships right after login: which shops, which role, which chair. */
    context(): Promise<StaffContext>;
    /** Self-service shop registration; the caller becomes OWNER of a PENDING shop. */
    registerShop(input: CreateShopInput): Promise<CreatedShop>;
  };
  /** Shop setup: services, opening hours, chairs. Owner for the shop, barber for his own chair. */
  manage: {
    services(shopId: string): Promise<ManagedService[]>;
    createService(shopId: string, input: ServiceInput): Promise<ManagedService>;
    updateService(shopId: string, id: string, patch: Partial<ServiceInput> & { isActive?: boolean }): Promise<ManagedService>;
    removeService(shopId: string, id: string): Promise<void>;
    /** Only when the shop has no services yet: the starter menu. */
    seedDefaultServices(shopId: string): Promise<ManagedService[]>;
    shopHours(shopId: string): Promise<ShopHours[]>;
    setShopHours(shopId: string, days: ShopHoursInput[]): Promise<ShopHours[]>;
    barbers(shopId: string): Promise<ManagedBarber[]>;
    /** New chair under this shop: offers the whole menu and works the shop's hours until edited. */
    addBarber(shopId: string, input: AddBarberInput): Promise<ManagedBarber>;
    removeBarber(shopId: string, id: string): Promise<void>;
    workingHours(shopId: string, barberId: string): Promise<WorkingShift[]>;
    setWorkingHours(shopId: string, barberId: string, shifts: WorkingShift[]): Promise<WorkingHoursResult>;
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
      // Every active shop in the city, plus any pinned slugs, then the full public page of each.
      const found = await request<{ slug: string }[]>('/public/shops/search', {
        query: { city: env.city, limit: 20 },
        auth: false,
      }).catch(() => []);
      const slugs = [...new Set([...found.map((s) => s.slug), ...env.featuredSlugs])];
      const results = await Promise.allSettled(slugs.map((slug) => request<PublicShop>(`/public/shops/${encodeURIComponent(slug)}`, { auth: false })),
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
  staff: {
    context: () => request('/me/staff-context'),
    registerShop: (input) => request('/shops', { method: 'POST', body: input }),
  },
  manage: {
    services: (shopId) => request(`/shops/${shopId}/services`),
    createService: (shopId, input) =>
      request(`/shops/${shopId}/services`, { method: 'POST', body: { ...input, assignToAllBarbers: true } }),
    updateService: (shopId, id, patch) => request(`/shops/${shopId}/services/${id}`, { method: 'PATCH', body: patch }),
    removeService: async (shopId, id) => {
      await request(`/shops/${shopId}/services/${id}`, { method: 'DELETE' });
    },
    seedDefaultServices: (shopId) => request(`/shops/${shopId}/services/defaults`, { method: 'POST' }),
    shopHours: async (shopId) => (await request<{ hours: ShopHours[] }>(`/shops/${shopId}`)).hours,
    setShopHours: (shopId, days) => request(`/shops/${shopId}/hours`, { method: 'PUT', body: days }),
    barbers: (shopId) => request(`/shops/${shopId}/barbers`),
    addBarber: async (shopId, input) => {
      const [menu, hours] = await Promise.all([
        request<ManagedService[]>(`/shops/${shopId}/services`),
        request<{ hours: ShopHours[] }>(`/shops/${shopId}`).then((r) => r.hours),
      ]);
      const created = await request<ManagedBarber>(`/shops/${shopId}/barbers`, {
        method: 'POST',
        body: {
          displayName: input.displayName,
          serviceIds: menu.filter((m) => m.isActive).map((m) => ({ serviceId: m.id })),
          workingHours: hours
            .filter((h) => !h.isClosed && h.open && h.close)
            .map((h) => ({ weekday: h.weekday, start: h.open, end: h.close })),
        },
      });
      // Linking the phone lets him log in and see his chair; it also sends the invite.
      if (input.phone) {
        await request(`/shops/${shopId}/members`, {
          method: 'POST',
          body: { phone: input.phone, role: 'BARBER', barberId: created.id, name: input.displayName },
        });
      }
      return created;
    },
    removeBarber: async (shopId, id) => {
      await request(`/shops/${shopId}/barbers/${id}`, { method: 'DELETE' });
    },
    workingHours: (shopId, barberId) => request(`/shops/${shopId}/barbers/${barberId}/working-hours`),
    setWorkingHours: (shopId, barberId, shifts) =>
      request(`/shops/${shopId}/barbers/${barberId}/working-hours`, { method: 'PUT', body: shifts }),
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
