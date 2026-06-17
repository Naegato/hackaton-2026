import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { PlanInfoModal } from '@/components/plan-info-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { BASE_URL, getRecommendation, type RecommendationResult } from '@/lib/api';
import { Colors } from '@/constants/Colors';
import type { TranslationKey } from '@/lib/i18n';
import { PLAN_IMAGES } from '@/lib/plan-images';

type Plan = RecommendationResult['plans'][number];

/** Source d'image d'une offre : illustration locale prioritaire, sinon média de l'API. */
function planImageSource(plan: Plan): ImageSourcePropType | null {
  const local = PLAN_IMAGES[plan.slug];
  if (local) return local;
  if (!plan.image) return null;
  const uri = plan.image.startsWith('http') ? plan.image : `${BASE_URL}${plan.image}`;
  return { uri };
}

export default function OffersScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const tint = Colors.primary;
  const border = Colors.border;

  // L'utilisateur a-t-il renseigné des préférences ? (sinon : catalogue complet, sans reco)
  const p = user?.preferences;
  const hasPrefs = !!(p?.birthdate || p?.status || p?.usageDaysPerWeek != null);

  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoPlan, setInfoPlan] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getRecommendation({}));
    } catch {
      setError(t('offers.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // Recharge à chaque fois que l'écran reprend le focus (ex. retour de l'édition des préférences)
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function formatPrice(price: number, period: RecommendationResult['plans'][number]['period']) {
    if (price === 0) return t('offers.onDossier');
    return `${price} € ${t(('period.' + period) as TranslationKey)}`;
  }

  // Avec préférences : on ne garde QUE les offres éligibles (recommandée en tête).
  // Sans préférences : tout le catalogue.
  const all = data?.plans ?? [];
  const visible = hasPrefs
    ? all
        .filter((x) => x.eligible)
        .sort((a, b) => {
          if (a.slug === data?.recommendedSlug) return -1;
          if (b.slug === data?.recommendedSlug) return 1;
          return 0;
        })
    : all;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }>
        <ThemedText type="title">{t(hasPrefs ? 'offers.titleEligible' : 'offers.title')}</ThemedText>

        {/* Incitation à remplir le questionnaire si pas de préférences */}
        {!hasPrefs ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/preferences')}
            style={({ pressed }) => [styles.cta, { borderColor: tint }, pressed && styles.pressed]}>
            <ThemedText type="link">{t('offers.fillPrefs')}</ThemedText>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          visible.map((plan) => {
            const recommended = hasPrefs && plan.slug === data?.recommendedSlug;
            const img = planImageSource(plan);
            return (
              <View
                key={plan.slug}
                style={[
                  styles.card,
                  { borderColor: recommended ? tint : border },
                  recommended && styles.cardRecommended,
                ]}>
                {/* Illustration de l'offre : affichée en cover (montre une partie pertinente d'une image plus grande) */}
                {img ? (
                  <Image
                    source={img}
                    style={styles.cardImage}
                    contentFit="cover"
                    contentPosition={{ top: '25%' }}
                    transition={150}
                  />
                ) : null}

                {/* Bouton info → fiche détaillée */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Info"
                  onPress={() => setInfoPlan(plan)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.infoBtn, pressed && styles.pressed]}>
                  <MaterialIcons name="info-outline" size={20} color="#fff" />
                </Pressable>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {plan.name}
                    </ThemedText>
                    {recommended ? (
                      <View style={[styles.badge, { backgroundColor: tint }]}>
                        <ThemedText style={styles.badgeText} lightColor="#fff" darkColor="#fff">
                          {t('offers.recommendedBadge')}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <ThemedText style={styles.price}>{formatPrice(plan.price, plan.period)}</ThemedText>

                  {hasPrefs && plan.price > 0 ? (
                    <ThemedText style={styles.est}>
                      ≈ {Math.round(plan.monthlyEquivalent)} {t('offers.perMonth')}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <PlanInfoModal
        plan={infoPlan}
        imageSource={infoPlan ? planImageSource(infoPlan) : null}
        priceLabel={infoPlan ? formatPrice(infoPlan.price, infoPlan.period) : ''}
        onClose={() => setInfoPlan(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 64, gap: 14 },
  cta: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  error: { color: '#d33', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardRecommended: { borderWidth: 2 },
  infoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64B5F6', // bleu charte IDF Mobilités
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: { width: '100%', height: 130, backgroundColor: Colors.borderLight },
  cardBody: { padding: 16, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 17, flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 16, opacity: 0.9 },
  est: { fontSize: 13, opacity: 0.6 },
});
