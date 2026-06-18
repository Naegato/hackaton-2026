import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LanguagePicker } from '@/components/language-picker';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      // Payload renvoie un message « please verify your email » (en anglais) → on le localise
      const msg = e instanceof Error ? e.message : '';
      if (/verif/i.test(msg)) {
        setError(t('login.errUnverified'));
      } else {
        setError(msg || t('login.errGeneric'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.errGoogle'));
    } finally {
      setGoogleLoading(false);
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
            placeholder="exemple@email.fr"
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

          <Button
            label={t('login.submit')}
            onPress={onSubmit}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={googleLoading}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>{t('login.orDivider')}</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label={t('login.googleSignIn')}
            onPress={onGoogleSignIn}
            variant="outline"
            size="lg"
            loading={googleLoading}
            disabled={loading}
          />

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
  topBar: { alignItems: 'flex-end', marginBottom: 8 },
  subtitle: { marginBottom: 8, opacity: 0.7 },
  error: { color: '#d33' },
  forgot: { alignSelf: 'flex-end' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    opacity: 0.5,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});