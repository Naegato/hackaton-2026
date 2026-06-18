import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

const AGE_FILTERS = [
  { key: 'lt11', label: '<11', minAge: 0, maxAge: 10 },
  { key: '11-18', label: '11–18', minAge: 11, maxAge: 18 },
  { key: '18-25', label: '18–25', minAge: 18, maxAge: 25 },
  { key: '26-61', label: '26–61', minAge: 26, maxAge: 61 },
  { key: '62plus', label: '62+', minAge: 62, maxAge: 200 },
];

export default function SubscribeCatalogueScreen() {
  const { t } = useLocale();
  const router = useRouter();

  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await getRecommendation(ageFilter ? { age: midpointAge(ageFilter) } : {}));
      } finally {
        setLoading(false);
      }
    })();
  }, [ageFilter]);

  function midpointAge(key: string) {
    const f = AGE_FILTERS.find((a) => a.key === key);
    return f ? Math.round((f.minAge + Math.min(f.maxAge, 90)) / 2) : undefined;
  }

  function formatPrice(price: number, period: RecommendationResult['plans'][number]['period']) {
    if (price === 0) return t('offers.onDossier');
    return `${price} € ${t(('period.' + period) as TranslationKey)}`;
  }

  const plans = useMemo(() => data?.plans ?? [], [data]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('subscribe.catalogue.title')}</Text>
      <Text style={styles.subtitle}>{t('subscribe.catalogue.subtitle')}</Text>

      <View style={styles.wrap}>
        {AGE_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={ageFilter === f.key}
            onPress={() => setAgeFilter(ageFilter === f.key ? null : f.key)}
          />
        ))}
      </View>

      <Text style={styles.count}>{t('subscribe.catalogue.count').replace('{count}', String(plans.length))}</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        plans.map((plan) => (
          <Pressable
            key={plan.slug}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/subscribe/result', params: { planSlug: plan.slug } })}>
            <Card style={plan.eligible ? styles.planCard : { ...styles.planCard, ...styles.planCardIneligible }}>
              <View style={styles.planRow}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.slug === data?.recommendedSlug ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('offers.recommendedBadge')}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.planPrice}>{formatPrice(plan.price, plan.period)}</Text>
              {!plan.eligible ? <Text style={styles.ineligible}>{t('offers.ineligible')}</Text> : null}
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
  title: { ...Typography.pageTitle },
  subtitle: { ...Typography.caption, marginBottom: Spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  count: { ...Typography.caption, marginTop: Spacing.sm },
  planCard: { gap: Spacing.xs, marginTop: Spacing.sm },
  planCardIneligible: { opacity: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  planName: { ...Typography.bodyBold, flexShrink: 1 },
  planPrice: { ...Typography.body, color: Colors.primary },
  ineligible: { ...Typography.caption, color: Colors.danger },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
});
