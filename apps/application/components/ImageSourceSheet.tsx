import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import { WebUnavailableModal } from '@/components/WebUnavailableModal';

type ImageSourceSheetProps = {
  visible: boolean;
  title: string;
  onSelect: (source: 'library' | 'camera') => void;
  onClose: () => void;
};

/** Action sheet pour choisir la source d'une image (galerie ou appareil photo). */
export function ImageSourceSheet({ visible, title, onSelect, onClose }: ImageSourceSheetProps) {
  const { t } = useLocale();
  const [webBlocked, setWebBlocked] = useState(false);

  function handleCamera() {
    if (Platform.OS === 'web') {
      setWebBlocked(true);
      return;
    }
    onSelect('camera');
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={styles.wrap}>
            <Pressable style={styles.card} onPress={() => {}}>
              <View style={styles.handle} />
              <Text style={styles.title}>{title}</Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect('library')}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="images-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.optionLabel}>{t('subscribe.photo.library')}</Text>
              </Pressable>

              <View style={styles.separator} />

              <Pressable
                accessibilityRole="button"
                onPress={handleCamera}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.optionLabel}>{t('subscribe.photo.camera')}</Text>
              </Pressable>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}>
              <Text style={styles.cancelLabel}>{t('assistant.cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <WebUnavailableModal visible={webBlocked} onClose={() => setWebBlocked(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  wrap: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    overflow: 'hidden',
    ...Shadow.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  optionPressed: { backgroundColor: Colors.surface },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { ...Typography.bodyBold },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 36 + Spacing.md,
  },
  cancel: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  cancelLabel: { ...Typography.bodyBold, color: Colors.danger },
});
