import { useRouter } from 'expo-router';

import { Questionnaire, type Answers } from '@/components/questionnaire';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { updateUser } from '@/lib/api';
import {
  answersToPreferences,
  buildPreferenceQuestions,
  preferencesToAnswers,
} from '@/lib/preferences-questions';

export default function PreferencesScreen() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  async function onSubmit(answers: Answers) {
    if (!user) return;
    // Édition : on ne touche pas à onboardingCompleted
    await updateUser(user.id, { preferences: answersToPreferences(answers) });
    await refreshUser();
    router.back();
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Questionnaire
        questions={buildPreferenceQuestions(t)}
        initialAnswers={preferencesToAnswers(user?.preferences)}
        onSubmit={onSubmit}
        labels={{ next: t('onboarding.next'), back: t('onboarding.back'), finish: t('onboarding.finish') }}
      />
    </ThemedView>
  );
}
