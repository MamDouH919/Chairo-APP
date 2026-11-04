import { Image } from 'expo-image';
import { Scissors } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, Text } from './ui';

const TINTS = ['#0F766E', '#B45309', '#1E3A8A', '#6D28D9', '#9F1239', '#0E7490', '#4D7C0F'];

/** djb2 — spreads similar names across tints (a plain char-code sum collides often). */
const hash = (s: string) => [...s].reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) >>> 0, 5381);

/** Shop photo, or a branded placeholder (ink + tint + monogram) when the shop has none. */
export function ShopCover({ name, url, height }: { name: string; url: string | null; height: number }) {
  const { colors } = useTheme();
  if (url) {
    return (
      <Image
        source={url}
        style={{ width: '100%', height, backgroundColor: colors.surfaceMuted }}
        contentFit="cover"
        transition={200}
        accessible={false}
      />
    );
  }
  const tint = TINTS[hash(name) % TINTS.length];
  const monogram = name.trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.box, { height, backgroundColor: colors.surfaceInk }]} accessible={false}>
      <View style={[styles.blob, { backgroundColor: tint }]} />
      <View style={[styles.blob2, { backgroundColor: tint }]} />
      <View style={styles.pattern}>
        <Icon
          icon={Scissors}
          size={height * 0.9}
          tone="onInk"
          strokeWidth={0.6}
          style={{ opacity: 0.07, transform: [{ rotate: '-24deg' }] }}
        />
      </View>
      <Text
        variant="display"
        tone="onInk"
        style={{ fontSize: height * 0.32, lineHeight: height * 0.42, opacity: 0.92 }}>
        {monogram}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -120, end: -60, opacity: 0.55 },
  blob2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: -110, start: -40, opacity: 0.3 },
  pattern: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingStart: 24,
  },
});
