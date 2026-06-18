import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/text-field';
import { useLocale } from '@/context/locale-context';
import { verifyEmail } from '@/lib/api';

type Status = 'idle' | 'verifying' | 'success' | 'error';

/**
 * Confirmation d'adresse email : le lien reçu par email pointe ici avec ?token=...
 * On appelle l'endpoint de vérification Payload, puis on invite à se connecter.
 * Le token est saisissable manuellement en secours (natif sans deep-link).
 */
export default function VerifyEmailScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(value: string) {
    const tk = value.trim();
    if (!tk) {
      setError(t('verify.errMissing'));
      setStatus('error');
      return;
    }
    setError(null);
    setStatus('verifying');
    try {
      await verifyEmail(tk);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verify.errGeneric'));
      setStatus('error');
    }
  }

  // Vérification automatique si le token est fourni par le lien
  useEffect(() => {
    if (params.token) void submit(params.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">{t('verify.title')}</ThemedText>

        {status === 'verifying' ? (
          <>
            <ActivityIndicator style={{ marginTop: 16 }} />
            <ThemedText style={styles.subtitle}>{t('verify.verifying')}</ThemedText>
          </>
        ) : status === 'success' ? (
          <>
            <ThemedText style={styles.subtitle}>{t('verify.successBody')}</ThemedText>
            <Button
              label={t('verify.goToLogin')}
              onPress={() => router.replace('/login')}
              variant="primary"
              size="lg"
            />
          </>
        ) : (
          <>
            <ThemedText style={styles.subtitle}>{t('verify.manualHint')}</ThemedText>
            <TextField
              label={t('verify.tokenLabel')}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder="••••••••"
            />
            {error ? (
              <ThemedText style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </ThemedText>
            ) : null}
            <Button
              label={t('verify.submit')}
              onPress={() => submit(token)}
              variant="primary"
              size="lg"
            />
            <Button
              label={t('verify.goToLogin')}
              onPress={() => router.replace('/login')}
              variant="outline"
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24 },
  subtitle: { opacity: 0.7 },
  error: { color: '#d33' },
});
