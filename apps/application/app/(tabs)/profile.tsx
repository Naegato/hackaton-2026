import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mon profil</ThemedText>

      {fullName ? <ThemedText type="subtitle">{fullName}</ThemedText> : null}
      <ThemedText style={styles.email}>{user?.email}</ThemedText>
      {user?.roles?.length ? (
        <ThemedText style={styles.roles}>Rôle : {user.roles.join(', ')}</ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
          Se déconnecter
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
