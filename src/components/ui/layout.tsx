import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, space, useTheme } from '@/theme';

import { IconButton } from './button';
import { ChevronBack } from './icon';
import { Text } from './text';

export const MAX_WIDTH = 640;

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** sticky bottom content (CTA); scroll content gets matching bottom inset */
  footer?: ReactNode;
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  /** tabs render their own bottom bar; don't add the home-indicator inset twice */
  edgeBottom?: boolean;
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

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
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = edgeBottom ? insets.bottom : 0;
  const inner = [styles.inner, padded && styles.padded, contentStyle];

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ paddingBottom: (footer ? space.lg : space.xxxl) + (footer ? 0 : bottomInset) }]}
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
      <View style={inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, ...inner]}>{children}</View>
  );

  const content = (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header ?? <View style={{ height: insets.top }} />}
      {body}
      {footer && (
        <View
          style={[
            styles.footer,
            elevation(colors, 2),
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(bottomInset, space.lg),
            },
          ]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      )}
    </View>
  );

  return keyboard ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
}

/** Top bar with back button + title. Back points the right way in RTL. */
export function ScreenHeader({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.xs }]}>
      <IconButton
        icon={ChevronBack}
        label="رجوع"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <Text variant="heading" numberOfLines={1} style={{ flex: 1 }} accessibilityRole="header">
        {title ?? ''}
      </Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Row({ children, gap = space.sm, style, ...rest }: ViewProps & { gap?: number }) {
  return (
    <View
      accessible={!!rest.accessibilityLabel || undefined}
      {...rest}
      style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

export function Stack({
  children,
  gap = space.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  padded: { paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    width: '100%',
    maxWidth: MAX_WIDTH + space.xl * 2,
    alignSelf: 'center',
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, paddingHorizontal: space.xl },
  footerInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
});
