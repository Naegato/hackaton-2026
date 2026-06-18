import React, { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';

type Status = 'idle' | 'listening' | 'done' | 'error';

/**
 * Composant de test : dictée vocale (STT) -> réponse générique locale -> lecture (TTS).
 * Aucun appel backend, la réponse n'est pas analysée, c'est uniquement un test technique.
 */
export function VoiceAssistant() {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const transcriptRef = useRef<string | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript;
    if (text) {
      transcriptRef.current = text;
      setTranscript(text);
    }
  });

  // Sur Android/iOS, la reco s'arrête seule dès qu'un résultat final arrive :
  // c'est ici, pas dans stopListening, qu'il faut construire la réponse.
  useSpeechRecognitionEvent('end', () => {
    setStatus((current) => {
      if (current !== 'listening') return current;
      const finalTranscript = transcriptRef.current;
      setResponse(
        finalTranscript
          ? `J'ai bien entendu : « ${finalTranscript} ». Voici une réponse de test générée localement.`
          : "Je n'ai rien entendu, réessayez."
      );
      return 'done';
    });
  });

  useSpeechRecognitionEvent('error', (event) => {
    setStatus('error');
    setResponse(`Erreur de reconnaissance vocale : ${event.message}`);
  });

  async function startListening() {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setStatus('error');
      setResponse("Autorisez l'accès au micro pour utiliser la dictée vocale.");
      return;
    }
    transcriptRef.current = null;
    setTranscript(null);
    setResponse(null);
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({ lang: 'fr-FR', interimResults: true });
  }

  function stopListening() {
    ExpoSpeechRecognitionModule.stop();
  }

  function speakResponse() {
    if (!response) return;
    setSpeaking(true);
    Speech.speak(response, {
      language: 'fr-FR',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  const listening = status === 'listening';

  return (
    <Card>
      <ThemedText type="defaultSemiBold">Assistant vocal (test)</ThemedText>

      {transcript && <ThemedText style={styles.transcript}>« {transcript} »</ThemedText>}

      {status === 'done' && response && (
        <ThemedText style={styles.statusSuccess} accessibilityLiveRegion="polite">
          {response}
        </ThemedText>
      )}
      {status === 'error' && response && (
        <ThemedText style={styles.statusError} accessibilityLiveRegion="polite">
          ⚠ {response}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={listening ? "Arrêter l'écoute" : 'Démarrer la dictée vocale'}
          style={[styles.roundBtn, listening && styles.roundBtnActive]}
          onPress={listening ? stopListening : startListening}>
          <Ionicons
            name={listening ? 'mic' : 'mic-outline'}
            size={20}
            color={listening ? Colors.white : Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Écouter la réponse"
          accessibilityState={{ disabled: !response || speaking }}
          disabled={!response || speaking}
          style={[styles.roundBtn, (!response || speaking) && styles.roundBtnDisabled]}
          onPress={speakResponse}>
          <Ionicons name="volume-high-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  transcript: {
    marginTop: Spacing.md,
    color: Colors.text,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roundBtnDisabled: {
    opacity: 0.4,
  },
  statusSuccess: {
    marginTop: Spacing.md,
    color: Colors.success,
  },
  statusError: {
    marginTop: Spacing.md,
    color: Colors.danger,
  },
});
