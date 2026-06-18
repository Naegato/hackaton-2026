import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PlanCard } from '@/components/plan-card';
import { Questionnaire, type Answers } from '@/components/questionnaire';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import { createSubscription, getRecommendation, type RecommendationResult } from '@/lib/api';
import { formatPlanPrice } from '@/lib/plan-images';
import {
  buildRelativeQuestions,
  relativeHolder,
  relativeRecommendationParams,
} from '@/lib/relative-questions';

type Step = 'form' | 'select' | 'done';
type Plan = RecommendationResult['plans'][number];

/**
 * Souscrire pour un proche : formulaire (identité + profil du futur titulaire)
 * → sélection d'une offre éligible → création de l'abonnement avec le titulaire renseigné.
 * L'abonnement reste géré par le compte courant (managedBy) mais porte le nom du proche.
 */
export default function RelativeScreen() {
  const { t } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [recommendedSlug, setRecommendedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingSlug, setCreatingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const holder = answers ? relativeHolder(answers) : { holderFirstName: '', holderLastName: '' };
  const holderName = [holder.holderFirstName, holder.holderLastName].filter(Boolean).join(' ').trim();

  async function onFormSubmit(a: Answers) {
    setAnswers(a);
    setError(null);
    setLoading(true);
    setStep('select');
    try {
      const res = await getRecommendation(relativeRecommendationParams(a));
      setPlans(res.plans.filter((p) => p.eligible));
      setRecommendedSlug(res.recommendedSlug);
    } catch {
      setError(t('offers.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function onSelect(plan: Plan) {
    if (creatingSlug) return;
    setCreatingSlug(plan.slug);
    setError(null);
    try {
      await createSubscription({
        plan: plan.id,
        holderFirstName: holder.holderFirstName,
        holderLastName: holder.holderLastName,
      });
      setStep('done');
    } catch {
      setError(t('relative.createError'));
      setCreatingSlug(null);
    }
  }

  // Étape 1 : formulaire (réutilise le questionnaire, avec les nouvelles questions nom/prénom)
  if (step === 'form') {
    return (
      <ThemedView style={{ flex: 1 }}>
        <Questionnaire
          questions={buildRelativeQuestions(t)}
          onSubmit={onFormSubmit}
          labels={{
            next: t('onboarding.next'),
            back: t('onboarding.back'),
            finish: t('onboarding.finish'),
            review: t('onboarding.reviewTitle'),
          }}
        />
      </ThemedView>
    );
  }

  // Étape 3 : confirmation
  if (step === 'done') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <MaterialIcons name="check-circle" size={64} color={Colors.success} />
          <ThemedText type="title" style={styles.doneTitle}>
            {t('relative.successTitle')}
          </ThemedText>
          <ThemedText style={styles.doneMsg}>{t('relative.successMsg')}</ThemedText>
          <Button label={t('relative.backToWallet')} onPress={() => router.replace('/(tabs)/wallet')} />
        </View>
      </ThemedView>
    );
  }

  // Étape 2 : sélection de l'offre éligible
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{t('relative.selectTitle')}</ThemedText>
        {holderName ? (
          <ThemedText style={styles.forWhom}>
            {t('relative.selectSub')} {holderName}
          </ThemedText>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : plans.length === 0 ? (
          <ThemedText style={styles.none}>{t('relative.noEligible')}</ThemedText>
        ) : (
          plans
            .slice()
            .sort((a, b) => (a.slug === recommendedSlug ? -1 : b.slug === recommendedSlug ? 1 : 0))
            .map((plan) => (
              <View key={plan.slug}>
                <PlanCard
                  plan={plan}
                  priceLabel={formatPlanPrice(plan, t)}
                  recommended={plan.slug === recommendedSlug}
                  recommendedLabel={t('offers.recommendedBadge')}
                  onPress={() => onSelect(plan)}
                />
                {creatingSlug === plan.slug ? (
                  <ActivityIndicator style={{ marginTop: 8 }} />
                ) : null}
              </View>
            ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 24, gap: 14 },
  forWhom: { fontSize: 15, opacity: 0.7 },
  none: { opacity: 0.6, marginTop: 24 },
  error: { color: '#d33', marginTop: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneTitle: { textAlign: 'center' },
  doneMsg: { textAlign: 'center', opacity: 0.7, marginBottom: 8 },
});
