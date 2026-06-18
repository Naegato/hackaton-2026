import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import { getSubscriptionHolder, updateSubscriptionHolder } from '@/lib/api';

/**
 * Mise à jour des informations du titulaire d'un abonnement.
 * Proposé après l'acceptation d'un transfert quand le nom du titulaire diffère du compte :
 * l'utilisateur peut corriger des informations erronées (ou les conserver telles quelles).
 */
export default function SubscriptionHolderScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const { sub } = useLocalSearchParams<{ sub?: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planName, setPlanName] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadHolder = useCallback(async () => {
    if (!sub) return;
    try {
      const h = await getSubscriptionHolder(sub);
      setFirst(h.holderFirstName);
      setLast(h.holderLastName);
      setPlanName(h.planName);
    } finally {
      setLoading(false);
    }
  }, [sub]);

  useEffect(() => {
    void loadHolder();
  }, [loadHolder]);

  async function onSave() {
    setError(null);
    if (first.trim().length < 2 || last.trim().length < 2) {
      setError(t('relative.errName'));
      return;
    }
    if (!sub) return;
    setSaving(true);
    try {
      await updateSubscriptionHolder(sub, { holderFirstName: first.trim(), holderLastName: last.trim() });
      router.replace('/(tabs)/wallet');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transfer.errGeneric'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: t('holder.title') }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t('holder.title') }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{t('holder.title')}</ThemedText>
          {planName ? <ThemedText style={styles.plan}>{planName}</ThemedText> : null}
          <ThemedText style={styles.intro}>{t('holder.intro')}</ThemedText>

          <TextField
            label={t('common.firstName')}
            value={first}
            onChangeText={setFirst}
            autoCapitalize="words"
            placeholder={t('relative.q.firstNamePlaceholder')}
          />
          <TextField
            label={t('common.lastName')}
            value={last}
            onChangeText={setLast}
            autoCapitalize="words"
            placeholder={t('relative.q.lastNamePlaceholder')}
          />

          {error ? (
            <ThemedText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}

          <Button label={t('holder.save')} onPress={onSave} loading={saving} size="lg" />
          <Button
            label={t('holder.keep')}
            onPress={() => router.replace('/(tabs)/wallet')}
            variant="outline"
            size="lg"
            disabled={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24 },
  plan: { fontSize: 16, opacity: 0.9 },
  intro: { opacity: 0.7 },
  error: { color: '#d33' },
});
