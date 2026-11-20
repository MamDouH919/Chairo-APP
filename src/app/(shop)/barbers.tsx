import { router } from 'expo-router';
import { Plus, UserRound } from 'lucide-react-native';
import { useState } from 'react';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Row,
  Screen,
  ScreenHeader,
  Sheet,
  Skeleton,
  Stack,
  Text,
  TextField,
  toast,
} from '@/components/ui';
import { useBarberMutations, useManagedBarbers, useManagedServices } from '@/hooks/manage';
import { ar } from '@/i18n/ar';
import type { ManagedBarber } from '@/lib/api/types';
import { errorMessage } from '@/lib/errors';
import { normalizeEgyptPhone, toE164 } from '@/lib/format';
import { useCurrentMembership } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

/** Owner: the chairs under this shop. Add a barber (name, optional phone), open his hours, remove him. */
export default function Barbers() {
  const m = useCurrentMembership();
  const shopId = m?.shopId ?? '';
  const list = useManagedBarbers(shopId, m?.role === 'OWNER');
  const menu = useManagedServices(shopId);
  const { add, remove } = useBarberMutations(shopId);
  const [sheet, setSheet] = useState<'add' | ManagedBarber | null>(null);

  const items = (list.data ?? []).filter((b) => b.isActive);

  return (
    <Screen
      header={<ScreenHeader title={ar.manage.barbersManageTitle} />}
      refreshing={list.isRefetching}
      onRefresh={() => void list.refetch()}
      footer={
        items.length > 0 ? (
          <Button label={ar.manage.addBarber} icon={Plus} onPress={() => setSheet('add')} />
        ) : undefined
      }>
      <Stack className="gap-3 pt-2">
        <Text tone="textMuted">{ar.manage.barbersManageHint}</Text>
        {list.isPending && [0, 1].map((i) => <Skeleton key={i} height={72} />)}
        {list.isError && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
        {list.isSuccess && items.length === 0 && (
          <Stack className="gap-4">
            <EmptyState icon={UserRound} title={ar.manage.noBarbersTitle} hint={ar.manage.noBarbersHint} />
            <Button label={ar.manage.addBarber} icon={Plus} onPress={() => setSheet('add')} />
          </Stack>
        )}
        {items.map((b) => (
          <Card key={b.id} onPress={() => setSheet(b)} accessibilityLabel={b.displayName}>
            <Row className="gap-3">
              <Box className="flex-1">
                <Text variant="bodyStrong">{b.displayName}</Text>
              </Box>
              <Button
                variant="secondary"
                size="md"
                fullWidth={false}
                label={ar.manage.hoursOf}
                onPress={() =>
                  router.push({ pathname: '/barber-hours', params: { barberId: b.id, name: b.displayName } })
                }
              />
            </Row>
          </Card>
        ))}
      </Stack>

      <Sheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === 'add' && (
          <AddForm
            saving={add.isPending}
            onSave={(input) =>
              add.mutate(input, {
                onSuccess: () => {
                  toast(
                    menu.data && menu.data.length > 0 ? ar.manage.barberAdded : ar.manage.barberAddedNoMenu,
                    'success',
                  );
                  setSheet(null);
                },
                onError: (e) => toast(errorMessage(e), 'error'),
              })
            }
          />
        )}
        {sheet && sheet !== 'add' && (
          <RemoveForm
            barber={sheet}
            removing={remove.isPending}
            onRemove={() =>
              remove.mutate(sheet.id, {
                onSuccess: () => setSheet(null),
                onError: (e) => toast(errorMessage(e), 'error'),
              })
            }
            onCancel={() => setSheet(null)}
          />
        )}
      </Sheet>
    </Screen>
  );
}

function AddForm({
  onSave,
  saving,
}: {
  onSave: (input: { displayName: string; phone: string | null }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const local = phone.trim() ? normalizeEgyptPhone(phone) : null;
  const nameError = name.trim().length < 2 ? ar.staff.tooShort(2) : null;
  const phoneError = phone.trim() && !local ? ar.auth.phoneInvalid : null;

  return (
    <Stack className="gap-4 w-full">
      <Text variant="heading" align="center">
        {ar.manage.newBarber}
      </Text>
      <TextField
        label={ar.manage.barberName}
        placeholder={ar.manage.barberNamePlaceholder}
        value={name}
        onChangeText={setName}
        maxLength={60}
        error={touched ? nameError : null}
      />
      <TextField
        label={ar.manage.barberPhone}
        helper={ar.manage.barberPhoneHint}
        placeholder={ar.auth.phonePlaceholder}
        prefix="+20"
        ltr
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={14}
        error={touched ? phoneError : null}
      />
      <Button
        label={ar.manage.addBarber}
        loading={saving}
        onPress={() => {
          setTouched(true);
          if (!nameError && !phoneError) onSave({ displayName: name.trim(), phone: local ? toE164(local) : null });
        }}
      />
    </Stack>
  );
}

function RemoveForm({
  barber,
  onRemove,
  onCancel,
  removing,
}: {
  barber: ManagedBarber;
  onRemove: () => void;
  onCancel: () => void;
  removing: boolean;
}) {
  return (
    <Stack className="gap-4 w-full">
      <Text variant="heading" align="center">
        {ar.manage.removeBarberTitle}
      </Text>
      <Text tone="textMuted" align="center">
        {ar.manage.removeBarberHint(barber.displayName)}
      </Text>
      <Button variant="danger" label={ar.manage.removeBarber} loading={removing} onPress={onRemove} />
      <Button variant="ghost" label={ar.common.cancel} onPress={onCancel} />
    </Stack>
  );
}
