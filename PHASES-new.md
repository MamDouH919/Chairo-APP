# Chairo mobile: phases

**One app, two modes.** Every user starts as a customer. If `GET /shops/mine` returns a membership (OWNER or BARBER), the app also has a **shop mode**: today's bookings, new-booking alerts, walk-ins and booking actions. Each side always knows what bookings are waiting on them:

- **Customer:** my upcoming bookings, what I have to do next (confirm "I'm coming", check in, review).
- **Barber:** my chair today, bookings I haven't acknowledged yet, who's next, who's late.
- **Owner:** every chair in the shop, plus shop settings.

Backend phases 1–7 are done (`chairo-api/README.md`). Nothing here waits for a planned API phase except the [API gaps](#api-gaps). Those are covered by `chairo-api/docs/prompts/PHASE-8-MOBILE-GAPS.md`.

| # | Phase | Needs | Status |
|---|---|---|---|
| **1** | **Foundation + core customer booking** | API 1–4 ✅ | ✅ done (follow-ups in Phase 2) |
| 2 | Hardening + booking lifecycle | API 4 ✅ | ✅ code done; needs checks on devices and the real API (see Phase 2) |
| 3 | Push notifications + live updates (both modes) | API 5 ✅ · dev build · Firebase on iOS | **next** |
| 4 | **Shop mode**: barber + owner | API 2–6 ✅ · photo upload (gap) | ready |
| 5 | **Pilot release (Banha)**: shop links, app config, store requirements | account deletion + app links (gaps) | blocked by gaps |
| 6 | Discovery & trust: nearby, search, favourites, rebook, waitlist, reviews | API 6 ✅ | after the pilot release |
| 7 | Quality & growth: E2E, analytics funnel, English | — | ongoing |

**Why this order.** Barbers must have the app on day one. Without shop mode, nobody acknowledges bookings (the API alerts the owner and us after 15 min), nobody marks Arrived / No-show (so strikes and the policy can't work), and walk-ins aren't blocked (so double booking happens at the chair). The product plan lists "neglecting barber tools" as a top risk. The pilot also brings customers in through the shop's **QR/link**, so nearby search can follow right after launch.

**In every phase:**
- Add calls to `ChairoApi` in `lib/api/live.ts` and mirror them in `lib/api/mock`.
- Put copy in `i18n/ar.ts`.
- Map every new `error.code` to Arabic in `lib/errors.ts`. Unmapped codes fall back to "the problem is on our side", which is wrong for most 4xx errors. Keep `lib/errors.ts` in sync with `ErrorCodes` in the API (generate a list from `docs/openapi.admin.json` or the API's `error-codes.ts`), and add a test that fails on any unmapped code.
- **Query keys are per user**: prefix them with `userId`, so cached data never crosses accounts.

## Decisions (made)

| Question | Decision | Why |
|---|---|---|
| One app or two? | **One app** with a customer mode and a shop mode. Change the ids **now**, before any store submission: iOS `bundleIdentifier` and Android `package` go from `app.chairo.customer` to **`app.chairo`**. Display name "Chairo". | Barbers are customers too, there's one codebase and one release train, and one store listing that shops can tell their customers to install. If we ever need a separate barber listing, build a second variant from the same codebase with `app.config.ts` (`APP_VARIANT=shop`, its own id) without forking. |
| iOS push token | **FCM on both platforms.** Add `@react-native-firebase/app` + `@react-native-firebase/messaging` (config plugins, `GoogleService-Info.plist`, `google-services.json`), upload the APNs auth key (.p8) to Firebase, and get the token from `messaging().getToken()` on iOS and Android. Keep `expo-notifications` for permissions, Android channels, iOS categories (action buttons) and foreground display. **No API change.** | The API's staff alerts use FCM **topics** (`shop-{id}-staff`), and APNs tokens can't subscribe to topics. Token cleanup, dry-run and routing are all built on FCM. One token type means no special cases. |
| First release scope | **Pilot = customer booking + lifecycle + push + shop mode + shop links.** Nearby search, favourites, waitlist and reviews ship in the first update after the pilot (Phase 6). | See "Why this order". Pilot customers arrive through a shop's QR/link, not through search. |

Still open, and not blocking: the **support contact** (phone/WhatsApp number) for Help. Put it in `GET /public/app-config` (API gap) so it can change without a release.

## API gaps

These need backend work. The prompt is `chairo-api/docs/prompts/PHASE-8-MOBILE-GAPS.md`.

| Gap | Today | Blocks |
|---|---|---|
| **Self-service account deletion** | Only `POST /admin/users/:userId/anonymize` | App Store / Google Play submission (Phase 5) |
| **Image upload** | `avatarUrl` / `photoUrl` / shop photos are plain URLs, and there's no upload or presign route | Avatar (Phase 2), barber and shop photos (Phase 4) |
| **App links** | No `apple-app-site-association` / `assetlinks.json`, and no `/s/{slug}` web page on `chairo.app` | Opening a shop's QR/link in the app (Phase 5) |
| **Owner billing** | Owners get `INVOICE_ISSUED` / `SUBSCRIPTION_PAST_DUE` pushes. Check whether `GET /shops/:shopId/billing` exists (it was in the Phase 7 spec); add it if not | Owner billing screen (Phase 4) |
| **Support contact + push sound file name** | No support contact in app config; the API sends sound `new_booking` | Help row (Phase 2), staff sound (Phase 3) |
| **Check-in state on the booking** | The customer booking response has no `customerCheckedInAt`. The app remembers a check-in only until restart or sign-out, then asks again (harmless, the API ignores repeats). Add it to the booking mapper | "What do I need to do?" card (Phase 2) |

The API README marks Phase 8 as done, so re-check the rows above when each one is picked up. The support contact is already wired up and used in the app.

---

## Phase 1: Foundation + core booking ✅

- Expo SDK 58 + Expo Router. Arabic forced RTL (`expo-localization` `forcesRTL`, plus RNW `LocaleProvider` on web).
- Design system: tokens (light/dark), IBM Plex Sans Arabic, UI kit, motion that respects reduced motion.
- API layer: one `ChairoApi` interface with live + mock implementations, envelope parsing, Arabic error messages per `error.code`.
- Auth: phone → OTP (autofill, paste, resend cooldown, dev code) → name. Single-flight token refresh. Tokens in SecureStore.
- Home: next-booking hero, featured shops, local search.
- Shop page: open-now status (handles past-midnight hours), services, team, hours, call / directions.
- Booking flow: service → barber ("any barber") → day + time slots → review → confirm. Covers the idempotency key, policy acceptance and slot-taken recovery.
- Bookings (upcoming / past) and booking details: confirm "I'm coming", cancel with the late-cancel warning, timeline.
- Notifications inbox (read / read all) and account (edit name, policy, logout).

## Phase 2: Hardening + booking lifecycle

**Still to check or do:**
- Test on real iOS and Android devices with a development build: QR scanning, camera permission, foreground refetch, offline banner, and the new `app.chairo` ids. So far it has only run on web against the mock.
- Run it against the real API (`EXPO_PUBLIC_API_URL`).
- Avatar upload (`POST /uploads/presign` + `complete`, plus an image picker) is not built yet.
- The "قيّم" step of the action card ships with reviews in Phase 6.

### 2a. Fix first (bugs and gaps from Phase 1)
- **Bug, data leak between accounts:** on sign-out, `queryClient.clear()`, cancel in-flight queries, clear any persisted cache, and reset in-memory stores (Zustand/context). Also prefix query keys with `userId`. Test it: log in as A, open bookings, log out, log in as B, and A's data must never flash on screen, not even for one frame.
- Pagination: bookings and the inbox load only the first 20. Switch to `useInfiniteQuery` (API `page` / `meta.totalPages`).
- Refetch on return to foreground and on reconnect (`focusManager` + `AppState`, `onlineManager` + NetInfo), with an offline banner.
- Root error boundary with a retry button, so a render error doesn't leave a blank screen.
- Arabic messages for codes already hit: `OTP_SEND_FAILED`, `SESSION_REVOKED`, `REFRESH_INVALID`, `REFRESH_REUSED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `FORBIDDEN`. `REFRESH_REUSED` / `REFRESH_INVALID` → sign out cleanly and show "سجّل دخولك تاني".
- Help row: show the support contact from app config (gap), and a WhatsApp deep link.
- Housekeeping: `npx expo install --fix`, and remove the `reset-project` script.

### 2b. Booking lifecycle (customer)
- **"What do I need to do?" card** on Home and on booking details. Compute it from the booking status and time; the order is the priority:
  - BOOKED / UNCONFIRMED → "أكّد إنك جاي"
  - within 30 min of start → "اعمل check-in"
  - running late → the delay + free reschedule
  - DONE without a review → "قيّم" (Phase 6)
- **Reschedule** (`POST /bookings/:id/reschedule`): reuse `DayStrip` + `SlotGrid`, allow changing barber, and show `RESCHEDULE_TOO_LATE` as "cancel instead".
- **Check-in QR** (`POST /bookings/:id/check-in`): `expo-camera` scanner, shown from 30 min before start. Handle a denied camera permission, and put the Arabic permission text in `app.json`. Map `CHECKIN_INVALID` / `CHECKIN_WINDOW_CLOSED`.
- **Dispute a no-show** within 24h (`POST /bookings/:id/dispute`), and **report "barber was late"** (`POST /bookings/:id/report-late`).
- **My record** at `account/strikes` (push deep-links to `chairo://account/strikes`), from `GET /me/strikes` and `POST /me/strikes/:id/appeal`. Shows the strike list, the restriction banner (same-day only / suspended until …), and the appeal state.
  - Booking flow: if `SAME_DAY_ONLY`, `DayStrip` shows today only, with an explanation.
- Running-late banner: already rendered from `delayMin`. Add free reschedule / cancel shortcuts.
- **Sessions** (`GET /auth/sessions`, `DELETE /auth/sessions/:id`, logout-all).

## Phase 3: Push + live updates (API Phase 5)

**Do first:** the EAS `development` profile + a development build (remote push doesn't work in Expo Go on Android), the Firebase project + both config files + the APNs key in Firebase, and the `@react-native-firebase/*` and `expo-notifications` plugins in `app.json`. Rebuild the dev client.

- **Token:** `messaging().getToken()` on both platforms → `POST /devices` on every app start, on token refresh (`onTokenRefresh`) and after login. Pass `fcmToken` to `POST /auth/logout` and also `DELETE /devices/:token` on logout.
- **Permission prompt at the right moment:** a customer gets it after their first booking ("عشان نفكرك قبل ميعادك"). A barber/owner gets it **on first entry into shop mode**, and it's required: show a full-screen explainer, and re-prompt or link to settings if denied, because a barber without push misses bookings.
- **Android channels**, created **before** asking for the token (Android 13+ shows no prompt until a channel exists, and most channel settings can't change later). Use the exact ids from `chairo-api/docs/NOTIFICATIONS.md`:
  - `new_booking`: max importance, custom sound;
  - `reminders`: high importance;
  - `general`: default.
  - Sound file: confirm the name with the API (`new_booking`). Bundle `.wav` via the expo-notifications plugin and test that FCM `sound: new_booking` plays it on Android and iOS.
- **Actionable notifications**, with categories registered at runtime:
  - `BOOKING_REMINDER` (جاي / إلغاء)
  - `REASSIGN_REQUEST` (موافق / مش موافق)
  - `NO_SHOW_NUDGE` (وصل / مجاش)
  - Actions call the API in the background with the stored token. Test on real devices with the app killed, on both platforms.
- **Deep links** from a notification: customer `chairo://booking/{id}`, staff `chairo://shop/{shopId}/booking/{id}`, strikes `chairo://account/strikes`.
  - Cover a warm start, a cold start, and signed-out (continue after login). Cover the inbox rows too.
  - A staff link switches to shop mode for that shop.
- **Reassign request:** accept / decline from the notification and from booking details (`POST /bookings/:id/reassign/accept|decline`).
- **Foreground push:** show an in-app toast, then invalidate the affected booking query, the bookings list, the unread count, and (in shop mode) the schedule.
- **Notification preferences** (`GET`/`PATCH /me/notification-preferences`): show `locked` items as always on, and map `PREFERENCE_LOCKED`.

## Phase 4: Shop mode (barber + owner)

**Entry and switching**
- After login, load `GET /shops/mine`. If there's a membership, show a mode switch in the header and in Account.
- **Barbers default to shop mode on launch** (they open the app to see today). Remember the last mode per user.
- With several shops, show a shop picker.
- Permissions come from the membership role, not from `user.role`. A BARBER sees only his chair; an OWNER sees all chairs + shop settings. Hide what the role can't do, and still map `FORBIDDEN` / `NOT_SHOP_MEMBER`.

**4a. "My bookings today" — the core screen (ship this first)**
- `GET /shops/:id/schedule?date` as one big timeline per chair (owner: tabs or columns per barber; barber: his column only). Each booking card shows:
  - the time, customer name, service, duration;
  - the status chip;
  - the customer badge (`RELIABLE` / `NEW` / `HAS_NOTES`), a delay, and a "new" dot if unacknowledged;
  - a call button.
  Free gaps show as tappable "فاضي 25 دقيقة", which opens a walk-in.
- **"Needs your attention" strip at the top**: unacknowledged bookings (tap = acknowledge, or "شفت الكل" → `POST /shops/:id/bookings/acknowledge`), UNCONFIRMED bookings ("ممكن تدي الميعاد لزبون موجود"), and bookings past grace with no arrival (→ Arrived / No-show).
- Next customer + countdown pinned at the top; **big buttons, minimal typing** (plan: learnable in 10 minutes).
- Day switcher: today / tomorrow / the next 7 days (read-only list).
- **Live:** SSE `GET /shops/:id/schedule/stream?access_token=` (React Native has no `EventSource`; use `react-native-sse`). On each event, refetch with `If-None-Match` (304 = nothing to do). Reconnect with backoff, and fall back to polling every 30s when SSE drops. When the app is closed, push wakes the barber instead.
- **Offline:** persist today's schedule per user + shop (`@tanstack/query-async-storage-persister`, scoped by userId, cleared on sign-out). Show "آخر تحديث 10:42" and disable actions while offline, or queue only `acknowledge`.

**4b. Booking actions**
- arrive · start · finish · no-show (enabled only after grace, otherwise map `TOO_EARLY_FOR_NO_SHOW`) · cancel with reason.
- Owner only: reassign to another barber (sends the consent request), and cancel a barber's whole day.
- `BOOKING_STATE_CHANGED` → refetch silently, not an error toast (someone else already tapped).

**4c. Walk-ins, manual bookings, running late**
- **Walk-in in two taps:** "زبون دلوقتي" → `GET …/walk-in/options` shows free minutes, the next booking, services that fit, and colleagues free now → pick a service → `POST …/walk-in`.
- **Manual booking** (phone / WhatsApp customer): name + phone + service + slot (`POST /shops/:id/bookings/manual`).
- **Running late** 10 / 15 / 30 (`POST …/running-late`), showing how many customers were notified.

**4d. My schedule setup** (barber for himself, owner for anyone)
- Working hours (split shifts, `HOURS_OVERLAP`).
- Time blocks: break, prayer, day off, plus a recurring Friday prayer.
- Accepting bookings on/off.

**4e. Owner: shop management**
- Services (defaults button, prices, durations, per-barber overrides), barbers, members (add by phone, `LAST_OWNER`), shop profile + hours.
- Photos (needs upload, gap).
- Check-in QR display (the rotating one for customers to scan at the chair).
- Share link + printable QR (`GET /shops/:id/share` → share sheet + save/print image).
- Emergency close, which shows how many bookings will be cancelled before confirming.
- Reviews: read and reply. Customer blocks.
- Billing: plan, status, invoices (read-only, gap).
- End-of-day summary screen (from the `END_OF_DAY_SUMMARY` push → today's numbers).

**4f. Staff push** (wiring from Phase 3): the `new_booking` sound, `NO_SHOW_NUDGE` actions, deep link `chairo://shop/{shopId}/booking/{id}` (add the route next to `shop/[slug]`), and ignore other chairs' bookings for a barber (filter by `data.barberId`).

## Phase 5: Pilot release (Banha)

**Shop links (the pilot's main customer entry point)**
- Universal links / app links for `chairo.app/s/{slug}` → open the shop page in the app; no app installed → the web page + store badges (gap).
- `associatedDomains` (iOS) and `intentFilters` with `autoVerify` (Android) in `app.json`.

**Builds and config**
- EAS profiles: development / preview / production. App icons + splash in brand colors.
- Production API URL per profile, plus a **build check**: with no `EXPO_PUBLIC_API_URL` the app silently runs on mock data. Fail the production build (`app.config.ts` throws), and never bundle the mock API in production.
- EAS Update channels for over-the-air fixes (runtime version policy `appVersion`).
- App config on launch (`GET /public/app-config`): force update from `minAppVersion`, `maintenanceBanner`, `featureFlags`, the support contact, and re-ask for policy acceptance when `policyVersion` changes.

**Store requirements**
- In-app account deletion (gap), in Account → "احذف حسابي", with confirmation + OTP.
- Privacy policy and terms URLs, App Store privacy labels, Google Play data safety form. Disclose phone number, location (Phase 6), camera (check-in), push token.
- Store listing in Arabic: screenshots of **both modes**, the description, a review account + fixed OTP path for store reviewers (ask the API team for a reviewer test number that accepts a fixed code in production, rate-limited).

**Quality gate before submitting**
- Sentry (or similar) with release + user id (no phone).
- Unit tests for `lib/hours`, `lib/dates`, `lib/format`, `lib/errors` (the unmapped-code test) and the "what do I need to do" logic. CI for lint, typecheck and tests.
- Device checks: the push matrix (killed / background / foreground × iOS / Android × customer / staff), deep links, RTL, the largest font size, Android back.

## Phase 6: Discovery & trust (API Phase 6), first update after the pilot

- Nearby shops (`expo-location`) + map (`GET /public/shops/map`, bbox ≤ ~20 km, `BBOX_TOO_LARGE`). Real search (`GET /public/shops/search`) replaces the local filter and `EXPO_PUBLIC_FEATURED_SLUGS`.
- Location denied → city / area chips (`GET /public/areas`).
- Filters and sort: open now, free now, service; recommended / distance / rating. New card fields: distance, `onTimePct`, `priceFrom`, `matchedBarber`.
- Shop page additions: `ratingBreakdown`, `onTimePct`, recent reviews, each barber's `nextFreeAt`.
- Favourites (barbers and shops) and **one-tap rebook** (`GET /me/rebook-options`), posting through the normal booking path.
- **Instant alternatives** when a slot is taken: read `alternatives` from the `SLOT_TAKEN` error details (the flow currently only refetches slots), and `GET /public/alternatives` when a barber is full.
- **Waitlist:** join (`POST /waitlist`, max 3 active), my entries, and the 10-minute held offer from `SLOT_OPENED` with a countdown, accept / decline.
- **Reviews** after a DONE booking: `GET /me/reviews/pending`, submit from `REVIEW_PROMPT`, edit, all reviews (`GET /public/shops/:slug/reviews`), report a review.
- Report a shop/barber (`POST /reports`).

## Phase 7: Quality & growth (ongoing)

- Analytics events for the booking funnel (shop view → slot pick → confirm → arrived) and for shop-mode usage (acknowledge time, walk-ins per day).
- Maestro E2E: login → book → cancel; staff: login → acknowledge → arrive → finish.
- Accessibility pass on real devices (VoiceOver / TalkBack).
- English locale (the API already sends `nameEn` and English policy text). `forcesRTL` is on, so this also needs a direction switch.
- If needed later: a separate shop-app variant from the same codebase (`APP_VARIANT=shop`).
