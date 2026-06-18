import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ZoomableImage } from '@/components/zoomable-image';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import type { DocType } from '@/lib/api';
import { documentExamples } from '@/lib/document-examples';

/** Petit picto-bouton : ouvre un modal montrant l'exemple attendu pour un type de document. */
export function DocumentExampleButton({ type }: { type: DocType }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const examples = documentExamples(type);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('subscribe.example')}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <MaterialIcons name="image-search" size={18} color={Colors.primary} />
        <ThemedText style={styles.btnText}>{t('subscribe.example')}</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHead}>
              <ThemedText type="defaultSemiBold">{t('subscribe.example')}</ThemedText>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={10}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {examples.length > 0 ? (
              <>
                <ScrollView contentContainerStyle={styles.imagesCol} showsVerticalScrollIndicator={false}>
                  {examples.map((src, i) => (
                    <ZoomableImage
                      key={i}
                      source={src}
                      style={examples.length === 1 ? styles.exampleImgSingle : styles.exampleImg}
                    />
                  ))}
                </ScrollView>
                <View style={styles.hintRow}>
                  <MaterialIcons name="zoom-in" size={16} color={Colors.textSecondary} />
                  <ThemedText style={styles.hint}>{t('subscribe.zoomHint')}</ThemedText>
                </View>
              </>
            ) : (
              <View style={styles.empty}>
                <MaterialIcons name="hide-image" size={40} color={Colors.textTertiary} />
                <ThemedText style={styles.emptyText}>{t('subscribe.noExampleYet')}</ThemedText>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4 },
  btnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    gap: 12,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imagesCol: { gap: 12, alignItems: 'center' },
  // Une seule image : grande, pleine largeur
  exampleImgSingle: { width: '100%', height: 420, borderRadius: 10, backgroundColor: Colors.borderLight },
  // Plusieurs images : empilées, un peu plus petites
  exampleImg: { width: '100%', height: 260, borderRadius: 10, backgroundColor: Colors.borderLight },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { color: Colors.textSecondary },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  hint: { fontSize: 12, color: Colors.textSecondary },
});

