import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { toast } from '@/components/ui/feedback';
import { ar } from '@/i18n/ar';
import { api } from '@/lib/api';
import { bindSession } from '@/lib/api/http';
import type { Tokens, User, VerifyResult } from '@/lib/api/types';
import { queryClient } from '@/lib/query-client';
import { storage, StorageKeys } from '@/lib/storage';

type Status = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthState {
  status: Status;
  user: User | null;
  /** access token lives in memory only; the refresh token is in SecureStore */
  accessToken: string | null;
  policyAccepted: boolean;
  bootstrap(): Promise<void>;
  signIn(result: VerifyResult): Promise<void>;
  setUser(user: User): Promise<void>;
  markPolicyAccepted(): Promise<void>;
  /** `remote: false` when the server session is already gone (revoked, logout-all). */
  signOut(opts?: { remote?: boolean }): Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  policyAccepted: false,

  async bootstrap() {
    const [refresh, rawUser, policy] = await Promise.all([
      storage.get(StorageKeys.refreshToken),
      storage.get(StorageKeys.user),
      storage.get(StorageKeys.policyAccepted),
    ]);
    if (!refresh || !rawUser) return set({ status: 'signedOut' });
    const user = JSON.parse(rawUser) as User;
    // The first authed request gets a 401 → the HTTP layer refreshes with the stored token.
    set({ user, policyAccepted: policy === user.id, status: user.name ? 'signedIn' : 'needsProfile' });
  },

  async signIn(result) {
    await saveTokens(result);
    await storage.set(StorageKeys.user, JSON.stringify(result.user));
    const policy = await storage.get(StorageKeys.policyAccepted);
    set({
      user: result.user,
      accessToken: result.accessToken,
      policyAccepted: policy === result.user.id,
      status: result.isNewUser || !result.user.name ? 'needsProfile' : 'signedIn',
    });
  },

  async setUser(user) {
    await storage.set(StorageKeys.user, JSON.stringify(user));
    set({ user, status: user.name ? 'signedIn' : 'needsProfile' });
  },

  async markPolicyAccepted() {
    const id = get().user?.id;
    if (id) await storage.set(StorageKeys.policyAccepted, id);
    set({ policyAccepted: true });
  },

  async signOut({ remote = true } = {}) {
    if (remote) api.auth.logout().catch(() => undefined);
    // Unmount the signed-in screens first, then drop their data, so the next account never sees it.
    set({ status: 'signedOut', user: null, accessToken: null, policyAccepted: false });
    await queryClient.cancelQueries();
    queryClient.clear();
    await Promise.all([storage.remove(StorageKeys.refreshToken), storage.remove(StorageKeys.user)]);
  },
}));

async function saveTokens(t: Tokens) {
  await storage.set(StorageKeys.refreshToken, t.refreshToken);
  useAuth.setState({ accessToken: t.accessToken });
}

bindSession({
  getAccessToken: () => useAuth.getState().accessToken,
  getRefreshToken: () => storage.get(StorageKeys.refreshToken),
  onTokens: async (t) => {
    // A refresh that finishes after sign-out must not bring the session back.
    if (useAuth.getState().status !== 'signedOut') await saveTokens(t);
  },
  onSessionLost: () => {
    if (useAuth.getState().status === 'signedOut') return;
    toast(ar.auth.signInAgain, 'error');
    void useAuth.getState().signOut({ remote: false });
  },
});

/** Stable per-install id, sent on login so the API can list "your devices". */
export async function getDeviceId() {
  let id = await storage.get(StorageKeys.deviceId);
  if (!id) {
    id = Crypto.randomUUID();
    await storage.set(StorageKeys.deviceId, id);
  }
  return id;
}
