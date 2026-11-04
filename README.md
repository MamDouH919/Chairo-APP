# Chairo — customer app

Arabic-first (RTL) mobile app for **Chairo**: book a named barber at a set time and walk in without waiting.
Expo SDK 58 · React Native 0.88 · Expo Router · TanStack Query · Zustand · TypeScript.

Backend: [`../chairo-api`](../chairo-api) (NestJS). The app follows its `docs/CONVENTIONS.md`
(response envelope, `error.code` → Arabic text on the client, rotating refresh tokens, `Idempotency-Key` on booking).

## Run it

```bash
npm install
npx expo start          # press i / a / w — or scan the QR with Expo Go
```

With no `.env` the app runs on **built-in mock data** (badge "وضع التجربة" on screen). Any 6-digit code logs in; the dev code is `123456`.

### Against the real API

```bash
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1   (Android emulator: http://10.0.2.2:3000/api/v1)
```

Start `chairo-api` (`docker compose up -d && npm run db:migrate && npm run db:seed && npm run dev`).
In development the API echoes the OTP as `devCode`, and the app shows it on the verify screen.
Home lists the shops in `EXPO_PUBLIC_FEATURED_SLUGS` (default: the seeded `chairo-demo`) until the API ships discovery.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npm test
```

When the API adds an error code, run `npm run sync:error-codes` (reads `../chairo-api`). `npm test` then fails until the code has Arabic text in `lib/errors.ts`.

## Structure

```
src/
  app/                    routes (Expo Router)
    _layout.tsx           providers, fonts, auth gating (Stack.Protected)
    index.tsx             redirects by auth state
    (auth)/               welcome → phone → verify (OTP)
    profile-setup.tsx     name, first login only
    (tabs)/               home · bookings · notifications · account
    shop/[slug].tsx       public shop page
    book/[slug].tsx       booking flow: service → barber → time → confirm
    book/success.tsx
    booking/[id].tsx      details, "what do I need to do", cancel, dispute, report late, timeline
    reschedule/[id].tsx   new barber / day / time for a booking
    check-in/[id].tsx     scan the shop's check-in QR
    account/strikes.tsx   my record: strikes, restriction, appeals
    account/sessions.tsx  signed-in devices, log out everywhere
    policy.tsx            booking policy (text from the API)
  components/ui/          design-system primitives (Text, Button, Card, Sheet, TextField, OtpInput…)
  components/             domain components (ShopCard, BookingCard, booking steps…)
  theme/                  tokens: colors (light/dark), type scale, spacing, radius, motion
  i18n/ar.ts              every user-facing string (Egyptian Arabic)
  lib/api/                ChairoApi interface · live (fetch) · mock (in-memory, same rules)
  lib/                    errors (code → Arabic), format (dates/prices/phones), dates (time zones), hours,
                          booking-actions (next step for a booking), query-client (offline + foreground refetch)
  stores/auth.ts          session: access token in memory, refresh token in SecureStore
  hooks/queries.ts        TanStack Query hooks + cache keys
__tests__/                unit tests (jest-expo)
docs/DESIGN.md            design system
PHASES.md                 roadmap
```

## Rules of thumb

- **Never use raw `<Text>` or hex colors in screens.** Use `@/components/ui` and `useTheme().colors`.
- **All copy lives in `src/i18n/ar.ts`.**
- **RTL:** layout uses `start`/`end`, never `left`/`right`. Directional icons use `ChevronForward`/`ChevronBack`.
  Phone numbers and codes inside Arabic text go through `ltr()` / `formatPhone()`.
- **API:** add every call to `ChairoApi` in `lib/api/live.ts` and mirror it in `lib/api/mock`, so the app keeps working without the backend.
- **Booking rules come from the API** (`canCancel`, `canReschedule`, `isLateIfCancelledNow`). Don't re-implement them in the UI.
# Chairo-APP
