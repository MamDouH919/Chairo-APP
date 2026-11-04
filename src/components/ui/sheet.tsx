import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, radius, space, useTheme } from '@/theme';

/** Bottom sheet on a measured scrim. Tap outside or hardware back closes it. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* A Modal is its own window, so the screen's keyboard handling doesn't reach in here. */}
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        {/* A sibling of the sheet, not its parent: a button can't contain the sheet's own controls. */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        />
        <View
          style={[
            styles.sheet,
            elevation(colors, 2),
            { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, space.lg) + space.lg },
          ]}
          accessibilityViewIsModal>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: space.xxl,
    alignItems: 'center',
    gap: space.md,
  },
});
