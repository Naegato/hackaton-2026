import { ScrollView, StyleSheet } from 'react-native';

import { VoiceAssistant } from '@/components/VoiceAssistant';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';

/**
 * Écran de test pour le composant vocal (STT/TTS).
 * À retirer une fois l'assistant vocal intégré dans son usage réel.
 */
export default function TestVoiceScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Test assistant vocal</ThemedText>
        <ThemedText style={styles.subtitle}>
          Appuyez sur le micro, parlez, puis arrêtez l&apos;écoute pour obtenir une réponse de test.
        </ThemedText>

        <VoiceAssistant />
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
  subtitle: { color: Colors.textSecondary },
});
