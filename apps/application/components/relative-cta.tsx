import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';

/** Encart « Souscrire pour un proche » → ouvre le formulaire dédié (/relative). Partagé entre l'onglet Personnalisation et le portefeuille. */
export function RelativeCta({ style }: { style?: object }) {
  const { t } = useLocale();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/relative')}
      style={({ pressed }) => [styles.cta, pressed && styles.pressed, style]}>
      <Image
        source={require('../assets/images/family.png')}
        style={styles.img}
        contentFit="contain"
      />
      <View style={styles.text}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {t('relative.cta')}
        </ThemedText>
        <ThemedText style={styles.sub}>{t('relative.ctaSub')}</ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={26} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
  },
  pressed: { opacity: 0.6 },
  img: { width: 56, height: 56 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16 },
  sub: { fontSize: 13, opacity: 0.7 },
});
