import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import { getRecommendation, type RecommendationResult } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';
import { eligibilityLines, requiredDocuments } from '@/lib/plan-eligibility';
import { formatPlanPrice, planImageSource } from '@/lib/plan-images';

type Plan = RecommendationResult['plans'][number];
type IconName = ComponentProps<typeof MaterialIcons>['name'];

// Modes couverts (offres toutes zones 1-5) — pictos génériques, pas les logos officiels protégés
const TRANSPORT_MODES: { key: string; icon: IconName; label: TranslationKey }[] = [
  { key: 'metro', icon: 'directions-subway', label: 'mode.metro' },
  { key: 'rer', icon: 'directions-railway', label: 'mode.rer' },
  { key: 'train', icon: 'train', label: 'mode.train' },
  { key: 'tram', icon: 'tram', label: 'mode.tram' },
  { key: 'bus', icon: 'directions-bus', label: 'mode.bus' },
  { key: 'cable', icon: 'directions-transit', label: 'mode.cable' },
  { key: 'airport', icon: 'flight', label: 'mode.airport' },
];

export default function PlanDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLocale();
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showZonesInfo, setShowZonesInfo] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getRecommendation({});
      setPlan(res.plans.find((p) => p.slug === slug) ?? null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!plan) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ThemedText>{t('offers.loadError')}</ThemedText>
      </ThemedView>
    );
  }

  const img = planImageSource(plan);
  const eligibility = eligibilityLines(plan, t);
  const documents = requiredDocuments(plan, t);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: plan.name }} />

      <ScrollView contentContainerStyle={styles.content}>
        {img ? (
          <Image source={img} style={styles.hero} contentFit="cover" contentPosition={{ top: '25%' }} />
        ) : null}

        <View style={styles.body}>
          <ThemedText type="title">{plan.name}</ThemedText>
          <ThemedText style={styles.price}>{formatPlanPrice(plan, t)}</ThemedText>

          {plan.zones ? (
            <>
              <View style={styles.row}>
                <MaterialIcons name="map" size={18} color={Colors.primary} />
                <ThemedText style={styles.rowText}>
                  {t('info.zones')} {plan.zones}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('detail.zonesInfo')}
                  onPress={() => setShowZonesInfo((v) => !v)}
                  hitSlop={8}>
                  <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
                </Pressable>
              </View>
              {showZonesInfo ? (
                <ThemedText style={styles.zonesNote}>{t('detail.zonesInfo')}</ThemedText>
              ) : null}
            </>
          ) : null}

          {/* Éligibilité */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="verified-user" size={18} color={Colors.primary} />
            <ThemedText type="defaultSemiBold">{t('info.eligibility')}</ThemedText>
          </View>
          {eligibility.map((line) => (
            <View key={line} style={styles.bullet}>
              <MaterialIcons name="check" size={18} color={Colors.success} />
              <ThemedText style={styles.bulletText}>{line}</ThemedText>
            </View>
          ))}

          {/* Documents requis */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="description" size={18} color={Colors.primary} />
            <ThemedText type="defaultSemiBold">{t('info.documents')}</ThemedText>
          </View>
          {documents.map((line) => (
            <View key={line} style={styles.bullet}>
              <MaterialIcons name="check" size={18} color={Colors.success} />
              <ThemedText style={styles.bulletText}>{line}</ThemedText>
            </View>
          ))}

          {/* Modes de transport (toutes zones → tous modes) */}
          <View style={styles.sectionTitle}>
            <MaterialIcons name="commute" size={18} color={Colors.primary} />
            <ThemedText type="defaultSemiBold">{t('detail.modes')}</ThemedText>
          </View>
          <View style={styles.modesGrid}>
            {TRANSPORT_MODES.map((m) => (
              <View key={m.key} style={styles.modeItem}>
                <MaterialIcons name="check" size={16} color={Colors.success} />
                <MaterialIcons name={m.icon} size={18} color={Colors.primary} />
                <ThemedText style={styles.modeLabel}>{t(m.label)}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA souscription */}
      <View style={styles.footer}>
        <Button
          label={t('subscribe.cta')}
          onPress={() => router.push(`/subscribe/${plan.slug}`)}
          style={styles.cta}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 24 },
  hero: { width: '100%', height: 200, backgroundColor: Colors.borderLight },
  body: { padding: 20, gap: 10 },
  price: { fontSize: 18, opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 15 },
  zonesNote: {
    fontSize: 13,
    opacity: 0.75,
    backgroundColor: Colors.primarySurface,
    borderRadius: 10,
    padding: 12,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  bulletText: { flex: 1, opacity: 0.85 },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 12, marginTop: 4 },
  modeItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '46%' },
  modeLabel: { fontSize: 14, opacity: 0.85 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  cta: { width: '100%' },
});
