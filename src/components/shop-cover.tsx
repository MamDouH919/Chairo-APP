import { Image as ExpoImage } from 'expo-image';
import { Scissors } from 'lucide-react-native';
import { withUniwind } from 'uniwind';

import { Box } from '@/components/gluestack/box';

import { Icon, Text } from './ui';

const Image = withUniwind(ExpoImage);

const TINTS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'];

/** djb2 — spreads similar names across tints (a plain char-code sum collides often). */
const hash = (s: string) => [...s].reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) >>> 0, 5381);

/** Shop photo, or a branded placeholder (ink + tint + monogram) when the shop has none. */
export function ShopCover({ name, url, height }: { name: string; url: string | null; height: number }) {
  if (url) {
    return (
      <Image
        source={url}
        className="w-full bg-muted"
        style={{ height }}
        contentFit="cover"
        transition={200}
        accessible={false}
      />
    );
  }
  const tint = TINTS[hash(name) % TINTS.length];
  const monogram = name.trim().charAt(0).toUpperCase();
  return (
    <Box className="w-full items-center justify-center overflow-hidden bg-ink" style={{ height }} accessible={false}>
      <Box className={`${tint} absolute -top-30 -end-15 h-65 w-65 rounded-full opacity-55`} />
      <Box className={`${tint} absolute -bottom-27.5 -start-10 h-45 w-45 rounded-full opacity-30`} />
      <Box className="absolute inset-0 items-start justify-center ps-6">
        <Icon icon={Scissors} size={height * 0.9} tone="onInk" strokeWidth={0.6} className="-rotate-24 opacity-7" />
      </Box>
      {/* the monogram scales with the cover height */}
      <Text
        variant="display"
        tone="onInk"
        className="opacity-90"
        style={{ fontSize: height * 0.32, lineHeight: height * 0.42 }}>
        {monogram}
      </Text>
    </Box>
  );
}
