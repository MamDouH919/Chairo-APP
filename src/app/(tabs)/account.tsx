import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  CircleHelp,
  Languages,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  PencilLine,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MockBadge } from '@/components/brand';
import { Avatar, Button, Card, ListRow, Screen, Sheet, Stack, Text, TextField, toast } from '@/components/ui';
import { useAppConfig } from '@/hooks/queries';
import { ar } from '@/i18n/ar';
import { api, type AppConfig } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatPhone, whatsappUrl } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { space } from '@/theme';

export default function Account() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const support = useAppConfig().data?.support;
  const hasSupport = !!(support?.phone || support?.whatsapp || support?.email);

  return (
    <Screen edgeBottom={false} header={<View style={{ height: insets.top }} />}>
      <Stack gap={space.xxl} style={{ paddingTop: space.lg }}>
        <Text variant="title" accessibilityRole="header">
          {ar.account.title}
        </Text>

        <Card tone="ink" style={{ padding: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <Avatar name={user?.name ?? '?'} size={64} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading" tone="onInk">
                {user?.name}
              </Text>
              <Text variant="label" tone="onInkMuted" style={{ writingDirection: 'ltr', alignSelf: 'flex-start' }}>
                {user ? formatPhone(user.phone) : ''}
              </Text>
            </View>
            <MockBadge />
          </View>
        </Card>

        <Card padded={false} style={{ overflow: 'hidden' }}>
          <ListRow icon={PencilLine} title={ar.account.editName} onPress={() => setEditing(true)} />
          <ListRow icon={ShieldAlert} title={ar.account.record} onPress={() => router.push('/account/strikes')} />
          <ListRow icon={Smartphone} title={ar.account.sessions} onPress={() => router.push('/account/sessions')} />
          <ListRow icon={ShieldCheck} title={ar.account.policy} onPress={() => router.push('/policy')} />
          <ListRow icon={Moon} title={ar.account.appearance} subtitle={ar.account.appearanceHint} />
          <ListRow icon={Languages} title={ar.account.language} value={ar.account.languageValue} />
          <ListRow
            icon={CircleHelp}
            title={ar.account.help}
            value={hasSupport ? undefined : ar.account.comingSoon}
            onPress={hasSupport ? () => setHelpOpen(true) : undefined}
            last
          />
        </Card>

        <Card padded={false} style={{ overflow: 'hidden' }}>
          <ListRow icon={LogOut} title={ar.account.logout} danger onPress={() => setConfirmLogout(true)} last />
        </Card>

        <Text variant="caption" tone="textSubtle" align="center">
          {ar.account.version(Constants.expoConfig?.version ?? '1.0.0')}
        </Text>
      </Stack>

      <EditNameSheet visible={editing} onClose={() => setEditing(false)} />
      {support && <HelpSheet visible={helpOpen} support={support} onClose={() => setHelpOpen(false)} />}
      <ConfirmSheet
        visible={confirmLogout}
        title={ar.account.logoutConfirm}
        confirmLabel={ar.account.logout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void useAuth.getState().signOut();
        }}
      />
    </Screen>
  );
}

function HelpSheet({
  visible,
  support,
  onClose,
}: {
  visible: boolean;
  support: AppConfig['support'];
  onClose: () => void;
}) {
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => toast(errorMessage(null), 'error'));
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Stack gap={space.lg} style={{ alignSelf: 'stretch' }}>
        <Text variant="heading" accessibilityRole="header">
          {ar.account.help}
        </Text>
        <Text tone="textMuted">{ar.account.helpHint}</Text>
        <Stack gap={space.sm}>
          {support.whatsapp ? (
            <Button
              label={ar.account.helpWhatsapp}
              icon={MessageCircle}
              onPress={() => open(whatsappUrl(support.whatsapp))}
            />
          ) : null}
          {support.phone ? (
            <Button
              label={ar.account.helpCall}
              icon={Phone}
              variant="secondary"
              onPress={() => open(`tel:${support.phone}`)}
            />
          ) : null}
          {support.email ? (
            <Button
              label={ar.account.helpEmail}
              icon={Mail}
              variant="outline"
              onPress={() => open(`mailto:${support.email}`)}
            />
          ) : null}
        </Stack>
        {support.hours ? (
          <Text variant="caption" tone="textSubtle" align="center">
            {ar.account.helpHours(support.hours)}
          </Text>
        ) : null}
      </Stack>
    </Sheet>
  );
}

function EditNameSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const current = useAuth((s) => s.user?.name ?? '');
  const [name, setName] = useState(current);
  const save = useMutation({
    mutationFn: () => api.me.update({ name: name.trim() }),
    onSuccess: async (u) => {
      await useAuth.getState().setUser(u);
      toast(ar.account.saved);
      onClose();
    },
  });
  const valid = name.trim().length >= 2;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Stack gap={space.lg} style={{ alignSelf: 'stretch' }}>
        <Text variant="heading" accessibilityRole="header">
          {ar.account.editName}
        </Text>
        <TextField
          label={ar.auth.nameLabel}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={60}
          error={save.error ? errorMessage(save.error) : !valid && name ? ar.auth.nameInvalid : null}
        />
        <Button
          label={ar.account.save}
          disabled={!valid || name.trim() === current}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </Stack>
    </Sheet>
  );
}

function ConfirmSheet({
  visible,
  title,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Stack gap={space.lg} style={{ alignSelf: 'stretch' }}>
        <Text variant="heading" align="center">
          {title}
        </Text>
        <Stack gap={space.sm}>
          <Button label={confirmLabel} variant="danger" onPress={onConfirm} />
          <Button label={ar.common.cancel} variant="ghost" onPress={onClose} />
        </Stack>
      </Stack>
    </Sheet>
  );
}
