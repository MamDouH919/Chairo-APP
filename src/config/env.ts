/** Runtime config from EXPO_PUBLIC_* env vars (see .env.example). All data comes from the backend. */
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Point it at chairo-api (see .env.example).');
}

export const env = {
  apiUrl,
  /** Extra shops pinned on Home on top of the city search. Comma-separated slugs. */
  featuredSlugs: (process.env.EXPO_PUBLIC_FEATURED_SLUGS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** City whose shops Home lists (matches the shop's `city` text). */
  city: process.env.EXPO_PUBLIC_CITY?.trim() || 'بنها',
  timezone: 'Africa/Cairo',
} as const;
