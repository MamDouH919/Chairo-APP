import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraOff, CircleAlert } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Skeleton, Stack, Text, toast } from '@/components/ui';
import { env } from '@/config/env';
import { useCheckIn } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { parseCheckinToken } from '@/lib/booking-actions';
import { errorMessage } from '@/lib/errors';
import { radius, space } from '@/theme';

export default function CheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [problem, setProblem] = useState<string | null>(null);
  // The camera reports the same code many times a second, before any state update lands.
  const scanning = useRef(true);
  const checkIn = useCheckIn(id);

  const submit = (token: string) =>
    checkIn.mutate(token, {
      onSuccess: () => {
        toast(ar.checkIn.done);
        router.back();
      },
      onError: (e) => setProblem(errorMessage(e)),
    });

  const onScanned = ({ data }: { data: string }) => {
    if (!scanning.current) return;
    scanning.current = false;
    const token = parseCheckinToken(data);
    if (token) submit(token);
    else setProblem(ar.checkIn.notACode);
  };

  const scanAgain = () => {
    setProblem(null);
    scanning.current = true;
  };

  const header = <ScreenHeader title={ar.checkIn.title} />;
  // Simulators have no camera, and the mock accepts any token.
  const simulate = env.useMocks && (
    <Button label={ar.checkIn.simulate} variant="ghost" onPress={() => submit('mock-checkin-token')} />
  );

  if (!permission) {
    return (
      <Screen header={header}>
        <Skeleton height={320} radius={radius.xl} />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen header={header}>
        <EmptyState
          icon={CameraOff}
          title={ar.checkIn.permissionTitle}
          hint={ar.checkIn.permissionHint}
          action={
            permission.canAskAgain
              ? { label: ar.checkIn.permissionAllow, onPress: () => void requestPermission() }
              : Platform.OS !== 'web'
                ? { label: ar.checkIn.openSettings, onPress: () => void Linking.openSettings() }
                : undefined
          }
        />
        {problem && <Text tone="danger">{problem}</Text>}
        {simulate}
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <Stack gap={space.lg}>
        <Text tone="textMuted" align="center">
          {ar.checkIn.hint}
        </Text>
        <View style={styles.camera}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
        </View>
        {checkIn.isPending && <Text align="center">{ar.common.loading}</Text>}
        {problem && (
          <Card tone="muted">
            <Stack>
              <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
                <Icon icon={CircleAlert} tone="danger" />
                <Text style={{ flex: 1 }}>{problem}</Text>
              </Row>
              <Button label={ar.common.retry} variant="secondary" size="md" onPress={scanAgain} />
            </Stack>
          </Card>
        )}
        {simulate}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: { aspectRatio: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#000' },
});
