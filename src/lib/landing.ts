import type { StaffMembership } from './api/types';

/** What the person picked on the welcome screen. `null` = a cold start of an already signed-in app. */
export type LoginIntent = 'customer' | 'barber' | null;
export type AppMode = 'customer' | 'shop';

/** Remembered per user on this device. */
export interface RememberedMode {
  mode: AppMode;
  shopId: string | null;
}

export type Landing =
  | { kind: 'customer' }
  | { kind: 'shop'; shopId: string }
  | { kind: 'pickShop' }
  | { kind: 'noShop' }
  | { kind: 'pending' };

/** Only ACTIVE shops can be worked in. PENDING ones wait for our admin; SUSPENDED / CLOSED are hidden. */
export const activeMemberships = (all: StaffMembership[]) => all.filter((m) => m.status === 'ACTIVE');

/**
 * Where the app opens after login (or on a cold start).
 *
 * - An explicit welcome choice wins: "أنا زبون" always opens customer mode.
 * - On a cold start the last mode is reused; with nothing remembered, anyone with a shop opens in shop mode.
 * - Shop mode with no usable shop: a registered-but-unapproved shop shows the pending state, otherwise "no shop".
 * - 2+ shops: the remembered shop if it is still active, otherwise the picker.
 */
export function resolveLanding(
  memberships: StaffMembership[],
  intent: LoginIntent,
  remembered: RememberedMode | null,
): Landing {
  const active = activeMemberships(memberships);
  const wanted: AppMode =
    intent === 'customer'
      ? 'customer'
      : intent === 'barber'
        ? 'shop'
        : (remembered?.mode ?? (active.length ? 'shop' : 'customer'));

  if (wanted === 'customer') return { kind: 'customer' };
  if (active.length === 0) {
    return memberships.some((m) => m.status === 'PENDING') ? { kind: 'pending' } : { kind: 'noShop' };
  }
  if (active.length === 1) return { kind: 'shop', shopId: active[0].shopId };
  const last = active.find((m) => m.shopId === remembered?.shopId);
  return last ? { kind: 'shop', shopId: last.shopId } : { kind: 'pickShop' };
}

/** Route for each landing. The anchor route (`/`) is the only place that reads this. */
export const landingHref = (l: Landing) =>
  ({
    customer: '/home',
    shop: '/today',
    pickShop: '/staff/pick-shop',
    noShop: '/staff/no-shop',
    pending: '/staff/pending',
  })[l.kind] as '/home' | '/today' | '/staff/pick-shop' | '/staff/no-shop' | '/staff/pending';
