import { Plus, Scissors } from 'lucide-react-native';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  Chip,
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
import { useManagedServices, useServiceMutations } from '@/hooks/manage';
import { ar } from '@/i18n/ar';
import type { ManagedService } from '@/lib/api/types';
import { errorMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/format';
import { useCurrentMembership } from '@/stores/mode';
import { Box } from '@/components/gluestack/box';

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const toDigits = (v: string) => v.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g, '');

/** The shop's menu. The owner adds, edits, pauses and removes; a barber just sees it. */
export default function Services() {
  const m = useCurrentMembership();
  const shopId = m?.shopId ?? '';
  const isOwner = m?.role === 'OWNER';
  const list = useManagedServices(shopId);
  const { seedDefaults, ...mutations } = useServiceMutations(shopId);
  const [editing, setEditing] = useState<ManagedService | 'new' | null>(null);

  const items = list.data ?? [];

  return (
    <Screen
      header={<ScreenHeader title={ar.manage.servicesTitle} />}
      refreshing={list.isRefetching}
      onRefresh={() => void list.refetch()}
      footer={
        isOwner && items.length > 0 ? (
          <Button label={ar.manage.addService} icon={Plus} onPress={() => setEditing('new')} />
        ) : undefined
      }>
      <Stack className="gap-3 pt-2">
        {!isOwner && (
          <Text variant="caption" tone="textMuted">
            {ar.manage.ownerOnly}
          </Text>
        )}
        {list.isPending && [0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}
        {list.isError && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
        {list.isSuccess && items.length === 0 && (
          <Stack className="gap-4">
            <EmptyState
              icon={Scissors}
              title={ar.manage.noServicesTitle}
              hint={isOwner ? ar.manage.noServicesHint : undefined}
            />
            {isOwner && (
              <Stack className="gap-2">
                <Button
                  label={ar.manage.useDefaults}
                  loading={seedDefaults.isPending}
                  onPress={() => seedDefaults.mutate(undefined, { onError: (e) => toast(errorMessage(e), 'error') })}
                />
                <Text variant="caption" tone="textSubtle" align="center">
                  {ar.manage.useDefaultsHint}
                </Text>
                <Button
                  variant="secondary"
                  label={ar.manage.addService}
                  icon={Plus}
                  onPress={() => setEditing('new')}
                />
              </Stack>
            )}
          </Stack>
        )}
        {items.map((s) => (
          <Card key={s.id} onPress={isOwner ? () => setEditing(s) : undefined} accessibilityLabel={s.name}>
            <Row className="gap-3">
              <Box className="flex-1 gap-0.5">
                <Text variant="bodyStrong" tone={s.isActive ? 'text' : 'textSubtle'}>
                  {s.name}
                </Text>
                <Text variant="caption" tone="textMuted">
                  {ar.manage.durationMin(s.durationMin)}
                </Text>
              </Box>
              {!s.isActive && <Badge label={ar.manage.pausedBadge} tone="warning" />}
              <Text variant="bodyStrong">{formatPrice(s.priceEgp)}</Text>
            </Row>
          </Card>
        ))}
      </Stack>

      <ServiceSheet
        service={editing}
        onClose={() => setEditing(null)}
        saving={mutations.create.isPending || mutations.update.isPending}
        removing={mutations.remove.isPending}
        onSave={(input, isActive) => {
          const done = () => {
            toast(ar.manage.saved, 'success');
            setEditing(null);
          };
          const onError = (e: unknown) => toast(errorMessage(e), 'error');
          if (editing === 'new') mutations.create.mutate(input, { onSuccess: done, onError });
          else if (editing)
            mutations.update.mutate({ id: editing.id, patch: { ...input, isActive } }, { onSuccess: done, onError });
        }}
        onRemove={() => {
          if (editing && editing !== 'new')
            mutations.remove.mutate(editing.id, {
              onSuccess: () => setEditing(null),
              onError: (e) => toast(errorMessage(e), 'error'),
            });
        }}
      />
    </Screen>
  );
}

function ServiceSheet({
  service,
  onClose,
  onSave,
  onRemove,
  saving,
  removing,
}: {
  service: ManagedService | 'new' | null;
  onClose: () => void;
  onSave: (input: { name: string; durationMin: number; priceEgp: number }, isActive: boolean) => void;
  onRemove: () => void;
  saving: boolean;
  removing: boolean;
}) {
  const existing = service && service !== 'new' ? service : null;
  // Remount on every open, so the fields start from the service being edited.
  return (
    <Sheet visible={service !== null} onClose={onClose}>
      {service !== null && (
        <ServiceForm
          key={existing?.id ?? 'new'}
          existing={existing}
          onSave={onSave}
          onRemove={onRemove}
          saving={saving}
          removing={removing}
        />
      )}
    </Sheet>
  );
}

function ServiceForm({
  existing,
  onSave,
  onRemove,
  saving,
  removing,
}: {
  existing: ManagedService | null;
  onSave: (input: { name: string; durationMin: number; priceEgp: number }, isActive: boolean) => void;
  onRemove: () => void;
  saving: boolean;
  removing: boolean;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing ? String(existing.priceEgp) : '');
  const [duration, setDuration] = useState(existing?.durationMin ?? 30);
  const [active, setActive] = useState(existing?.isActive ?? true);
  const [touched, setTouched] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const priceNum = Number(toDigits(price));
  const nameError = name.trim().length < 2 ? ar.staff.tooShort(2) : null;
  const priceError = toDigits(price) === '' || priceNum > 10_000 ? ar.manage.priceInvalid : null;
  // An old service may have a length that isn't one of the quick choices: keep it selectable.
  const durations = DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b);

  const submit = () => {
    setTouched(true);
    if (!nameError && !priceError) onSave({ name: name.trim(), durationMin: duration, priceEgp: priceNum }, active);
  };

  if (confirmRemove && existing) {
    return (
      <Stack className="gap-4 w-full">
        <Text variant="heading" align="center">
          {ar.manage.removeConfirmTitle}
        </Text>
        <Text tone="textMuted" align="center">
          {ar.manage.removeConfirmHint(existing.name)}
        </Text>
        <Button variant="danger" label={ar.manage.removeService} loading={removing} onPress={onRemove} />
        <Button variant="ghost" label={ar.common.cancel} onPress={() => setConfirmRemove(false)} />
      </Stack>
    );
  }

  return (
    <Stack className="gap-4 w-full">
      <Text variant="heading" align="center">
        {existing ? ar.manage.editService : ar.manage.newService}
      </Text>
      <TextField
        label={ar.manage.serviceName}
        placeholder={ar.manage.serviceNamePlaceholder}
        value={name}
        onChangeText={setName}
        maxLength={80}
        error={touched ? nameError : null}
      />
      <TextField
        label={ar.manage.servicePrice}
        value={price}
        onChangeText={(v) => setPrice(toDigits(v))}
        keyboardType="number-pad"
        ltr
        maxLength={5}
        error={touched ? priceError : null}
      />
      <Stack className="gap-2">
        <Text variant="label" tone="textMuted">
          {ar.manage.serviceDuration}
        </Text>
        <Box className="flex-row flex-wrap gap-2">
          {durations.map((d) => (
            <Chip key={d} label={ar.manage.durationMin(d)} selected={d === duration} onPress={() => setDuration(d)} />
          ))}
        </Box>
      </Stack>
      {existing && (
        <Row className="gap-2">
          <Chip label={ar.manage.serviceActive} selected={active} onPress={() => setActive(true)} />
          <Chip label={ar.manage.servicePaused} selected={!active} onPress={() => setActive(false)} />
        </Row>
      )}
      <Button label={ar.manage.save} loading={saving} onPress={submit} />
      {existing && <Button variant="ghost" label={ar.manage.removeService} onPress={() => setConfirmRemove(true)} />}
    </Stack>
  );
}
