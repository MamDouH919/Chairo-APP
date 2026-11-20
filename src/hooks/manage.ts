import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { AddBarberInput, ServiceInput, ShopHoursInput, WorkingShift } from '@/lib/api/types';
import { useAuth } from '@/stores/auth';

/** Private data is keyed by user, so nothing cached can show up under another account. */
const key = (shopId: string, ...rest: unknown[]) =>
  ['user', useAuth.getState().user?.id ?? 'anonymous', 'manage', shopId, ...rest] as const;

export const useManagedServices = (shopId: string) =>
  useQuery({ queryKey: key(shopId, 'services'), queryFn: () => api.manage.services(shopId), enabled: !!shopId });

export const useShopHours = (shopId: string) =>
  useQuery({ queryKey: key(shopId, 'hours'), queryFn: () => api.manage.shopHours(shopId), enabled: !!shopId });

export const useManagedBarbers = (shopId: string, enabled = true) =>
  useQuery({ queryKey: key(shopId, 'barbers'), queryFn: () => api.manage.barbers(shopId), enabled: !!shopId && enabled });

export const useWorkingHours = (shopId: string, barberId: string) =>
  useQuery({
    queryKey: key(shopId, 'working-hours', barberId),
    queryFn: () => api.manage.workingHours(shopId, barberId),
    enabled: !!shopId && !!barberId,
  });

/** The public page (what customers see) caches shop data, so every change refreshes it too. */
function useRefresh(shopId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: key(shopId) }),
      qc.invalidateQueries({ queryKey: ['shops'] }),
      qc.invalidateQueries({ queryKey: ['availability'] }),
    ]);
}

export function useServiceMutations(shopId: string) {
  const refresh = useRefresh(shopId);
  const onSuccess = () => refresh();
  return {
    create: useMutation({ mutationFn: (input: ServiceInput) => api.manage.createService(shopId, input), onSuccess }),
    update: useMutation({
      mutationFn: (v: { id: string; patch: Partial<ServiceInput> & { isActive?: boolean } }) =>
        api.manage.updateService(shopId, v.id, v.patch),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.manage.removeService(shopId, id), onSuccess }),
    seedDefaults: useMutation({ mutationFn: () => api.manage.seedDefaultServices(shopId), onSuccess }),
  };
}

export function useSaveShopHours(shopId: string) {
  const refresh = useRefresh(shopId);
  return useMutation({ mutationFn: (days: ShopHoursInput[]) => api.manage.setShopHours(shopId, days), onSuccess: () => refresh() });
}

export function useSaveWorkingHours(shopId: string, barberId: string) {
  const refresh = useRefresh(shopId);
  return useMutation({
    mutationFn: (shifts: WorkingShift[]) => api.manage.setWorkingHours(shopId, barberId, shifts),
    onSuccess: () => refresh(),
  });
}

export function useBarberMutations(shopId: string) {
  const refresh = useRefresh(shopId);
  const onSuccess = () => refresh();
  return {
    add: useMutation({ mutationFn: (input: AddBarberInput) => api.manage.addBarber(shopId, input), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => api.manage.removeBarber(shopId, id), onSuccess }),
  };
}
