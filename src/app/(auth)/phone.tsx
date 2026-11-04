import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Screen, ScreenHeader, Stack, Text, TextField } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { normalizeEgyptPhone, toE164 } from '@/lib/format';
import { space } from '@/theme';

export default function PhoneScreen() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const local = normalizeEgyptPhone(value);

  const send = useMutation({
    mutationFn: (phone: string) => api.auth.requestOtp(phone),
    onSuccess: (r, phone) =>
      router.push({
        pathname: '/verify',
        params: { phone, resendIn: String(r.resendInSeconds), devCode: r.devCode ?? '' },
      }),
  });

  const submit = () => {
    setTouched(true);
    if (local) send.mutate(toE164(local));
  };

  const fieldError = send.error ? errorMessage(send.error) : touched && !local ? ar.auth.phoneInvalid : null;

  return (
    <Screen
      keyboard
      header={<ScreenHeader />}
      footer={<Button label={ar.auth.sendCode} onPress={submit} loading={send.isPending} disabled={!value} />}>
      <Stack gap={space.xxl} style={{ paddingTop: space.lg }}>
        <Stack gap={space.xs}>
          <Text variant="title" accessibilityRole="header">
            {ar.auth.phoneTitle}
          </Text>
          <Text tone="textMuted">{ar.auth.phoneSubtitle}</Text>
        </Stack>
        <TextField
          label={ar.auth.phoneLabel}
          prefix="+20"
          ltr
          value={value}
          onChangeText={(t) => {
            setValue(t);
            if (send.error) send.reset();
          }}
          onBlur={() => value && setTouched(true)}
          onSubmitEditing={submit}
          placeholder={ar.auth.phonePlaceholder}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          maxLength={14}
          returnKeyType="done"
          error={fieldError}
        />
      </Stack>
    </Screen>
  );
}
