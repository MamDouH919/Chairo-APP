import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, OtpInput, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatPhone } from '@/lib/format';
import { getDeviceId, useAuth } from '@/stores/auth';
import { space } from '@/theme';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; resendIn?: string; devCode?: string }>();
  const phone = params.phone ?? '';
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(params.devCode || '');
  const [cooldown, setCooldown] = useState(Number(params.resendIn) || 60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: async (c: string) => api.auth.verifyOtp({ phone, code: c, deviceId: await getDeviceId() }),
    // the root layout's Stack.Protected swaps the route tree once status changes
    onSuccess: (r) => useAuth.getState().signIn(r),
    onError: () => setCode(''),
  });

  const resend = useMutation({
    mutationFn: () => api.auth.requestOtp(phone),
    onSuccess: (r) => {
      setCooldown(r.resendInSeconds);
      setDevCode(r.devCode ?? '');
      verify.reset();
    },
  });

  const onChange = (v: string) => {
    setCode(v);
    if (verify.error) verify.reset();
    if (v.length === 6) verify.mutate(v);
  };

  const error = verify.error ?? resend.error;

  return (
    <Screen
      keyboard
      header={<ScreenHeader />}
      footer={
        <Button
          label={ar.auth.verify}
          onPress={() => verify.mutate(code)}
          loading={verify.isPending}
          disabled={code.length !== 6}
        />
      }>
      <Stack gap={space.xxl} style={{ paddingTop: space.lg }}>
        <Stack gap={space.xs}>
          <Text variant="title" accessibilityRole="header">
            {ar.auth.otpTitle}
          </Text>
          <Text tone="textMuted">{ar.auth.otpSubtitle(formatPhone(phone))}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={10}
            style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
            <Text variant="label" tone="primary">
              {ar.auth.changeNumber}
            </Text>
          </Pressable>
        </Stack>

        <Stack gap={space.md}>
          <OtpInput label={ar.auth.otpLabel} value={code} onChange={onChange} error={!!verify.error} autoFocus />
          {error && (
            <Text
              variant="caption"
              tone="danger"
              align="center"
              accessibilityRole="alert"
              accessibilityLiveRegion="polite">
              {errorMessage(error)}
            </Text>
          )}
          {devCode ? (
            <View style={{ alignItems: 'center' }}>
              <Badge label={ar.auth.devCode(devCode)} tone="info" />
            </View>
          ) : null}
        </Stack>

        <View style={{ alignItems: 'center' }}>
          {cooldown > 0 ? (
            <Text variant="label" tone="textSubtle">
              {ar.auth.resendIn(cooldown)}
            </Text>
          ) : (
            <Button
              label={ar.auth.resend}
              variant="ghost"
              size="md"
              fullWidth={false}
              onPress={() => resend.mutate()}
              loading={resend.isPending}
            />
          )}
        </View>
      </Stack>
    </Screen>
  );
}
