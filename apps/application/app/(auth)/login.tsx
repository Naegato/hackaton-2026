import { Link, useRouter } from 'expo-router';
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
import { LanguagePicker } from '@/components/language-picker';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError(t('login.errFields'));
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.errGeneric'));
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
          <ThemedView style={styles.topBar}>
            <LanguagePicker />
          </ThemedView>

          <ThemedText type="title">{t('login.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('login.subtitle')}</ThemedText>

          <TextField
            label={t('common.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            placeholder="toi@exemple.fr"
            textContentType="emailAddress"
          />
          <TextField
            label={t('common.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            placeholder="••••••••"
            textContentType="password"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          {error ? (
            <ThemedText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}

          <Link href="/forgot-password" style={styles.forgot}>
            <ThemedText type="link">{t('login.forgot')}</ThemedText>
          </Link>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onSubmit}
            style={({ pressed }) => [styles.button, (pressed || loading) && styles.buttonPressed]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                {t('login.submit')}
              </ThemedText>
            )}
          </Pressable>

          <ThemedView style={styles.footer}>
            <ThemedText>{t('login.noAccount')} </ThemedText>
            <Link href="/register" replace>
              <ThemedText type="link">{t('login.createAccount')}</ThemedText>
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
  forgot: { alignSelf: 'flex-end' },
  topBar: { alignItems: 'flex-end', marginBottom: 8 },
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
