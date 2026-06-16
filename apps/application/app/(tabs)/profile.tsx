import { Pressable, StyleSheet, View } from 'react-native';

import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();

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

      <View style={styles.languageRow}>
        <ThemedText type="defaultSemiBold">{t('common.language')}</ThemedText>
        <LanguagePicker />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
          {t('profile.signOut')}
        </ThemedText>
      </Pressable>
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
  languageRow: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#d33',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontWeight: '600', fontSize: 16 },
});
