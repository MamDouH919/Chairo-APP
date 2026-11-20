import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { withUniwind } from 'uniwind';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { glassShadow, useTheme } from '@/theme';

const UniGlassView = withUniwind(GlassView);

/**
 * Native Liquid Glass only renders on iOS 26+. Some iOS 26 betas ship without the API and crash,
 * so both checks are required before mounting a GlassView.
 */
export const LIQUID_GLASS = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

/** "Reduce transparency" (iOS) — glass then falls back to solid surfaces. */
export function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

interface GlassProps extends ViewProps {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * `chrome` floats over scrolling content (tab bar, bottom bars, icon buttons): it uses native glass on
   * iOS 26 and a near-opaque fill elsewhere so text behind it never competes.
   * `content` sits in the page (cards, rows): always the translucent fill — Apple reserves real glass for
   * the navigation layer, and dozens of native effect views in a list are costly.
   */
  layer?: 'chrome' | 'content';
  /** only affects native glass: reacts to touch with the iOS 26 highlight */
  interactive?: boolean;
  shadow?: 0 | 1 | 2;
}

/** A Liquid Glass surface with platform-appropriate fallbacks. */
export function Glass({ children, style, className, layer = 'content', interactive, shadow = 1, ...rest }: GlassProps) {
  const { colors, scheme } = useTheme();
  const reduce = useReduceTransparency();

  if (layer === 'chrome' && LIQUID_GLASS && !reduce) {
    return (
      <UniGlassView
        glassEffectStyle="regular"
        colorScheme={scheme}
        isInteractive={interactive}
        className={className}
        style={style}
        {...rest}>
        {children}
      </UniGlassView>
    );
  }

  // Solid card fill with a hairline border; shadows stay as style (tuned radius/offset, no class equivalent).
  return (
    <View
      className={`bg-card border ${reduce ? 'border-border' : 'border-foreground/10'} ${className ?? ''}`}
      style={[shadow ? glassShadow(colors, shadow) : null, style]}
      {...rest}>
      {children}
    </View>
  );
}

/** The single, solid page color behind every screen. */
export function Backdrop() {
  return <View pointerEvents="none" className="absolute inset-0 bg-background" />;
}

/** A soft radial light (no hard edge), for hero cards and covers. Size it with `style`. */
export function Glow({ color, style, className }: { color: string; style?: StyleProp<ViewStyle>; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" className={`absolute ${className ?? ''}`} style={style}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
