import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { TranslationKey } from '@/lib/i18n';

export default function OffersScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({ light: '#e2e2e2', dark: '#333' }, 'icon');

  // L'utilisateur a-t-il renseigné des préférences ? (sinon : catalogue complet, sans reco)
  const p = user?.preferences;
  const hasPrefs = !!(p?.birthdate || p?.status || p?.usageDaysPerWeek != null);

  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

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
            return (
              <View
                key={plan.slug}
                style={[
                  styles.card,
                  { borderColor: recommended ? tint : border },
                  recommended && styles.cardRecommended,
                ]}>
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
            );
          })
        )}
      </ScrollView>
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
    padding: 16,
    gap: 6,
  },
  cardRecommended: { borderWidth: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 17, flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 16, opacity: 0.9 },
  est: { fontSize: 13, opacity: 0.6 },
});
