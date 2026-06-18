import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import type { RecommendationResult } from '@/lib/api';
import { planImageSource } from '@/lib/plan-images';

type Plan = RecommendationResult['plans'][number];

type Props = {
  plan: Plan;
  priceLabel: string;
  /** Affiche le badge + la bordure accent (écran Offres). */
  recommended?: boolean;
  recommendedLabel?: string;
  /** Ligne secondaire optionnelle (ex. « ≈ 83 €/mois »). */
  subtitle?: string | null;
  /** Ouvre le détail de l'offre (tap sur la carte). */
  onPress: () => void;
};

/** Carte d'abonnement : illustration, nom, prix. Cliquable → détail. Partagée entre Offres et Catalogue. */
export function PlanCard({ plan, priceLabel, recommended = false, recommendedLabel, subtitle, onPress }: Props) {
  const img = planImageSource(plan);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: recommended ? Colors.primary : Colors.border },
        recommended && styles.recommended,
        pressed && styles.pressed,
      ]}>
      {img ? (
        <Image
          source={img}
          style={styles.image}
          contentFit="cover"
          contentPosition={{ top: '25%' }}
          transition={150}
        />
      ) : null}

      {/* Chevron indiquant que la carte est cliquable */}
      <View style={styles.chip}>
        <MaterialIcons name="chevron-right" size={22} color="#fff" />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {plan.name}
          </ThemedText>
          {recommended && recommendedLabel ? (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText} lightColor="#fff" darkColor="#fff">
                {recommendedLabel}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText style={styles.price}>{priceLabel}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  recommended: { borderWidth: 2 },
  image: { width: '100%', height: 130, backgroundColor: Colors.borderLight },
  chip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64B5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  body: { padding: 16, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.primary },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 16, opacity: 0.9 },
  subtitle: { fontSize: 13, opacity: 0.6 },
});
