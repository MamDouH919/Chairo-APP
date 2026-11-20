import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Keyboard, Modal, Platform, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';

import { elevation, motion, space, springs, useTheme } from '@/theme';

const AView = withUniwind(Animated.View);

/** How far below its resting place the sheet starts; it is fully transparent there, so no need to measure. */
const TRAVEL = 64;

/**
 * How far the keyboard overlaps the bottom of `ref`'s view. KeyboardAvoidingView miscomputes this inside a
 * Modal on Android (the field stays hidden behind the keyboard), so measure against the real window instead.
 * If the OS already resized the window, the overlap is 0 and nothing is added twice.
 */
function useKeyboardOverlap(ref: RefObject<ComponentRef<typeof View> | null>, active: boolean) {
  const [overlap, setOverlap] = useState(0);
  useEffect(() => {
    if (!active) return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow', (e) => {
      ref.current?.measureInWindow((_x, y, _w, h) => {
        setOverlap(Math.max(0, Math.round(y + h - e.endCoordinates.screenY)));
      });
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setOverlap(0),
    );
    return () => {
      show.remove();
      hide.remove();
      setOverlap(0);
    };
  }, [ref, active]);
  return overlap;
}

/**
 * Bottom sheet on a scrim. Tap outside or hardware back closes it.
 * The sheet rises from the bottom edge (where it lives) while the scrim fades; leaving is quicker than
 * arriving. The Modal stays mounted for the exit, then unmounts on a timer — never on an animation
 * callback, so a dropped frame can't leave an invisible modal swallowing touches.
 */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const keyboardOverlap = useKeyboardOverlap(rootRef, mounted);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.set(withSpring(1, springs.sheet));
      return;
    }
    progress.set(withTiming(0, { duration: motion.fast, easing: Easing.in(Easing.cubic) }));
    const t = setTimeout(() => setMounted(false), reduceMotion ? 0 : motion.fast);
    return () => clearTimeout(t);
  }, [visible, progress, reduceMotion]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.6),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [TRAVEL, 0]) }],
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      {/* A Modal is its own window, so the screen's keyboard handling doesn't reach in here. */}
      <View
        ref={rootRef}
        collapsable={false}
        className="flex-1 items-center justify-end"
        style={{ paddingBottom: keyboardOverlap }}>
        {/* A sibling of the sheet, not its parent: a button can't contain the sheet's own controls. */}
        <AView className="absolute inset-0 bg-ink/55" style={scrimStyle}>
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="إغلاق"
          />
        </AView>
        <AView
          className="w-full max-w-140 items-center gap-3 rounded-t-3xl bg-card px-6 pt-3"
          style={[elevation(colors, 2), { paddingBottom: Math.max(insets.bottom, space.lg) + space.lg }, sheetStyle]}
          accessibilityViewIsModal>
          <Box className="mb-2 h-1.5 w-10 rounded-full bg-border-strong" />
          {children}
        </AView>
      </View>
    </Modal>
  );
}
