import { Clock } from 'lucide-react-native';
import { useState } from 'react';

import { Box } from '@/components/gluestack/box';
import { Pressable } from '@/components/gluestack/pressable';
import { Button, Chip, Icon, Sheet, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { MINUTE_CHOICES, formatTime12 } from '@/lib/schedule';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'م' : 'ص'}`;

/**
 * A time as a big tappable box. Tapping opens a sheet: pick the hour, then the minutes (00/15/30/45).
 * No keyboard, so a barber never types a time. Value is "HH:mm".
 */
export function TimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [h, m] = value.split(':');
  const [hour, setHour] = useState(Number(h));
  const [minute, setMinute] = useState(m);

  const show = () => {
    setHour(Number(h));
    setMinute(m);
    setOpen(true);
  };
  const confirm = () => {
    onChange(`${String(hour).padStart(2, '0')}:${minute}`);
    setOpen(false);
  };

  return (
    <Box className="flex-1 gap-1">
      <Text variant="label" tone="textMuted">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatTime12(value)}`}
        accessibilityHint={ar.manage.pickTime}
        onPress={show}
        className={`min-h-13 flex-row items-center gap-2 rounded-lg border bg-card px-4 data-[active=true]:bg-glass-pressed ${
          error ? 'border-destructive' : 'border-border'
        }`}>
        <Icon icon={Clock} size="md" tone="textMuted" />
        <Text variant="bodyStrong">{formatTime12(value)}</Text>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Box className="w-full gap-4">
          <Text variant="heading" align="center">
            {label}
          </Text>
          <Box className="gap-2">
            <Text variant="label" tone="textMuted">
              {ar.manage.hour}
            </Text>
            <Box className="flex-row flex-wrap gap-2">
              {HOURS.map((x) => (
                <Chip key={x} label={hourLabel(x)} selected={x === hour} onPress={() => setHour(x)} />
              ))}
            </Box>
          </Box>
          <Box className="gap-2">
            <Text variant="label" tone="textMuted">
              {ar.manage.minute}
            </Text>
            <Box className="flex-row flex-wrap gap-2">
              {MINUTE_CHOICES.map((x) => (
                <Chip key={x} label={x} selected={x === minute} onPress={() => setMinute(x)} />
              ))}
            </Box>
          </Box>
          <Button
            label={`${ar.common.done} · ${formatTime12(`${String(hour).padStart(2, '0')}:${minute}`)}`}
            onPress={confirm}
          />
        </Box>
      </Sheet>
    </Box>
  );
}
