import { useState } from 'react';

import { ar } from '@/i18n/ar';
import { errorMessage } from '@/lib/errors';
import { space } from '@/theme';

import { Button, Sheet, Stack, Text, TextField } from './ui';

/** The API wants at least 3 characters on disputes and appeals. */
const MIN_NOTE = 3;

/** Asks for a short note, then submits it. Mount it only while open, so the text resets. */
export function NoteSheet({
  title,
  hint,
  label,
  optional,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  hint: string;
  label: string;
  optional?: boolean;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  const trimmed = note.trim();
  const tooShort = !optional && trimmed.length < MIN_NOTE;

  return (
    <Sheet visible onClose={onClose}>
      <Stack gap={space.lg} style={{ alignSelf: 'stretch' }}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        <Text tone="textMuted">{hint}</Text>
        <TextField
          label={label}
          value={note}
          onChangeText={setNote}
          autoFocus
          multiline
          maxLength={500}
          error={error ? errorMessage(error) : tooShort && trimmed ? ar.record.appealTooShort : null}
        />
        <Button label={ar.common.send} disabled={tooShort} loading={loading} onPress={() => onSubmit(trimmed)} />
      </Stack>
    </Sheet>
  );
}
