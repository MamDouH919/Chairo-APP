import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { withUniwind } from 'uniwind';

import { motion, springs } from '@/theme';

/**
 * Motion primitives. Everything here animates transform/opacity only (no layout), and Reanimated's
 * default `ReduceMotion.System` makes springs, timings and entering animations jump straight to their
 * final state when the OS "Reduce Motion" setting is on.
 */

const UniView = withUniwind(Animated.View);
const AnimatedPressable = withUniwind(Animated.createAnimatedComponent(Pressable));

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** scale while pressed; smaller surfaces can shrink more (icon 0.9, button 0.97, card 0.985) */
  scaleTo?: number;
  /** opacity while pressed; leave at 1 when `style` controls opacity itself */
  dim?: number;
}

/** A Pressable that shrinks under the finger and springs back on release. */
export function PressableScale({
  scaleTo = 0.97,
  dim = 1,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, scaleTo]);
    if (dim >= 1) return { transform: [{ scale }] };
    return { transform: [{ scale }], opacity: interpolate(pressed.value, [0, 1], [1, dim], Extrapolation.CLAMP) };
  });
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: motion.press }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withSpring(0, springs.press));
        onPressOut?.(e);
      }}
      style={[style, anim]}
    />
  );
}

/**
 * Entrance for a block of content: fades in while rising a few dp. `index` staggers siblings in a list.
 * Keep to the stock preset: on web, `.withInitialValues()` leaves the view absolutely positioned (it
 * overlaps its siblings) and custom `.easing()` is unsupported.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  style,
  className,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  return (
    <UniView
      entering={FadeInDown.duration(motion.slow).delay(delay + Math.min(index, motion.staggerCap) * motion.stagger)}
      {...(className === undefined ? null : { className })}
      style={style}>
      {children}
    </UniView>
  );
}

const ScrollContext = createContext<SharedValue<number> | null>(null);
export const ScrollProvider = ScrollContext.Provider;

/** Vertical scroll offset of the enclosing <Screen>, for scroll-linked effects (parallax, collapsing bars). */
export function useScrollY(): SharedValue<number> {
  const fallback = useSharedValue(0);
  return useContext(ScrollContext) ?? fallback;
}
