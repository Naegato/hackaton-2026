import type { DetailedProfile, EmployerReimbursement, Situation } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

export const PROFILES: DetailedProfile[] = [
  'collegien',
  'lyceen',
  'etudiant',
  'alternant',
  'salarie',
  'fonctionnaire',
  'independant',
  'chomeur',
  'rsa',
  'retraite',
  'handicap',
  'militaire',
  'enceinte',
  'service-civique',
];

export function profileLabelKey(p: DetailedProfile): TranslationKey {
  return `profile.${p}` as TranslationKey;
}

const FREQUENCY_PROFILES: DetailedProfile[] = ['salarie', 'fonctionnaire', 'independant', 'alternant'];
const EMPLOYER_PROFILES: DetailedProfile[] = ['salarie', 'fonctionnaire'];
const BOURSIER_PROFILES: DetailedProfile[] = ['collegien', 'lyceen', 'etudiant'];

export function showsFrequency(p: DetailedProfile | null): boolean {
  return !!p && FREQUENCY_PROFILES.includes(p);
}

/** Le bloc remboursement employeur ne s'affiche que pour salarié/fonctionnaire, ou alternant à partir de 26 ans. */
export function showsEmployer(p: DetailedProfile | null, age: number | null): boolean {
  if (!p) return false;
  if (EMPLOYER_PROFILES.includes(p)) return true;
  return p === 'alternant' && age != null && age >= 26;
}

export function showsBoursier(p: DetailedProfile | null): boolean {
  return !!p && BOURSIER_PROFILES.includes(p);
}

export function showsCmi(p: DetailedProfile | null): boolean {
  return p === 'handicap';
}

export function showsRetraite(p: DetailedProfile | null): boolean {
  return p === 'retraite';
}

export function showsEnceinte(p: DetailedProfile | null): boolean {
  return p === 'enceinte';
}

export const FREQUENCY_OPTIONS: { value: 'quotidien' | 'souvent' | 'rarement'; usageDaysPerWeek: number }[] = [
  { value: 'quotidien', usageDaysPerWeek: 6 },
  { value: 'souvent', usageDaysPerWeek: 3 },
  { value: 'rarement', usageDaysPerWeek: 1 },
];

export const EMPLOYER_OPTIONS: EmployerReimbursement[] = ['50', 'plus', 'non'];

export const BOURSIER_SITUATIONS: Situation[] = ['boursier-crous', 'boursier-en', 'non-boursier'];
export const CMI_SITUATIONS: Situation[] = ['cecite', 'invalidite', 'priorite'];
export const RETRAITE_SITUATIONS: Situation[] = ['cmi', 'modeste', 'aucune'];
export const ENCEINTE_SITUATIONS: Situation[] = ['etudiante', 'non'];

/** Construit les query params pour /subscribe/result à partir des réponses collectées. */
export function buildResultParams(answers: {
  age: number;
  profile: DetailedProfile;
  usageDaysPerWeek?: number | null;
  employerReimbursement?: EmployerReimbursement | null;
  situation?: Situation | null;
}): Record<string, string> {
  const params: Record<string, string> = {
    age: String(answers.age),
    detailedProfile: answers.profile,
  };
  if (answers.usageDaysPerWeek != null) params.usageDaysPerWeek = String(answers.usageDaysPerWeek);
  if (answers.employerReimbursement) params.employerReimbursement = answers.employerReimbursement;
  if (answers.situation) params.situation = answers.situation;
  return params;
}
