/**
 * Design tokens — "Liquid Glass" (iOS 26 style) adapted for an Arabic-first barber booking app.
 * Figma reference: https://www.figma.com/design/wa4Az0aK4vYunlv3nCxkf1 (page "Liquid Glass v1").
 * Contrast notes (WCAG): text on surface ≥ 4.5:1 in both themes; onPrimary on primary ≥ 4.5:1.
 * Components must read colors from `useTheme().colors`, never raw hex.
 */

const light = {
  background: '#F4F5F7', // one calm neutral; white surfaces sit on it
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF2',
  surfaceInk: '#0B1220', // dark hero cards in both themes
  onInk: '#F8FAFC',
  onInkMuted: '#CBD5E1',

  text: '#0B1220',
  textMuted: '#4B5565',
  textSubtle: '#626B78',

  primary: '#0F766E',
  primaryBright: '#14B8A6', // top of the primary gradient / glow
  primaryPressed: '#115E59',
  onPrimary: '#FFFFFF',
  primarySoft: '#E3F3F1',
  onPrimarySoft: '#0B5C56',

  accent: '#B45309',
  accentSoft: '#FDF1E1',

  success: '#15803D',
  successSoft: '#E5F6EA',
  warning: '#B45309',
  warningSoft: '#FDF1E1',
  danger: '#C92A2A',
  dangerSoft: '#FDECEC',
  info: '#1D4ED8',
  infoSoft: '#E6EDFD',

  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  scrim: 'rgba(15, 23, 42, 0.55)',
  shadow: '#0F172A',

  /** Card/chrome fills where native Liquid Glass isn't used. Solid: the page is one flat color. */
  glass: '#FFFFFF',
  glassStrong: '#FFFFFF',
  glassBorder: 'rgba(15, 23, 42, 0.06)',
  glassPressed: '#F8FAFC',
  /** active "lens" behind the selected tab */
  lens: 'rgba(15, 118, 110, 0.11)',
};

const dark: typeof light = {
  background: '#0F1418', // soft charcoal instead of near-black: less glare against light text
  surface: '#171E25',
  surfaceMuted: '#1A222C',
  surfaceInk: '#132029',
  onInk: '#F8FAFC',
  onInkMuted: '#CBD5E1',

  text: '#F1F5F9',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',

  primary: '#2DD4BF',
  primaryBright: '#5EEAD4',
  primaryPressed: '#5EEAD4',
  onPrimary: '#042F2E',
  primarySoft: '#0F2E2B',
  onPrimarySoft: '#7BEADB',

  accent: '#FBBF24',
  accentSoft: '#2E2410',

  success: '#4ADE80',
  successSoft: '#10291A',
  warning: '#FBBF24',
  warningSoft: '#2E2410',
  danger: '#F87171',
  dangerSoft: '#341616',
  info: '#93B4FD',
  infoSoft: '#16213D',

  border: '#24303A',
  borderStrong: '#344250',
  scrim: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',

  glass: '#171E25',
  glassStrong: '#171E25',
  glassBorder: 'rgba(255, 255, 255, 0.07)',
  glassPressed: '#1F2831',
  lens: 'rgba(255, 255, 255, 0.14)',
};

export const palettes = { light, dark };
export type Colors = typeof light;

/** 4/8 rhythm */
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, xxl: 30, pill: 999 } as const;

export const iconSize = { sm: 16, md: 20, lg: 24, xl: 28 } as const;
export const iconStroke = 1.9;

/** Minimum touch target (iOS 44pt / Android 48dp) */
export const hitTarget = 48;

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

/** Arabic glyphs need generous line-height. Body never below 14. */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 42 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 32 },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 26 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
} as const;
export type TypeVariant = keyof typeof type;

/**
 * Motion tokens — one rhythm for the whole app. Durations scale with distance: `press` for touch
 * feedback, `fast` for exits and small state changes, `base` for most transitions, `slow` for entrances.
 * Exits use `fast` so leaving always feels quicker than arriving.
 */
export const motion = {
  press: 120,
  fast: 180,
  base: 260,
  slow: 380,
  /** delay between consecutive items entering a list */
  stagger: 45,
  /** items past this index enter together, so long lists never keep the user waiting */
  staggerCap: 6,
} as const;

/** Spring presets (Reanimated `withSpring`). Interruptible by nature: a new target just retargets. */
export const springs = {
  /** touch feedback: quick, barely any overshoot */
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  /** selection indicators (tab lens, segmented thumb) */
  select: { damping: 20, stiffness: 220, mass: 0.8 },
  /** large surfaces (sheets): settles without bouncing */
  sheet: { damping: 28, stiffness: 280, mass: 0.9 },
} as const;

/** Soft, low-spread elevation. Solid surfaces only: Android `elevation` draws artifacts through translucent fills. */
export const elevation = (c: Colors, level: 1 | 2 = 1) => ({
  shadowColor: c.shadow,
  shadowOpacity: level === 1 ? 0.06 : 0.12,
  shadowRadius: level === 1 ? 12 : 24,
  shadowOffset: { width: 0, height: level === 1 ? 4 : 10 },
  elevation: level === 1 ? 2 : 6,
});

/** Shadow for translucent (glass) surfaces: iOS/web shadow props only, no Android `elevation`. */
export const glassShadow = (c: Colors, level: 1 | 2 = 1) => ({
  shadowColor: c.shadow,
  shadowOpacity: level === 1 ? 0.07 : 0.14,
  shadowRadius: level === 1 ? 16 : 28,
  shadowOffset: { width: 0, height: level === 1 ? 6 : 12 },
});
