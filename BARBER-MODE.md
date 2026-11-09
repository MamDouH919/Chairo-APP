# Barber login + shop mode (prompt for Claude Code, mobile repo)

> Paste below the line into Claude Code at the root of the Chairo mobile repo.
> Needs the API from `chairo-api/docs/prompts/PHASE-9-SHOP-CUSTOMERS.md` for the customers screens and the upcoming/attention lists. The rest works on the existing API.

---

We're pulling **shop mode** forward. A barber (or shop owner) must be able to **log in as a barber, follow his customers, and see what appointments are coming**. Read `PHASES.md` (Phase 4 "Shop mode" is the spec this extends), `chairo-api/docs/CONVENTIONS.md`, `NOTIFICATIONS.md` and `POLICY.md`, and the existing app code (`lib/api`, auth, i18n, design system).

Rules that always apply:
- Every API call goes through `ChairoApi` (live + mock).
- Copy lives in `i18n/ar.ts`.
- Every new `error.code` is mapped in `lib/errors.ts`.
- Query keys are prefixed with `userId`, and everything is cleared on sign-out.
- Design rules for barbers: **big buttons, minimal typing, learnable in 10 minutes**.

Post a short plan, then build in the order below. Stop after each step and show me screenshots (iOS + Android, light + dark).

## 1. Login: "أنا زبون" / "أنا حلاق أو صاحب محل"
- The welcome screen gets two clear entries. **Both use the same phone OTP** (one account per phone). The choice only sets the starting mode and the copy ("ادخل برقمك اللي صاحب المحل ضافه").
- After verify, call `GET /me/staff-context` (or `GET /shops/mine`):
  - **Has memberships** → shop mode. With 2+ shops, show a shop picker. Remember the last shop + mode per user.
  - **Chose barber but has no membership** → a "مش لاقيين محل ليك" screen:
    - shows his number big ("رقمك: 0101 234 5678");
    - a button **"ابعت رقمي لصاحب المحل"** opens the WhatsApp share sheet with a ready message;
    - **"عندي محل — سجّله"** goes to a short shop registration (name, area, address, map pin, phone) → `POST /shops` → a "طلبك اتبعت، هنكلمك قريب" state (shop is PENDING until our admin approves);
    - "ادخل كزبون" as an exit;
    - pull-to-refresh re-checks memberships (the owner might add him while he waits).
- The **mode switch** lives in the header avatar menu + Account: "وضع المحل" ↔ "وضع الزبون". Barbers open the app in shop mode by default.

## 2. Shop mode navigation (bottom tabs, shop mode only)
1. **النهارده**: today's schedule (§3).
2. **الجاي**: upcoming appointments (§4).
3. **العملاء**: customers (§5).
4. **المحل**: for an OWNER: services, barbers, members, hours, share link/QR, check-in QR, emergency close, billing. For a BARBER: my hours, my time blocks, accepting bookings on/off, my profile + photo.

The role comes from the membership, not `user.role`. A BARBER sees only his own chair everywhere; an OWNER gets a barber filter chip row ("الكل / محمد / أحمد …").

## 3. Today ("النهارده")
Build exactly what's in PHASES.md §4a–4c:
- **The "محتاج انتباهك" strip** at the top, from `GET /shops/:id/attention`:
  - unacknowledged ("شفت الكل");
  - unconfirmed soon ("ممكن تدي الميعاد لزبون موجود");
  - past grace with no arrival → وصل / مجاش;
  - reassign pending.
- **Next customer** card with a countdown, then the timeline (`GET /shops/:id/schedule?date=today`) with free gaps ("فاضي 25 دقيقة" → walk-in).
- Booking card: time, customer name, service, status chip, badge, a 📝 when there's a note, delay, a call button. Tap → booking sheet with big buttons:
  - وصل / بدأ / خلص / مجاش (no-show disabled until grace)
  - إلغاء (with a reason)
  - owner only: "حوّل لحلاق تاني".
- **"زبون دلوقتي"** floating button (walk-in in 2 taps), **"حجز يدوي"**, and **"متأخر 10/15/30"**.
- Live updates via SSE (`react-native-sse`) + `If-None-Match`, with a 30s polling fallback. Today is persisted per user + shop so it works offline, showing "آخر تحديث …".

## 4. Upcoming ("الجاي")
- `GET /shops/:id/upcoming?days=7`: a day-grouped list (sticky headers "بكرة · الأحد 9 نوفمبر"), with the count per day in a horizontal day strip at the top. Tap a day to jump.
- Each row: time, customer (+ badge, 📝), service, status (BOOKED / CONFIRMED / UNCONFIRMED colored), source icon (app / manual / WhatsApp). Tap → the same booking sheet (actions that need "today", like arrive, are hidden for future days; cancel and reassign stay).
- Empty day: "مفيش حجوزات — شارك لينك المحل" → share sheet.
- Pull to refresh, plus a refetch on foreground and on any staff push.

## 5. Customers ("العملاء")
- `GET /shops/:id/customers` with a search box (name or phone in any format), and filter chips: الكل / عندهم ميعاد جاي / جداد / دايمين / بقالهم كتير مجوش / عليهم ملاحظة. Sort: last visit (default) / most visits.
- Row: name, masked-looking phone, badge, visits count, last visit ("من 12 يوم"), next booking if any, a 📝 if there's a note.
- **Customer page** (`GET /shops/:id/customers/:key`):
  - header with name, badge, and big **اتصل** / **واتساب** buttons;
  - stats: visits, no-shows, last visit, favourite barber;
  - upcoming bookings;
  - history (paginated);
  - **ملاحظة خاصة بالمحل**: `PUT …/note`, ≤ 500 chars, with a hint "الزبون مش بيشوفها" (e.g. "بيحب الدرجة 2 على الجناب");
  - actions: "احجزله" (manual booking prefilled with name + phone), and owner only: block / unblock customer.
- Lapsed customers (35+ days) show a "فكّره" button that opens WhatsApp with a friendly prefilled message and the shop link. This is sent from the barber's own WhatsApp, not by us.
- Barber scoping is enforced by the API. The UI just never offers a barber filter to a BARBER.

## 6. Notifications in shop mode
- Push permission is **required** on first entry to shop mode (full-screen explainer, settings link if denied).
- `new_booking` channel with the custom sound → tap opens the booking sheet (`chairo://shop/{shopId}/booking/{id}`). Switch to shop mode + that shop if needed.
- A barber ignores pushes for other chairs (`data.barberId`). An owner gets all of them.
- Foreground push → toast + invalidate attention, today, upcoming and that customer.
- `NO_SHOW_NUDGE` actions (وصل / مجاش) work from the notification with the app killed.

## 7. Done means
- Typecheck, lint and tests pass. Unit tests cover:
  - the mode/landing logic (memberships 0 / 1 / many × chose customer / barber);
  - the day grouping in Cairo time;
  - the badge + "lapsed" labels;
  - the error map for new codes (`NOT_SHOP_MEMBER`, `FORBIDDEN`, `TOO_EARLY_FOR_NO_SHOW`, `BOOKING_STATE_CHANGED`, `SLOT_TAKEN`, …).
- The mock API covers every new screen (`EXPO_PUBLIC_API_URL` unset → mock), with a demo shop, 2 barbers and ~30 customers.
- Manually tested against the local API with the seed's owner and barber phones:
  - the barber sees only his chair and customers;
  - the owner sees all;
  - a phone with no membership gets the "مش لاقيين محل ليك" screen;
  - registering a shop shows the pending state.
- `PHASES.md` updated: this work marked done under Phase 4, and anything left listed.
- Report back: screens built, screenshots, decisions you made, and any API gap you hit (exact endpoint + what's missing).
