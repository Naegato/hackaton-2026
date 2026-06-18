import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { CatalogFilters } from '@/components/catalog-filters';
import { PlanCard } from '@/components/plan-card';
import { PlanInfoModal } from '@/components/plan-info-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import { planMatchesFilters, type CatalogFilters as Filters } from '@/lib/catalog-filters';
import { formatPlanPrice, planImageSource } from '@/lib/plan-images';

type Plan = RecommendationResult['plans'][number];

/** Catalogue : tous les abonnements disponibles, avec descriptif via la fiche info. */
export default function CatalogScreen() {
  const { t } = useLocale();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoPlan, setInfoPlan] = useState<Plan | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const filtered = plans.filter((p) => planMatchesFilters(p, filters));

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getRecommendation({});
      setPlans(res.plans);
    } catch {
      setError(t('offers.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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
        <ThemedText type="title">{t('explore.title')}</ThemedText>

        {!loading && !error ? <CatalogFilters filters={filters} onChange={setFilters} /> : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : filtered.length === 0 ? (
          <ThemedText style={styles.empty}>{t('filter.empty')}</ThemedText>
        ) : (
          filtered.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              priceLabel={formatPlanPrice(plan, t)}
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
  error: { color: '#d33', marginTop: 24 },
  empty: { marginTop: 24, opacity: 0.6, textAlign: 'center' },
});
