import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import { createTransferRequest } from '@/lib/api';

/**
 * Initier le transfert d'un abonnement (de proche) vers un autre compte.
 * Saisie de l'email du destinataire → POST /api/transfer-requests (avec acceptation côté destinataire).
 */
export default function TransferScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ sub?: string; plan?: string; holder?: string }>();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!params.sub) {
      setError(t('transfer.errGeneric'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('transfer.errEmail'));
      return;
    }
    setLoading(true);
    try {
      await createTransferRequest({ subscription: params.sub, toEmail: email.trim() });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('transfer.errGeneric'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <ThemedView style={styles.flex}>
        <Stack.Screen options={{ title: t('transfer.title') }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{t('transfer.sentTitle')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('transfer.sentBody')}</ThemedText>
          <ThemedText type="defaultSemiBold">{email.trim()}</ThemedText>
          <Button label={t('transfer.backToWallet')} onPress={() => router.replace('/(tabs)/wallet')} size="lg" />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t('transfer.title') }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{t('transfer.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('transfer.intro')}</ThemedText>

          {params.plan ? (
            <ThemedView style={styles.recap}>
              <ThemedText type="defaultSemiBold">{params.plan}</ThemedText>
              {params.holder ? <ThemedText style={styles.recapHolder}>{params.holder}</ThemedText> : null}
            </ThemedView>
          ) : null}

          <ThemedText style={styles.note}>{t('transfer.needsAccount')}</ThemedText>

          <TextField
            label={t('transfer.emailLabel')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            placeholder="proche@email.fr"
            textContentType="emailAddress"
            onSubmitEditing={onSubmit}
            returnKeyType="send"
          />

          {error ? (
            <ThemedText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}

          <Button label={t('transfer.submit')} onPress={onSubmit} loading={loading} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24 },
  subtitle: { opacity: 0.7 },
  recap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  recapHolder: { opacity: 0.7, fontSize: 14 },
  note: { fontSize: 13, opacity: 0.6 },
  error: { color: '#d33' },
});
