import { create } from 'zustand';

import { api } from '@/lib/api';
import type { StaffMembership } from '@/lib/api/types';
import {
  activeMemberships,
  resolveLanding,
  type AppMode,
  type Landing,
  type LoginIntent,
  type RememberedMode,
} from '@/lib/landing';
import { queryClient } from '@/lib/query-client';
import { storage, StorageKeys } from '@/lib/storage';

import { useAuth } from './auth';

interface Persisted extends RememberedMode {
  /** last known memberships, so shop mode still opens offline */
  memberships: StaffMembership[];
}

interface ModeState {
  /** set on the welcome screen, consumed by the first resolve after login */
  intent: LoginIntent;
  /** false until memberships were loaded for the signed-in user */
  ready: boolean;
  mode: AppMode;
  shopId: string | null;
  memberships: StaffMembership[];
  landing: Landing | null;
  setIntent(intent: Exclude<LoginIntent, null>): void;
  /** Load memberships and decide where to land. `intent` overrides the stored one (e.g. "I'm a barber" from Account). */
  resolve(opts?: { intent?: LoginIntent }): Promise<Landing>;
  enterShop(shopId: string): Promise<void>;
  enterCustomer(): Promise<void>;
}

const userId = () => useAuth.getState().user?.id ?? null;
const staffKey = () => ['user', userId() ?? 'anonymous', 'staff-context'] as const;

async function readPersisted(id: string): Promise<Persisted | null> {
  try {
    const raw = await storage.get(StorageKeys.mode(id));
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

const initial = { ready: false, mode: 'customer' as AppMode, shopId: null, memberships: [], landing: null };

export const useMode = create<ModeState>((set, get) => ({
  intent: null,
  ...initial,

  setIntent(intent) {
    set({ intent });
  },

  async resolve(opts) {
    const id = userId();
    const intent = opts?.intent !== undefined ? opts.intent : get().intent;
    const saved = id ? await readPersisted(id) : null;

    let memberships: StaffMembership[];
    try {
      const ctx = await queryClient.fetchQuery({ queryKey: staffKey(), queryFn: api.staff.context, staleTime: 0 });
      memberships = ctx.memberships;
    } catch {
      // Offline or the API is down: trust what this device last saw rather than kicking a barber out of his shop.
      memberships = saved?.memberships ?? [];
    }
    if (userId() !== id) return { kind: 'customer' }; // signed out while loading

    const landing = resolveLanding(memberships, intent, saved);
    const mode: AppMode = landing.kind === 'customer' ? 'customer' : 'shop';
    const shopId = landing.kind === 'shop' ? landing.shopId : null;
    set({ intent: null, ready: true, memberships, landing, mode, shopId });
    // pick-shop keeps the previous shop remembered until one is chosen
    await persist({ mode, shopId: shopId ?? saved?.shopId ?? null, memberships });
    return landing;
  },

  async enterShop(shopId) {
    const landing: Landing = { kind: 'shop', shopId };
    set({ mode: 'shop', shopId, landing, ready: true });
    await persist({ mode: 'shop', shopId, memberships: get().memberships });
  },

  async enterCustomer() {
    set({ mode: 'customer', landing: { kind: 'customer' }, ready: true });
    // keep shopId remembered, so switching back opens the same shop
    await persist({ mode: 'customer', shopId: get().shopId, memberships: get().memberships });
  },
}));

async function persist(p: Persisted) {
  const id = userId();
  if (id) await storage.set(StorageKeys.mode(id), JSON.stringify(p)).catch(() => undefined);
}

/** The membership currently in use (shop mode). */
export const useCurrentMembership = () =>
  useMode((s) => (s.mode === 'shop' ? (s.memberships.find((m) => m.shopId === s.shopId) ?? null) : null));

export const useHasShops = () => useMode((s) => activeMemberships(s.memberships).length > 0);

// Sign-out drops the in-memory state; the per-user remembered mode stays on the device for next time.
useAuth.subscribe((s, prev) => {
  if (s.status === 'signedOut' && prev.status !== 'signedOut') useMode.setState({ ...initial });
});
