import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListItem } from '@/components/ui/ListItem';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

export default function SubscribeResultScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{
    age?: string;
    detailedProfile?: string;
    usageDaysPerWeek?: string;
    employerReimbursement?: string;
    situation?: string;
    planSlug?: string;
  }>();

  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getRecommendation({
          age: params.age ? Number(params.age) : undefined,
          detailedProfile: params.detailedProfile as never,
          usageDaysPerWeek: params.usageDaysPerWeek ? Number(params.usageDaysPerWeek) : undefined,
          employerReimbursement: params.employerReimbursement as never,
          situation: params.situation as never,
        });
        if (active) setData(res);
      } catch {
        if (active) setError(t('subscribe.result.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatPrice(price: number, period: RecommendationResult['plans'][number]['period']) {
    if (price === 0) return t('offers.onDossier');
    return `${price} € ${t(('period.' + period) as TranslationKey)}`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? t('subscribe.result.loadError')}</Text>
      </View>
    );
  }

  const targetSlug = params.planSlug ?? data.recommendedSlug;
  const main = data.plans.find((p) => p.slug === targetSlug);
  const alternatives = data.plans
    .filter((p) => p.eligible && p.slug !== targetSlug)
    .sort((a, b) => a.monthlyEquivalent - b.monthlyEquivalent)
    .slice(0, 2);

  if (!main) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('subscribe.result.noneEligible')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('subscribe.result.title')}</Text>
        <Text style={styles.subtitle}>{t('subscribe.result.subtitle')}</Text>

        <Card style={styles.offerCard}>
          <Text style={styles.offerName}>{main.name}</Text>
          <Text style={styles.offerPrice}>{formatPrice(main.price, main.period)}</Text>
          {main.employerMonthlyNet != null ? (
            <Text style={styles.offerNet}>
              {t('subscribe.result.employerNet')} : {main.employerMonthlyNet} €
            </Text>
          ) : null}
        </Card>

        {main.requiredDocuments && main.requiredDocuments.length > 0 ? (
          <View style={styles.docsBlock}>
            <Text style={styles.sectionLabel}>{t('subscribe.result.documentsTitle')}</Text>
            <Card noPadding>
              {main.requiredDocuments.map((doc, i) => (
                <ListItem
                  key={doc}
                  label={doc}
                  right="none"
                  showSeparator={i < main.requiredDocuments!.length - 1}
                />
              ))}
            </Card>
          </View>
        ) : null}

        {alternatives.length > 0 ? (
          <View style={styles.docsBlock}>
            <Text style={styles.sectionLabel}>{t('subscribe.result.alternatives')}</Text>
            {alternatives.map((alt) => (
              <Card key={alt.slug} style={styles.altCard}>
                <Text style={styles.altName}>{alt.name}</Text>
                <Text style={styles.altPrice}>{formatPrice(alt.price, alt.period)}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('subscribe.result.subscribeCta')}
          variant="primary"
          size="lg"
          onPress={() =>
            router.push({ pathname: '/subscribe/checkout', params: { planId: main.id, planName: main.name } })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  error: { color: Colors.danger, textAlign: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { ...Typography.pageTitle },
  subtitle: { ...Typography.caption, marginBottom: Spacing.sm },
  offerCard: { backgroundColor: Colors.primarySurface, gap: Spacing.xs },
  offerName: { ...Typography.sectionTitle },
  offerPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  offerNet: { ...Typography.bodyBold, color: Colors.success },
  sectionLabel: { ...Typography.caption, fontWeight: '700', marginTop: Spacing.lg, marginBottom: Spacing.xs },
  docsBlock: { gap: Spacing.sm },
  altCard: { gap: Spacing.xs },
  altName: { ...Typography.bodyBold },
  altPrice: { ...Typography.caption },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
