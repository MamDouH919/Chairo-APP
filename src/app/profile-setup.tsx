import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, Screen, Stack, Text, TextField } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/stores/auth';
import { space } from '@/theme';

/** Shown once after the first OTP login (isNewUser or no name yet). */
export default function ProfileSetup() {
  const [name, setName] = useState(useAuth.getState().user?.name ?? '');
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length >= 2;

  const save = useMutation({
    mutationFn: () => api.me.update({ name: name.trim() }),
    onSuccess: (u) => useAuth.getState().setUser(u),
  });

  const submit = () => {
    setTouched(true);
    if (valid) save.mutate();
  };

  return (
    <Screen keyboard footer={<Button label={ar.auth.finish} onPress={submit} loading={save.isPending} />}>
      <Stack gap={space.xxl} style={{ paddingTop: space.huge }}>
        <Stack gap={space.xs}>
          <Text variant="title" accessibilityRole="header">
            {ar.auth.nameTitle}
          </Text>
          <Text tone="textMuted">{ar.auth.nameSubtitle}</Text>
        </Stack>
        <TextField
          label={ar.auth.nameLabel}
          value={name}
          onChangeText={setName}
          placeholder={ar.auth.namePlaceholder}
          textContentType="name"
          autoComplete="name"
          autoFocus
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={submit}
          error={save.error ? errorMessage(save.error) : touched && !valid ? ar.auth.nameInvalid : null}
        />
      </Stack>
    </Screen>
  );
}
