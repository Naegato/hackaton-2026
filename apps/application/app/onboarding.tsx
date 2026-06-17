import { useRouter } from 'expo-router';

import { Questionnaire, type Answers } from '@/components/questionnaire';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { updateUser } from '@/lib/api';
import { answersToPreferences, buildPreferenceQuestions } from '@/lib/preferences-questions';

export default function OnboardingScreen() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  async function onSubmit(answers: Answers) {
    if (!user) return;
    await updateUser(user.id, {
      preferences: answersToPreferences(answers),
      onboardingCompleted: true,
    });
    await refreshUser(); // le guard bascule vers l'app une fois onboardingCompleted = true
    router.replace('/');
  }

  // Ignorer : on marque l'onboarding fait, sans préférences → le catalogue s'affichera en entier (sans reco)
  async function onSkip() {
    if (!user) return;
    await updateUser(user.id, { onboardingCompleted: true });
    await refreshUser();
    router.replace('/');
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Questionnaire
        questions={buildPreferenceQuestions(t)}
        onSubmit={onSubmit}
        onSkip={onSkip}
        skipLabel={t('onboarding.skip')}
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
