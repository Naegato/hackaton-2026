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
  /** Ouvre la fiche d'information. */
  onInfo: () => void;
};

/** Carte d'abonnement : illustration, bouton info, nom, prix. Partagée entre Offres et Catalogue. */
export function PlanCard({ plan, priceLabel, recommended = false, recommendedLabel, subtitle, onInfo }: Props) {
  const img = planImageSource(plan);
  return (
    <View
      style={[
        styles.card,
        { borderColor: recommended ? Colors.primary : Colors.border },
        recommended && styles.recommended,
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Info"
        onPress={onInfo}
        hitSlop={8}
        style={({ pressed }) => [styles.infoBtn, pressed && styles.pressed]}>
        <MaterialIcons name="info-outline" size={20} color="#fff" />
      </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  recommended: { borderWidth: 2 },
  image: { width: '100%', height: 130, backgroundColor: Colors.borderLight },
  infoBtn: {
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
