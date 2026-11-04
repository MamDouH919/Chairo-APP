# Chairo mobile — phases

Each phase ships something usable and is aligned with the backend phases in `chairo-api/README.md`.
API Phases 1–7 are done, so nothing here waits for a planned API phase. The only blockers are the [API gaps](#api-gaps) below.

| # | Phase | Depends on API | Status |
|---|---|---|---|
| **1** | **Foundation + core customer booking** | 1–4 ✅ | ✅ done (follow-ups in Phase 2) |
| 2 | Booking lifecycle: reschedule, check-in QR, dispute, report-late, strikes | 4 ✅ | next |
| 3 | Push notifications + live updates | 5 ✅ | ready; needs a development build and the iOS token decision |
| 4 | Discovery: nearby, search, favourites, rebook, waitlist, reviews | 6 ✅ | ready |
| 5 | Barber / owner mode: schedule, walk-ins, running late | 2–6 ✅ | ready; photo upload blocked by API gap |
| 6 | Release: EAS builds, store requirements, force update, analytics, crash reporting, tests | 7 ✅ (app config) | blocked by API gap: account deletion |

**In every phase:** add calls to `ChairoApi` in `lib/api/live.ts` and mirror them in `lib/api/mock`, put copy in `i18n/ar.ts`,
and map each new `error.code` to Arabic in `lib/errors.ts`. Unmapped codes fall back to "the problem is on our side", which is wrong for most 4xx errors.

## Decisions needed

- **One app or two?** Phase 5 plans one app with a role switch, but the bundle id is `app.chairo.customer` and the API docs talk about a "barber app".
  Decide before the first store submission, because the id can't change afterwards.
- **iOS push token:** see [API gaps](#api-gaps). Decide before Phase 3.
- **First release scope:** Phase 6 is listed last. Decide whether customers can launch before Phase 5, or whether barbers need the app on day one.

## API gaps

Features the app needs that `chairo-api` doesn't have yet:

| Gap | Today | Blocks |
|---|---|---|
| **Self-service account deletion** | Only `POST /admin/users/:userId/anonymize` | App Store and Google Play submission (Phase 6) |
| **FCM token on iOS** | `POST /devices` expects an FCM token, but `expo-notifications` `getDevicePushTokenAsync` gives the native APNs token on iOS. Either add Firebase Messaging to the iOS app or teach the API to accept APNs tokens | iOS push (Phase 3) |
| **Image upload** | `avatarUrl` is a plain URL and there is no upload or presign route | Avatar (Phase 2 follow-up), shop and barber photos (Phase 5) |
| **Universal / app links** | No `apple-app-site-association` or `assetlinks.json` in the API; both must be served from `chairo.app` | Opening `chairo.app/s/{slug}` in the app (Phase 4) |
| **Owner billing** | Invoice routes are admin-only, but owners get `INVOICE_ISSUED` and `SUBSCRIPTION_PAST_DUE` pushes | An owner invoices screen (Phase 5) |

---

## Phase 1 — Foundation + core booking ✅

- Expo SDK 58 + Expo Router; Arabic forced RTL (`expo-localization` `forcesRTL`, plus RNW `LocaleProvider` on web)
- Design system: tokens (light/dark), IBM Plex Sans Arabic, UI kit, motion that respects reduced-motion
- API layer: one `ChairoApi` interface, live + mock implementations; envelope parsing; Arabic error messages per `error.code`
- Auth: phone → OTP (autofill, paste, resend cooldown, dev code) → name; single-flight token refresh; SecureStore
- Home: next-booking hero, featured shops, local search
- Shop page: open-now status (handles past-midnight hours), services, team, hours, call / directions
- Booking flow: service → barber ("any barber") → day + time slots → review → confirm
  (idempotency key, policy acceptance, slot-taken recovery)
- Bookings (upcoming / past), booking details (confirm "I'm coming", cancel with late-cancel warning, timeline)
- Notifications inbox (read / read all), account (edit name, policy, logout)

## Phase 2 — Booking lifecycle

- **Reschedule** (`POST /bookings/:id/reschedule`): reuse `DayStrip` + `SlotGrid`, allow changing barber
- **Check-in QR** (`POST /bookings/:id/check-in`): `expo-camera` scanner, shown from 30 min before start; handle camera permission denied, Arabic permission text in `app.json`
- **Dispute a no-show** within 24 h (`POST /bookings/:id/dispute`)
- **Report "barber was late"** (`POST /bookings/:id/report-late`)
- **My record** (`GET /me/strikes`, `POST /me/strikes/:id/appeal`): strike status, restriction banner (same-day only / suspended).
  Route it at `account/strikes`, because push deep links to `chairo://account/strikes`
- Running-late banner: already rendered from `delayMin`; add free reschedule / cancel shortcuts
- Sessions screen (`GET /auth/sessions`, `DELETE /auth/sessions/:id`, logout-all)

### Phase 1 follow-ups (do these first)

- **Bug: clear the query cache on sign-out.** `signOut()` keeps the `QueryClient` cache and query keys aren't per-user, so the next account on the device can see the previous account's bookings
- Pagination: bookings and the inbox only load the first 20 items (`useInfiniteQuery`)
- Refetch on return to foreground and on reconnect (`focusManager` / `onlineManager`), and an offline state
- Root error boundary, so a render error doesn't leave a blank screen
- Missing Arabic messages for codes this phase already hits: `OTP_SEND_FAILED`, `SESSION_REVOKED`, `REFRESH_INVALID`, `REFRESH_REUSED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `FORBIDDEN`
- Account rows: Help says "coming soon" (add a support contact)
- Housekeeping: `npx expo install --fix` (7 packages behind), remove the `reset-project` script (its file is deleted)

## Phase 3 — Notifications (API Phase 5)

**Do first:** EAS `development` profile and a development build (remote push doesn't work in Expo Go on Android), Firebase project + config files, and the `expo-notifications` plugin in `app.json`.

- `expo-notifications`: permission prompt at the right moment (after first booking); `POST /devices` on every app start and on token refresh; pass `fcmToken` to `POST /auth/logout`
- Android channels with the exact ids from `chairo-api/docs/NOTIFICATIONS.md`: `new_booking`, `reminders`, `general`. Create them before asking for the token: Android 13+ shows no prompt until a channel exists, and most channel settings can't change later
- Actionable reminders ("Coming" / "Cancel") from the 2 h reminder: register the categories at runtime (`BOOKING_REMINDER`, `REASSIGN_REQUEST`, later `NO_SHOW_NUDGE`). Test on real devices with the app killed, on both platforms, including Android's `data.actions`
- **Reassign request:** accept / decline (`POST /bookings/:id/reassign/accept|decline`) from the notification and from booking details
- Deep links from a notification to `booking/[id]`, from a warm start, a cold start and while signed out (continue after login). Cover the inbox rows too
- **Live updates:** when a push arrives in the foreground, refresh the affected booking and the unread count
- Notification preferences screen (`GET`/`PATCH /me/notification-preferences`): show `locked` items as always on, `PREFERENCE_LOCKED`

## Phase 4 — Discovery & trust (API Phase 6)

- Nearby shops (`expo-location`) + map view (`GET /public/shops/map`, bbox ≤ ~20 km, `BBOX_TOO_LARGE`); real search (`GET /public/shops/search`) replaces the local filter and `EXPO_PUBLIC_FEATURED_SLUGS`
- Location permission denied: fall back to city / area chips (`GET /public/areas`)
- Filters and sort: open now, free now, service; recommended / distance / rating. New card fields: distance, `onTimePct`, `priceFrom`, `matchedBarber`
- Shop page additions: `ratingBreakdown`, `onTimePct`, recent reviews, each barber's `nextFreeAt`
- Favourites (barbers and shops) and **one-tap rebook** (`GET /me/rebook-options`), posting through the normal booking path
- "Instant alternatives" when a slot is taken: read `alternatives` from the `SLOT_TAKEN` error details (the booking flow currently only refetches slots), and `GET /public/alternatives` when a barber is full
- **Waitlist:** join (`POST /waitlist`, max 3 active), my entries, and the 10-minute held offer from `SLOT_OPENED` with a countdown, accept / decline
- Reviews after a DONE booking: `GET /me/reviews/pending`, submit from `REVIEW_PROMPT`, edit, all reviews (`GET /public/shops/:slug/reviews`), report a review
- Report a shop/barber (`POST /reports`)
- Open shop links `chairo.app/s/{slug}` in the app (universal links / app links; needs the API gap above)

## Phase 5 — Barber / owner mode

The API already supports it (`/shops/:id/schedule`, walk-ins, acknowledge, arrive/start/finish, no-show, running-late).
Plan: same app, role switch in Account when `GET /shops/mine` returns a shop (membership roles live there, not in `user.role`). See [Decisions needed](#decisions-needed).

- Today's schedule (ETag polling via `If-None-Match`) + live updates from SSE (`GET /shops/:id/schedule/stream`, with `?access_token=`; React Native has no built-in `EventSource`), acknowledge new bookings
- Booking actions: arrive · start · finish · no-show · cancel with reason · reassign to another barber
- Walk-in in two taps, manual booking, running late (10 / 15 / 30)
- Time blocks (break, prayer, day off), working hours, cancel a barber's day
- Owner: services, barbers, members, shop profile, photos (needs upload, see API gaps), check-in QR display, share link + printable QR, emergency close
- Reviews: read and reply. Customer blocks
- Staff push: `new_booking` channel with the custom sound (API expects `new_booking.ogg` / `.caf`; the Expo plugin recommends `.wav`, so check on devices), `NO_SHOW_NUDGE` actions, deep link `chairo://shop/{shopId}/booking/{id}` (needs a route alongside `shop/[slug]`), filter other chairs' bookings by `data.barberId`

## Phase 6 — Release

**Builds and config**

- EAS Build profiles (development / preview / production; `development` is created in Phase 3), app icons + splash in brand colors
- Production API URL per profile, plus a build check: with no `EXPO_PUBLIC_API_URL` the app silently runs on mock data, so that must never ship
- EAS Update channels for over-the-air fixes
- App config on launch (`GET /public/app-config`): force update from `minAppVersion`, `maintenanceBanner`, `featureFlags`, and ask for policy acceptance again when `policyVersion` changes (today it is stored once per user)

**Store requirements**

- In-app account deletion (needs the API gap above)
- Privacy policy and terms URLs, App Store privacy labels, Google Play data safety form
- Store listing in Arabic: screenshots, description, review account + OTP path for the store reviewers

**Quality**

- Sentry (or similar), analytics events for the booking funnel
- Unit tests for the logic most likely to break (`lib/hours`, `lib/dates`, `lib/format`, `lib/errors`) and CI for lint, typecheck and tests
- Maestro E2E: login → book → cancel
- Accessibility pass on real devices (VoiceOver / TalkBack, largest font size), Android back behaviour
- English locale (the API already sends `nameEn` and English policy text). `forcesRTL` is on, so this also needs a direction switch
