import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('profile.title')}</ThemedText>

      {fullName ? <ThemedText type="subtitle">{fullName}</ThemedText> : null}
      <ThemedText style={styles.email}>{user?.email}</ThemedText>
      {user?.roles?.length ? (
        <ThemedText style={styles.roles}>
          {t('profile.role')} : {user.roles.join(', ')}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/preferences')}
        style={({ pressed }) => [styles.secondary, pressed && styles.buttonPressed]}>
        <ThemedText type="link">{t('profile.preferences')}</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/test-photo')}
        style={({ pressed }) => [styles.secondary, pressed && styles.buttonPressed]}>
        <ThemedText type="link">Test vérification photo</ThemedText>
      </Pressable>

      <View style={styles.languageRow}>
        <ThemedText type="defaultSemiBold">{t('common.language')}</ThemedText>
        <LanguagePicker />
      </View>

      <Button
        label={t('profile.signOut')}
        onPress={signOut}
        style={styles.signOut}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    gap: 8,
  },
  email: { opacity: 0.7 },
  roles: { opacity: 0.7, marginBottom: 16 },
  secondary: {
    marginTop: 24,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.6 },
  languageRow: {
    marginTop: 8,
    gap: 8,
  },
  signOut: {
    marginTop: 24,
    width: '100%',
    backgroundColor: Colors.danger,
  },
});
