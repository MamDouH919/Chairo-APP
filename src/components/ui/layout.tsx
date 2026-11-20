import { router } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';
import { HStack } from '@/components/gluestack/hstack';
import { VStack } from '@/components/gluestack/vstack';

import { space, useTheme } from '@/theme';

import { IconButton } from './button';
import { Backdrop } from './glass';
import { ChevronBack } from './icon';
import { ScrollProvider } from './motion';
import { Text } from './text';

export const MAX_WIDTH = 640;

const AView = withUniwind(Animated.View);

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** sticky bottom content (CTA) on a floating glass bar; scroll content gets matching bottom inset */
  footer?: ReactNode;
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  /** tabs render their own bottom bar; don't add the home-indicator inset twice */
  edgeBottom?: boolean;
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** compact title bar that fades in at the top once the page's own large title has scrolled away */
  scrollTitle?: string;
  /** scroll offset (dp) at which `scrollTitle` starts to appear */
  scrollTitleAt?: number;
  /** hairline under the header that appears once content scrolls beneath it */
  headerDivider?: boolean;
  /** pinned above everything and outside the scroll view (e.g. a floating back button) */
  overlay?: ReactNode;
}

const TITLE_BAR_H = 52;

/** Safe-area aware page. Content is width-capped and centred on tablets/web. */
export function Screen({
  children,
  scroll = true,
  footer,
  header,
  refreshing,
  onRefresh,
  padded = true,
  edgeBottom = true,
  keyboard,
  contentStyle,
  scrollTitle,
  scrollTitleAt = 36,
  headerDivider = true,
  overlay,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Inside the tabs layout the glass tab bar floats over content; leave room so the last row stays reachable.
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const [footerH, setFooterH] = useState(0);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const bottomInset = edgeBottom ? insets.bottom : 0;
  const innerClass = `w-full max-w-160 self-center ${padded ? 'px-5' : ''}`;
  const bottomRoom = footer ? footerH + space.lg : space.xxxl + Math.max(bottomInset, tabBar);

  const body = scroll ? (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      // iOS: drag the keyboard away with the finger; Android has no interactive dismissal
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={{ paddingBottom: bottomRoom }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }>
      <Box className={innerClass} style={contentStyle}>
        {children}
      </Box>
    </Animated.ScrollView>
  ) : (
    <Box className={`flex-1 ${innerClass}`} style={[{ paddingBottom: footer ? footerH : 0 }, contentStyle]}>
      {children}
    </Box>
  );

  const content = (
    <Box className="flex-1">
      <Backdrop />
      {header ?? <View style={{ height: insets.top }} />}
      <View style={{ flex: 1 }}>
        {body}
        {scroll && headerDivider && !scrollTitle && <HeaderDivider scrollY={scrollY} />}
      </View>
      {scroll && scrollTitle ? (
        <ScrollTitleBar title={scrollTitle} at={scrollTitleAt} scrollY={scrollY} top={insets.top} />
      ) : null}
      {overlay}
      {footer && (
        <Box
          pointerEvents="box-none"
          onLayout={(e) => setFooterH(Math.round(e.nativeEvent.layout.height))}
          className="absolute inset-x-0 bottom-0 bg-background px-5 pt-3"
          style={{ paddingBottom: Math.max(bottomInset, space.lg) }}>
          <Box className="w-full max-w-160 gap-2 self-center">{footer}</Box>
        </Box>
      )}
    </Box>
  );

  return (
    <ScrollProvider value={scrollY}>
      {keyboard ? (
        // Android is edge-to-edge (the window no longer resizes), so it needs `padding` too
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </ScrollProvider>
  );
}

/** Separates a fixed header from the content sliding under it; invisible while the page is at the top. */
function HeaderDivider({ scrollY }: { scrollY: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 16], [0, 1], Extrapolation.CLAMP),
  }));
  return <AView pointerEvents="none" className="absolute inset-x-0 top-0 h-px bg-border" style={style} />;
}

/** iOS-style collapsed title: fades and settles into place as the large in-page title scrolls away. */
function ScrollTitleBar({
  title,
  at,
  scrollY,
  top,
}: {
  title: string;
  at: number;
  scrollY: SharedValue<number>;
  top: number;
}) {
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [at, at + 28], [0, 1], Extrapolation.CLAMP),
  }));
  const label = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [at, at + 40], [8, 0], Extrapolation.CLAMP) }],
  }));
  return (
    <AView
      pointerEvents="none"
      // the in-page title is the accessible heading; this bar only repeats it visually
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // px-18 keeps the title clear of a floating back button / trailing actions
      className="absolute inset-x-0 top-0 justify-center border-b border-border bg-background px-18"
      style={[{ height: top + TITLE_BAR_H, paddingTop: top }, bar]}>
      <Animated.View style={label}>
        <Text variant="bodyStrong" align="center" numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>
    </AView>
  );
}

/** Top bar with back button + title. Back points the right way in RTL. */
export function ScreenHeader({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Box
      className="w-full max-w-170 flex-row items-center gap-3 self-center px-4 pb-2"
      style={{ paddingTop: insets.top + space.xs }}>
      <IconButton
        icon={ChevronBack}
        label="رجوع"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <Text variant="heading" numberOfLines={1} className="flex-1" accessibilityRole="header">
        {title ?? ''}
      </Text>
      <Box className="min-w-11 items-end">{right}</Box>
    </Box>
  );
}

/**
 * Horizontal group. Prefer `className="gap-3 ..."`; the numeric `gap` stays for callers that compute it.
 */
export function Row({
  children,
  gap,
  className = '',
  style,
  ...rest
}: ViewProps & { gap?: number; className?: string }) {
  return (
    <HStack
      accessible={!!rest.accessibilityLabel || undefined}
      {...rest}
      className={`items-center ${gap === undefined ? 'gap-2' : ''} ${className}`}
      style={[gap === undefined ? null : { gap }, style]}>
      {children}
    </HStack>
  );
}

export function Stack({
  children,
  gap,
  className = '',
  style,
}: {
  children: ReactNode;
  gap?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <VStack
      className={`${gap === undefined ? 'gap-3' : ''} ${className}`}
      style={[gap === undefined ? null : { gap }, style]}>
      {children}
    </VStack>
  );
}
