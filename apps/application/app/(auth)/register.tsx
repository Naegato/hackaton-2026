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
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function RegisterScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Email de vérification envoyé : on affiche l'écran « consultez votre boîte mail » au lieu d'entrer dans l'app
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError(t('register.errRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('register.errLen'));
      return;
    }
    if (password !== confirm) {
      setError(t('register.errMatch'));
      return;
    }
    setLoading(true);
    try {
      const trimmed = email.trim();
      await signUp({
        email: trimmed,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      // Pas de connexion auto : il faut d'abord confirmer l'email
      setSentTo(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('register.errGeneric'));
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
      setError(e instanceof Error ? e.message : t('register.errGoogle'));
    } finally {
      setGoogleLoading(false);
    }
  }

  // Écran de confirmation : l'email de vérification vient d'être envoyé
  if (sentTo) {
    return (
      <ThemedView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{t('verify.sentTitle')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('verify.sentBody')}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.sentEmail}>
            {sentTo}
          </ThemedText>
          <ThemedText style={styles.subtitle}>{t('verify.sentHint')}</ThemedText>

          <Button
            label={t('verify.goToLogin')}
            onPress={() => router.replace('/login')}
            variant="primary"
            size="lg"
          />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{t('register.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('register.subtitle')}</ThemedText>

          <Button
            label={t('register.googleSignIn')}
            onPress={onGoogleSignIn}
            variant="outline"
            size="lg"
            loading={googleLoading}
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>{t('register.orDivider')}</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <TextField
            label={t('common.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
            textContentType="givenName"
            placeholder="Camille"
          />
          <TextField
            label={t('common.lastName')}
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
            textContentType="familyName"
            placeholder="Martin"
          />
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

          <Button
            label={t('register.submit')}
            onPress={onSubmit}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={googleLoading}
          />

          <ThemedView style={styles.footer}>
            <ThemedText>{t('register.haveAccount')} </ThemedText>
            <Link href="/login" replace>
              <ThemedText type="link">{t('register.signIn')}</ThemedText>
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
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  subtitle: { marginBottom: 8, opacity: 0.7 },
  sentEmail: { fontSize: 16 },
  error: { color: '#d33' },
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