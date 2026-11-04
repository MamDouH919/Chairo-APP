import { env } from '@/config/env';

import type { ApiEnvelope, Paged, Tokens } from './types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Session hooks the HTTP layer needs. Set once by the auth store, so this file has no
 * dependency on React or zustand.
 */
interface SessionBridge {
  getAccessToken: () => string | null;
  getRefreshToken: () => Promise<string | null>;
  onTokens: (t: Tokens) => Promise<void>;
  onSessionLost: () => void;
}
let session: SessionBridge | null = null;
export const bindSession = (s: SessionBridge) => {
  session = s;
};

/** One refresh at a time: the API rotates refresh tokens, a parallel refresh would revoke the session. */
let refreshing: Promise<RefreshResult> | null = null;

/** `unavailable`: the server didn't give an answer (offline, 5xx). The session may still be fine. */
type RefreshResult = 'ok' | 'lost' | 'unavailable';

async function refreshTokens(): Promise<RefreshResult> {
  if (!session) return 'lost';
  refreshing ??= (async () => {
    try {
      const refreshToken = await session!.getRefreshToken();
      if (!refreshToken) return 'lost';
      const res = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = (await res.json()) as ApiEnvelope<Tokens>;
      if (!json.success) return res.status === 401 || res.status === 403 ? 'lost' : 'unavailable';
      await session!.onTokens(json.data);
      return 'ok';
    } catch {
      return 'unavailable';
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  auth?: boolean;
}

async function raw<T>(path: string, opts: RequestOptions, retried = false): Promise<ApiEnvelope<T>> {
  const qs = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = opts.auth !== false ? session?.getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}${qs}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK', 'Network request failed', 0);
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!json) throw new ApiError('INTERNAL', `Bad response (${res.status})`, res.status);

  if (!json.success) {
    const { code, message, details } = json.error;
    if (res.status === 401 && opts.auth !== false && !retried) {
      if (code === 'TOKEN_EXPIRED' || code === 'UNAUTHENTICATED') {
        const refreshed = await refreshTokens();
        if (refreshed === 'ok') return raw<T>(path, opts, true);
        // A dropped connection must not log the user out.
        if (refreshed === 'unavailable') throw new ApiError('NETWORK', 'Could not refresh the session', 0);
      }
      session?.onSessionLost();
    }
    throw new ApiError(code, message, res.status, details);
  }
  return json;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const json = await raw<T>(path, opts);
  if (!json.success) throw new Error('unreachable');
  return json.data;
}

export async function requestPaged<T>(path: string, opts: RequestOptions = {}): Promise<Paged<T>> {
  const json = await raw<T[]>(path, opts);
  if (!json.success) throw new Error('unreachable');
  return {
    items: json.data,
    meta: json.meta ?? { page: 1, limit: json.data.length, total: json.data.length, totalPages: 1 },
  };
}
