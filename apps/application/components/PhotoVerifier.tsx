import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { WebUnavailableModal } from '@/components/WebUnavailableModal';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { ApiError, verifyPhoto } from '@/lib/api';

type Status = 'idle' | 'checking' | 'human' | 'not-human' | 'error';

const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type AllowedMimeType = (typeof MIME_TYPES)[number];

function toAllowedMimeType(mimeType: string | undefined): AllowedMimeType {
  return (MIME_TYPES as readonly string[]).includes(mimeType ?? '')
    ? (mimeType as AllowedMimeType)
    : 'image/jpeg';
}

/**
 * Sélection d'une photo (galerie ou caméra) + vérification qu'elle contient bien
 * un visage humain avant de l'attacher à un abonnement.
 */
export function PhotoVerifier({
  onVerified,
}: {
  onVerified?: (imageUri: string) => void;
}) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [webBlocked, setWebBlocked] = useState(false);

  async function handlePicked(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setStatus('checking');
    setMessage(null);

    if (!asset.base64) {
      setStatus('error');
      setMessage("Impossible de lire l'image sélectionnée.");
      return;
    }

    try {
      const res = await verifyPhoto(asset.base64, toAllowedMimeType(asset.mimeType));
      setStatus(res.isHuman ? 'human' : 'not-human');
      setMessage(res.message);
      if (res.isHuman) onVerified?.(asset.uri);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Échec de la vérification.');
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès aux photos pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });
    await handlePicked(result);
  }

  async function pickFromCamera() {
    if (Platform.OS === 'web') {
      setWebBlocked(true);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la caméra pour continuer.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });
    await handlePicked(result);
  }

  return (
    <Card>
      <ThemedText type="defaultSemiBold">Photo pour la carte d'abonnement</ThemedText>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} accessibilityLabel="Photo sélectionnée" />
      )}

      {status === 'checking' && (
        <ThemedText style={styles.statusNeutral}>Vérification en cours…</ThemedText>
      )}
      {status === 'human' && (
        <ThemedText style={styles.statusSuccess}>✓ {message}</ThemedText>
      )}
      {status === 'not-human' && (
        <ThemedText style={styles.statusError}>✕ {message}</ThemedText>
      )}
      {status === 'error' && (
        <ThemedText style={styles.statusWarning}>⚠ Erreur technique : {message}</ThemedText>
      )}

      <View style={styles.actions}>
        <Button label="Choisir dans la galerie" onPress={pickFromLibrary} variant="outline" size="sm" />
        <Button label="Prendre une photo" onPress={pickFromCamera} variant="secondary" size="sm" />
      </View>

      <WebUnavailableModal visible={webBlocked} onClose={() => setWebBlocked(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: 140,
    height: 180,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statusNeutral: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  statusSuccess: {
    marginTop: Spacing.md,
    color: Colors.success,
  },
  statusError: {
    marginTop: Spacing.md,
    color: Colors.danger,
  },
  statusWarning: {
    marginTop: Spacing.md,
    color: Colors.warning,
  },
});
