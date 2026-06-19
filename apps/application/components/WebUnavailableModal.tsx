import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  message?: string;
};

/** Modale générique affichée quand une fonctionnalité native (caméra, micro…) n'est pas disponible sur le web. */
export function WebUnavailableModal({ visible, onClose, message }: Props) {
  const { t } = useLocale();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Ionicons name="desktop-outline" size={26} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{t('webUnavailable.title')}</Text>
          <Text style={styles.body}>{message ?? t('webUnavailable.body')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonLabel}>{t('webUnavailable.ok')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { ...Typography.bodyBold, textAlign: 'center' },
  body: { ...Typography.caption, textAlign: 'center', color: Colors.textSecondary },
  button: {
    marginTop: Spacing.sm,
    alignSelf: 'stretch',
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { ...Typography.bodyBold, color: Colors.white },
});
