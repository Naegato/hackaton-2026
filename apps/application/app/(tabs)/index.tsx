import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { PlanCard } from '@/components/plan-card';
import { PlanInfoModal } from '@/components/plan-info-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import { formatPlanPrice, planImageSource } from '@/lib/plan-images';

type Plan = RecommendationResult['plans'][number];

export default function OffersScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

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

  // Avec préférences : on ne garde QUE les offres éligibles (recommandée en tête). Sinon tout le catalogue.
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

        {!hasPrefs ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/preferences')}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <ThemedText type="link">{t('offers.fillPrefs')}</ThemedText>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          visible.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              priceLabel={formatPlanPrice(plan, t)}
              recommended={hasPrefs && plan.slug === data?.recommendedSlug}
              recommendedLabel={t('offers.recommendedBadge')}
              subtitle={
                hasPrefs && plan.price > 0
                  ? `≈ ${Math.round(plan.monthlyEquivalent)} ${t('offers.perMonth')}`
                  : null
              }
              onInfo={() => setInfoPlan(plan)}
            />
          ))
        )}
      </ScrollView>

      <PlanInfoModal
        plan={infoPlan}
        imageSource={infoPlan ? planImageSource(infoPlan) : null}
        priceLabel={infoPlan ? formatPlanPrice(infoPlan, t) : ''}
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
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  error: { color: '#d33', marginTop: 24 },
});
