import { useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Crosshair, MapPin, MapPinCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Linking } from 'react-native';

import { Pressable } from '@/components/gluestack/pressable';
import { Button, Card, Icon, Row, Screen, ScreenHeader, Stack, Text, TextField } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { ltr, normalizeEgyptPhone, toE164 } from '@/lib/format';
import { useMode } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

type Pin = { latitude: number; longitude: number };
/** Same bounds as the API's createShopSchema, so an obviously wrong pin never reaches it. */
const inEgypt = (p: Pin) => p.latitude >= 22 && p.latitude <= 32 && p.longitude >= 24 && p.longitude <= 37;

/** Short self-service registration → POST /shops → PENDING until our admin approves. */
export default function RegisterShop() {
  const [form, setForm] = useState({ name: '', city: '', area: '', address: '', phone: '' });
  const [touched, setTouched] = useState(false);
  const [pin, setPin] = useState<Pin | null>(null);
  const [locating, setLocating] = useState(false);
  const [pinError, setPinError] = useState<{ text: string; settings?: boolean } | null>(null);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const phone = form.phone.trim() ? normalizeEgyptPhone(form.phone) : null;
  const errors = {
    name: form.name.trim().length < 2 ? ar.staff.tooShort(2) : null,
    city: form.city.trim().length < 2 ? ar.staff.tooShort(2) : null,
    area: form.area.trim().length < 2 ? ar.staff.tooShort(2) : null,
    address: form.address.trim().length < 3 ? ar.staff.tooShort(3) : null,
    phone: form.phone.trim() && !phone ? ar.auth.phoneInvalid : null,
    pin: pin ? null : ar.staff.pinRequired,
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : null);

  const locate = async () => {
    setLocating(true);
    setPinError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setPinError({ text: ar.staff.pinDenied, settings: !perm.canAskAgain });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const p = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (!inEgypt(p)) setPinError({ text: ar.staff.pinOutside });
      else setPin(p);
    } catch {
      setPinError({ text: ar.staff.pinFailed });
    } finally {
      setLocating(false);
    }
  };

  const submit = useMutation({
    mutationFn: () =>
      api.staff.registerShop({
        name: form.name.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        latitude: pin!.latitude,
        longitude: pin!.longitude,
        phone: phone ? toE164(phone) : null,
      }),
    onSuccess: async () => {
      await useMode.getState().resolve({ intent: 'barber' });
      router.replace('/');
    },
  });

  const onSubmit = () => {
    setTouched(true);
    if (valid) submit.mutate();
  };

  return (
    <Screen
      keyboard
      header={<ScreenHeader title={ar.staff.registerTitle} />}
      footer={
        <Stack className="gap-2">
          {submit.error && (
            <Text variant="caption" tone="danger" align="center" accessibilityRole="alert">
              {errorMessage(submit.error)}
            </Text>
          )}
          <Button label={ar.staff.submitShop} onPress={onSubmit} loading={submit.isPending} />
        </Stack>
      }>
      <Stack className="gap-5 pt-2">
        <Text tone="textMuted">{ar.staff.registerHint}</Text>
        <TextField
          label={ar.staff.shopName}
          placeholder={ar.staff.shopNamePlaceholder}
          value={form.name}
          onChangeText={set('name')}
          maxLength={80}
          error={show('name')}
        />
        <TextField
          label={ar.staff.city}
          placeholder={ar.staff.cityPlaceholder}
          value={form.city}
          onChangeText={set('city')}
          maxLength={60}
          error={show('city')}
        />
        <TextField
          label={ar.staff.area}
          placeholder={ar.staff.areaPlaceholder}
          value={form.area}
          onChangeText={set('area')}
          maxLength={80}
          error={show('area')}
        />
        <TextField
          label={ar.staff.address}
          placeholder={ar.staff.addressPlaceholder}
          value={form.address}
          onChangeText={set('address')}
          maxLength={300}
          error={show('address')}
        />
        <PinCard
          pin={pin}
          locating={locating}
          error={pinError?.text ?? show('pin')}
          showSettings={!!pinError?.settings}
          onLocate={locate}
        />
        <TextField
          label={ar.staff.shopPhone}
          placeholder={ar.auth.phonePlaceholder}
          prefix="+20"
          ltr
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={set('phone')}
          maxLength={14}
          error={show('phone')}
        />
      </Stack>
    </Screen>
  );
}

function PinCard({
  pin,
  locating,
  error,
  showSettings,
  onLocate,
}: {
  pin: Pin | null;
  locating: boolean;
  error: string | null;
  showSettings: boolean;
  onLocate: () => void;
}) {
  return (
    <Stack className="gap-1.5">
      <Text variant="label" tone="textMuted">
        {ar.staff.pin}
      </Text>
      <Card className={`gap-3 ${error ? 'border-destructive' : ''}`}>
        {pin ? (
          <Row className="gap-3">
            <Box className="h-11 w-11 items-center justify-center rounded-md bg-success-soft">
              <Icon icon={MapPinCheck} tone="success" size="lg" />
            </Box>
            <Box className="flex-1">
              <Text variant="bodyStrong">{ar.staff.pinSaved}</Text>
              <Text variant="caption" tone="textSubtle">
                {ltr(`${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`)}
              </Text>
            </Box>
            <Pressable
              accessibilityRole="link"
              hitSlop={10}
              onPress={() => void Linking.openURL(`https://maps.google.com/?q=${pin.latitude},${pin.longitude}`)}>
              <Text variant="label" tone="primary">
                {ar.staff.pinView}
              </Text>
            </Pressable>
          </Row>
        ) : (
          <Row className="gap-3">
            <Icon icon={MapPin} tone="textMuted" size="lg" />
            <Text variant="caption" tone="textMuted" className="flex-1">
              {ar.staff.pinHint}
            </Text>
          </Row>
        )}
        <Button
          label={pin ? ar.staff.pinRetake : ar.staff.pinCta}
          icon={Crosshair}
          variant={pin ? 'ghost' : 'secondary'}
          size="md"
          loading={locating}
          onPress={onLocate}
        />
        {showSettings && (
          <Button
            label={ar.staff.openSettings}
            variant="outline"
            size="md"
            onPress={() => void Linking.openSettings()}
          />
        )}
      </Card>
      {error && (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </Stack>
  );
}
