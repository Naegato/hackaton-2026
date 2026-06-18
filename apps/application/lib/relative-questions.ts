import type { Answers, Question } from '@/components/questionnaire';
import type { TranslationKey } from '@/lib/i18n';

import { buildPreferenceQuestions } from '@/lib/preferences-questions';

type Translate = (key: TranslationKey) => string;

/**
 * Questions du formulaire « souscrire pour un proche ».
 * On commence par l'identité du futur titulaire (nom/prénom — nouvelles questions),
 * puis on réutilise les questions de profil de l'onboarding pour recommander la bonne offre.
 */
export function buildRelativeQuestions(t: Translate): Question[] {
  return [
    {
      key: 'firstName',
      type: 'text',
      title: t('relative.q.firstName'),
      subtitle: t('relative.q.firstNameSub'),
      icon: 'badge',
      placeholder: t('relative.q.firstNamePlaceholder'),
      validate: (v) => (v.trim().length >= 2 ? null : t('relative.errName')),
    },
    {
      key: 'lastName',
      type: 'text',
      title: t('relative.q.lastName'),
      subtitle: t('relative.q.lastNameSub'),
      icon: 'badge',
      placeholder: t('relative.q.lastNamePlaceholder'),
      validate: (v) => (v.trim().length >= 2 ? null : t('relative.errName')),
    },
    ...buildPreferenceQuestions(t),
  ];
}

/** Identité du titulaire à enregistrer sur l'abonnement. */
export function relativeHolder(a: Answers): { holderFirstName: string; holderLastName: string } {
  return {
    holderFirstName: String(a.firstName ?? '').trim(),
    holderLastName: String(a.lastName ?? '').trim(),
  };
}

/** Paramètres de recommandation dérivés des réponses de profil du proche. */
export function relativeRecommendationParams(a: Answers): {
  age?: number;
  status?: string;
  usageDaysPerWeek?: number;
  socialBeneficiary?: boolean;
} {
  const year = Number(a.birthYear);
  const currentYear = new Date().getFullYear();
  return {
    age: year ? currentYear - year : undefined,
    status: typeof a.status === 'string' ? a.status : undefined,
    usageDaysPerWeek: typeof a.usageDaysPerWeek === 'number' ? a.usageDaysPerWeek : undefined,
    socialBeneficiary: typeof a.socialBeneficiary === 'boolean' ? a.socialBeneficiary : undefined,
  };
}
