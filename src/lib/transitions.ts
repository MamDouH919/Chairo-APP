import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { motion } from '@/theme';

type ScreenOptions = Exclude<NonNullable<ComponentProps<typeof Stack.Screen>['options']>, (...args: never[]) => unknown>;

/**
 * Screen transitions, named by what the navigation *means* so every stack moves the same way.
 *
 * - `push`  going deeper (list → detail). iOS keeps its native push, which already mirrors in RTL and
 *           supports the edge-swipe back. Android uses a short rise-and-fade: direction-neutral, so it
 *           is correct in this Arabic (RTL) app without mirroring a horizontal slide by hand.
 * - `swap`  replacing the whole context (sign-in → app, customer ⇄ shop mode, success): cross-fade,
 *           because there is no spatial relationship to express.
 *
 * `animationDuration` only applies on iOS and only to the non-default animations.
 */
export const stackTransitions = {
  push: {
    animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
  },
  swap: {
    animation: 'fade',
    animationDuration: motion.base,
  },
} satisfies Record<string, ScreenOptions>;
