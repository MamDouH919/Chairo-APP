/**
 * Design tokens — "Soft UI Evolution" adapted for an Arabic-first barber booking app.
 * Contrast notes (WCAG): text on surface ≥ 4.5:1 in both themes; onPrimary on primary ≥ 4.5:1.
 * Components must read colors from `useTheme().colors`, never raw hex.
 */

const light = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  surfaceInk: '#0F172A', // dark hero cards in both themes
  onInk: '#F8FAFC',
  onInkMuted: '#CBD5E1',

  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#64748B',

  primary: '#0F766E',
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
};

const dark: typeof light = {
  background: '#0A0F14',
  surface: '#121A21',
  surfaceMuted: '#1A242D',
  surfaceInk: '#16222C',
  onInk: '#F8FAFC',
  onInkMuted: '#CBD5E1',

  text: '#F1F5F9',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',

  primary: '#2DD4BF',
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
};

export const palettes = { light, dark };
export type Colors = typeof light;

/** 4/8 rhythm */
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

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

export const motion = {
  press: 120,
  fast: 180,
  base: 260,
  slow: 380,
} as const;

/** Soft, low-spread elevation (Soft UI Evolution): clearer than flat, lighter than neumorphism */
export const elevation = (c: Colors, level: 1 | 2 = 1) => ({
  shadowColor: c.shadow,
  shadowOpacity: level === 1 ? 0.06 : 0.12,
  shadowRadius: level === 1 ? 12 : 24,
  shadowOffset: { width: 0, height: level === 1 ? 4 : 10 },
  elevation: level === 1 ? 2 : 6,
});
