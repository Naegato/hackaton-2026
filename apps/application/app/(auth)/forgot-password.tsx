import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const RESEND_DELAY = 30; // secondes avant de pouvoir renvoyer

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Décompte du délai avant réautorisation du renvoi
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  async function sendResetEmail() {
    setError(null);
    if (!email.trim()) {
      setError(t('forgot.errEmail'));
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      setCooldown(RESEND_DELAY);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('forgot.errGeneric'));
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
          <ThemedText type="title">{t('forgot.title')}</ThemedText>

          {sent ? (
            <>
              <ThemedText style={styles.subtitle}>{t('forgot.sent')}</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/reset-password')}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                  {t('forgot.haveCode')}
                </ThemedText>
              </Pressable>

              {error ? (
                <ThemedText style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={loading || cooldown > 0}
                onPress={sendResetEmail}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (pressed || loading || cooldown > 0) && styles.buttonPressed,
                ]}>
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText type="link">
                    {cooldown > 0 ? `${t('forgot.resend')} (${cooldown}s)` : t('forgot.resend')}
                  </ThemedText>
                )}
              </Pressable>

              <ThemedView style={styles.footer}>
                <Link href="/login" replace>
                  <ThemedText type="link">{t('common.backToLogin')}</ThemedText>
                </Link>
              </ThemedView>
            </>
          ) : (
            <>
              <ThemedText style={styles.subtitle}>{t('forgot.subtitle')}</ThemedText>
              <TextField
                label={t('common.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                placeholder="exemple@email.fr"
                textContentType="emailAddress"
                onSubmitEditing={sendResetEmail}
                returnKeyType="send"
              />

              {error ? (
                <ThemedText style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={sendResetEmail}
                style={({ pressed }) => [
                  styles.button,
                  (pressed || loading) && styles.buttonPressed,
                ]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                    {t('forgot.send')}
                  </ThemedText>
                )}
              </Pressable>

              <ThemedView style={styles.footer}>
                <Link href="/login" replace>
                  <ThemedText type="link">{t('common.backToLogin')}</ThemedText>
                </Link>
              </ThemedView>
            </>
          )}
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
  buttonPressed: { opacity: 0.5 },
  buttonText: { fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
