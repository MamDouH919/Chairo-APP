# Chairo design system

Source of truth in code: `src/theme/tokens.ts`. This page explains the choices.

## Direction

**Soft UI Evolution**: calm, professional surfaces with subtle depth. Chosen with the UI/UX Pro Max design-system search
for a booking product, then adapted:

- Brand palette replaced: the suggested sky blue (#0284C7) gives white text only ~4.1:1, so primary is **teal 700**.
- Fonts replaced: the suggested Calistoga / Inter has no Arabic, so the app uses **IBM Plex Sans Arabic**
  (Arabic + Latin in one family, 4 weights).
- RTL handling is general best practice. The skill database had no React Native RTL entry.

Signature element: the **ink card** (`surfaceInk`), a near-black card for the highest-emphasis item on a screen
(next booking, booking ticket, profile). One per screen at most.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | #0F766E | #2DD4BF | CTAs, selection, links |
| `onPrimary` | #FFFFFF (5.5:1) | #042F2E | text on primary |
| `surfaceInk` | #0F172A | #16222C | hero cards |
| `accent` | #B45309 | #FBBF24 | ratings, founding partner |
| `success` / `warning` / `danger` | #15803D / #B45309 / #C92A2A | #4ADE80 / #FBBF24 / #F87171 | status |
| `text` / `textMuted` / `textSubtle` | #0F172A / #475569 / #64748B | #F1F5F9 / #CBD5E1 / #94A3B8 | ≥ 4.5:1 on surface |

Every color has a `*Soft` background partner for badges and tinted rows.

## Type (IBM Plex Sans Arabic)

| Variant | Size / line | Weight |
|---|---|---|
| display | 30 / 42 | Bold |
| title | 22 / 32 | Bold |
| heading | 18 / 28 | SemiBold |
| body / bodyStrong | 16 / 26 | Regular / SemiBold |
| label | 14 / 22 | Medium |
| caption | 13 / 20 | Regular |
| overline | 12 / 18 | SemiBold |

Arabic needs taller line-heights than Latin, so all are ~1.5×. Digits are Latin (`ar-EG-u-nu-latn`) for times, prices and codes.

## Spacing, shape, motion

- Spacing: 4/8 rhythm (`xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32 · huge 48`). Screen gutter 20.
- Radius: controls 12–16, cards 20, sheets 28, pills.
- Touch targets ≥ 48. Primary CTA 56 high, pinned in a safe-area footer.
- Motion: 120 ms press, 180–260 ms transitions, short list stagger. Reanimated layout animations follow the system
  reduced-motion setting, and skeletons stop pulsing under it.

## RTL rules

- Layout uses `start` / `end` only. Native is flipped by `forcesRTL`; web gets RTL through RNW's `LocaleProvider`
  (`src/components/direction-provider.web.tsx`).
- `Text align="start"` is the default. Never hard-code `textAlign: 'right'`.
- Directional icons: `ChevronForward` / `ChevronBack`. Non-directional icons are never mirrored.
- Phone numbers / codes inside Arabic sentences: wrap with `ltr()` (Unicode isolates). OTP boxes and the phone field are LTR.

## Accessibility checklist (per screen)

- Icon-only buttons have `label` (required prop on `IconButton`)
- Headings use `accessibilityRole="header"`; selectable rows use `radio` with `checked`; tabs use `tab` with `selected`
- Errors are shown under the field, announced politely, and never rely on color alone
- Test with the largest system font (`maxFontSizeMultiplier` 1.6) and in both themes
