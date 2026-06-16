import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLocale } from '@/context/locale-context';
import { LOCALES, type LocaleCode } from '@/lib/i18n';

/**
 * Sélecteur de langue. Disponible partout, y compris sans compte (avant connexion).
 * Affiche un bouton compact qui ouvre une liste de langues.
 */
export function LanguagePicker() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({ light: '#ddd', dark: '#333' }, 'icon');

  const current = LOCALES.find((l) => l.code === locale);

  function choose(code: LocaleCode) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.language')}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, { borderColor: border }, pressed && styles.pressed]}>
        <ThemedText>🌐 {current?.label ?? locale.toUpperCase()}</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <ThemedView style={styles.sheet}>
            <ThemedText type="subtitle" style={styles.sheetTitle}>
              {t('language.title')}
            </ThemedText>
            {LOCALES.map((l) => {
              const active = l.code === locale;
              return (
                <Pressable
                  key={l.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => choose(l.code)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                  <ThemedText style={active ? { color: tint, fontWeight: '600' } : undefined}>
                    {l.label}
                  </ThemedText>
                  {active ? <ThemedText style={{ color: tint }}>✓</ThemedText> : <View />}
                </Pressable>
              );
            })}
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  sheetTitle: { marginBottom: 8 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 48,
  },
});
