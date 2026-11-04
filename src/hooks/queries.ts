import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/stores/auth';

/** Private data is keyed by user, so a cached response can never show up under another account. */
const mine = () => ['user', useAuth.getState().user?.id ?? 'anonymous'] as const;

export const qk = {
  featured: ['shops', 'featured'] as const,
  shop: (slug: string) => ['shops', slug] as const,
  availability: (slug: string, serviceId: string, barberId: string, date: string) =>
    ['availability', slug, serviceId, barberId, date] as const,
  policy: ['policy'] as const,
  appConfig: ['app-config'] as const,

  allBookings: () => [...mine(), 'bookings'] as const,
  bookings: (scope: 'upcoming' | 'past') => [...qk.allBookings(), scope] as const,
  allBookingDetails: () => [...mine(), 'booking'] as const,
  booking: (id: string) => [...qk.allBookingDetails(), id] as const,
  checkedIn: (id: string) => [...mine(), 'checked-in', id] as const,
  notifications: () => [...mine(), 'notifications'] as const,
  unread: () => [...qk.notifications(), 'unread'] as const,
  record: () => [...mine(), 'record'] as const,
  sessions: () => [...mine(), 'sessions'] as const,
};

const nextPage = <T>({ meta }: Paged<T>) => (meta.page < meta.totalPages ? meta.page + 1 : undefined);
const allItems = <T>(data: { pages: Paged<T>[] }) => data.pages.flatMap((p) => p.items);

export const useFeaturedShops = () => useQuery({ queryKey: qk.featured, queryFn: api.shops.featured });

export const useShop = (slug: string) =>
  useQuery({ queryKey: qk.shop(slug), queryFn: () => api.shops.bySlug(slug), enabled: !!slug });

export const useAvailability = (slug: string, params: { serviceId?: string; barberId?: string; date: string }) =>
  useQuery({
    queryKey: qk.availability(slug, params.serviceId ?? '', params.barberId ?? 'any', params.date),
    queryFn: () =>
      api.shops.availability(slug, {
        serviceId: params.serviceId!,
        barberId: params.barberId ?? 'any',
        date: params.date,
      }),
    enabled: !!params.serviceId && !!slug,
    staleTime: 30_000, // the API caches slots for 60 s
  });

export const useMyBookings = (scope: 'upcoming' | 'past') =>
  useInfiniteQuery({
    queryKey: qk.bookings(scope),
    queryFn: ({ pageParam }) => api.bookings.mine(scope, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    select: allItems,
  });

export const useBooking = (id: string) =>
  useQuery({ queryKey: qk.booking(id), queryFn: () => api.bookings.get(id), enabled: !!id });

/**
 * The booking response doesn't say whether the customer checked in yet, so this remembers it
 * for the session. Nothing fetches it: `useCheckIn` writes it, sign-out clears it.
 */
export const useCheckedIn = (id: string) =>
  useQuery({
    queryKey: qk.checkedIn(id),
    queryFn: () => false,
    enabled: false,
    gcTime: Infinity,
    initialData: false,
  }).data;

export function useCheckIn(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.bookings.checkIn(id, token),
    onSuccess: () => {
      qc.setQueryData(qk.checkedIn(id), true);
      return qc.invalidateQueries({ queryKey: qk.booking(id) });
    },
  });
}

export const useNotifications = () =>
  useInfiniteQuery({
    queryKey: qk.notifications(),
    queryFn: ({ pageParam }) => api.notifications.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    select: allItems,
  });

export const useUnreadCount = () =>
  useQuery({ queryKey: qk.unread(), queryFn: api.notifications.unreadCount, refetchInterval: 60_000 });

export const usePolicy = () => useQuery({ queryKey: qk.policy, queryFn: api.policy.get, staleTime: Infinity });

export const useAppConfig = () =>
  useQuery({ queryKey: qk.appConfig, queryFn: api.config.get, staleTime: 5 * 60_000 });

export const useMyRecord = () => useQuery({ queryKey: qk.record(), queryFn: api.me.record });

export const useSessions = () => useQuery({ queryKey: qk.sessions(), queryFn: api.auth.sessions });

/** After any booking change: refresh lists, the detail and the slot grids. */
export function useInvalidateBookings() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.allBookings() }),
      qc.invalidateQueries({ queryKey: qk.allBookingDetails() }),
      qc.invalidateQueries({ queryKey: ['availability'] }),
      qc.invalidateQueries({ queryKey: qk.notifications() }),
      qc.invalidateQueries({ queryKey: qk.record() }),
    ]);
}

export function useBookingAction<A, T>(fn: (args: A) => Promise<T>) {
  const invalidate = useInvalidateBookings();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate() });
}
