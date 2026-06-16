import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  // Pré-rempli depuis le lien email (?token=...) ; saisissable manuellement sinon (natif)
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!token.trim()) {
      setError(t('reset.errMissing'));
      return;
    }
    if (password.length < 8) {
      setError(t('reset.errLen'));
      return;
    }
    if (password !== confirm) {
      setError(t('reset.errMatch'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      // resetPassword connecte directement → le guard bascule vers l'app
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reset.errGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{t('reset.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('reset.subtitle')}</ThemedText>

          {/* Champ token affiché seulement s'il n'a pas été fourni par le lien */}
          {!params.token ? (
            <TextField
              label={t('reset.codeLabel')}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder={t('reset.codePlaceholder')}
            />
          ) : null}

          <TextField
            label={t('common.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            textContentType="newPassword"
          />
          <TextField
            label={t('register.confirm')}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="••••••••"
            textContentType="newPassword"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          {error ? (
            <ThemedText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onSubmit}
            style={({ pressed }) => [styles.button, (pressed || loading) && styles.buttonPressed]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                {t('reset.submit')}
              </ThemedText>
            )}
          </Pressable>

          <ThemedView style={styles.footer}>
            <Link href="/login" replace>
              <ThemedText type="link">{t('common.backToLogin')}</ThemedText>
            </Link>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  subtitle: { marginBottom: 8, opacity: 0.7 },
  error: { color: '#d33' },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontWeight: '600', fontSize: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
