import { ScrollView, StyleSheet } from 'react-native';

import { PhotoVerifier } from '@/components/PhotoVerifier';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Écran de test pour le composant de vérification de photo (Claude Vision).
 * À retirer une fois la souscription d'abonnement intégrée.
 */
export default function TestPhotoScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Test vérification photo</ThemedText>
        <ThemedText style={styles.subtitle}>
          Sélectionne une photo pour vérifier qu'elle contient bien un visage humain.
        </ThemedText>

        <PhotoVerifier onVerified={(uri) => console.log('[test-photo] validée :', uri)} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    paddingTop: 80,
    gap: 16,
  },
  subtitle: { opacity: 0.7 },
});
