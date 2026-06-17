import type { Answers, Question } from '@/components/questionnaire';
import type { Preferences } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

type Translate = (key: TranslationKey) => string;

/**
 * Questions du formulaire de préférences (onboarding + édition).
 * Réutilisable : pour la souscription future, on pourra concaténer 1-2 questions en plus.
 */
export function buildPreferenceQuestions(t: Translate): Question[] {
  const currentYear = new Date().getFullYear();
  return [
    {
      key: 'birthYear',
      type: 'number',
      title: t('onboarding.q.birthYear'),
      placeholder: t('onboarding.birthYearPlaceholder'),
      validate: (v) => {
        const n = Number(v);
        if (!v || Number.isNaN(n) || n < 1900 || n > currentYear) return t('onboarding.errBirthYear');
        return null;
      },
    },
    {
      key: 'status',
      type: 'choice',
      title: t('onboarding.q.status'),
      options: [
        { label: t('status.student'), value: 'student' },
        { label: t('status.active'), value: 'active' },
        { label: t('status.retired'), value: 'retired' },
        { label: t('status.jobseeker'), value: 'jobseeker' },
        { label: t('status.other'), value: 'other' },
      ],
    },
    {
      key: 'usageDaysPerWeek',
      type: 'choice',
      title: t('onboarding.q.usage'),
      options: [
        { label: t('usage.occasional'), value: 2 },
        { label: t('usage.regular'), value: 4 },
        { label: t('usage.daily'), value: 6 },
      ],
    },
    {
      key: 'socialBeneficiary',
      type: 'boolean',
      title: t('onboarding.q.social'),
      yesLabel: t('common.yes'),
      noLabel: t('common.no'),
    },
  ];
}

export function answersToPreferences(a: Answers): Preferences {
  const year = Number(a.birthYear);
  return {
    // On ne demande que l'année → on stocke une date au 1ᵉʳ janvier (l'âge calculé reste juste à ±1)
    birthdate: year ? `${year}-01-01` : null,
    status: (a.status as Preferences['status']) ?? null,
    usageDaysPerWeek: typeof a.usageDaysPerWeek === 'number' ? a.usageDaysPerWeek : null,
    socialBeneficiary: Boolean(a.socialBeneficiary),
  };
}

export function preferencesToAnswers(p?: Preferences | null): Answers {
  if (!p) return {};
  const a: Answers = {};
  if (p.birthdate) a.birthYear = String(new Date(p.birthdate).getFullYear());
  if (p.status) a.status = p.status;
  if (p.usageDaysPerWeek != null) a.usageDaysPerWeek = p.usageDaysPerWeek;
  if (p.socialBeneficiary != null) a.socialBeneficiary = p.socialBeneficiary;
  return a;
}
