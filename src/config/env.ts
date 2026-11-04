/**
 * Runtime config from EXPO_PUBLIC_* env vars (see .env.example).
 * With no API URL the app runs fully on in-memory mock data, so UI work never waits for the backend.
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export const env = {
  apiUrl,
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || !apiUrl,
  /** Shops shown on Home until the API has discovery (API Phase 6). Comma-separated slugs. */
  featuredSlugs: (process.env.EXPO_PUBLIC_FEATURED_SLUGS ?? 'chairo-demo')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  timezone: 'Africa/Cairo',
} as const;
