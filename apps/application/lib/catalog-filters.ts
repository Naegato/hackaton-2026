import type { RecommendationResult } from './api';
import type { TranslationKey } from './i18n';

type Plan = RecommendationResult['plans'][number];

export type ProfilKey = 'child' | 'scolaire' | 'etudiant' | 'actif' | 'retraite' | 'jobseeker';
export type FreqKey = 'daily' | 'regular' | 'light' | 'occasional';
export type TypeKey = 'monthly' | 'weekly' | 'annual' | 'perTrip';
export type BudgetKey = 'low' | 'mid' | 'high';
export type SituationKey = 'boursier' | 'minima' | 'cmi' | 'none';

export type CatalogFilters = {
  profil?: ProfilKey;
  freq?: FreqKey;
  type?: TypeKey;
  budget?: BudgetKey;
  situation?: SituationKey;
};

/** Profil → âge représentatif + statut étudiant (le profil porte sa tranche d'âge). */
const PROFIL: Record<ProfilKey, { age: number; student: boolean }> = {
  child: { age: 8, student: true },
  scolaire: { age: 15, student: true },
  etudiant: { age: 22, student: true },
  actif: { age: 40, student: false },
  retraite: { age: 70, student: false },
  jobseeker: { age: 40, student: false },
};

const FREQ_DAYS: Record<FreqKey, number> = { daily: 6, regular: 4, light: 2, occasional: 1 };
const TYPE_PERIOD: Record<TypeKey, Plan['period']> = {
  monthly: 'monthly',
  weekly: 'weekly',
  annual: 'annual',
  perTrip: 'per-trip',
};

// Options pour l'UI (chaque option = clé interne + clé i18n)
export const PROFIL_OPTIONS: { key: ProfilKey; label: TranslationKey }[] = [
  { key: 'child', label: 'profil.child' },
  { key: 'scolaire', label: 'profil.scolaire' },
  { key: 'etudiant', label: 'profil.etudiant' },
  { key: 'actif', label: 'profil.actif' },
  { key: 'retraite', label: 'profil.retraite' },
  { key: 'jobseeker', label: 'profil.jobseeker' },
];
export const FREQ_OPTIONS: { key: FreqKey; label: TranslationKey }[] = [
  { key: 'daily', label: 'freq.daily' },
  { key: 'regular', label: 'freq.regular' },
  { key: 'light', label: 'freq.light' },
  { key: 'occasional', label: 'freq.occasional' },
];
export const TYPE_OPTIONS: { key: TypeKey; label: TranslationKey }[] = [
  { key: 'monthly', label: 'type.monthly' },
  { key: 'weekly', label: 'type.weekly' },
  { key: 'annual', label: 'type.annual' },
  { key: 'perTrip', label: 'type.perTrip' },
];
export const BUDGET_OPTIONS: { key: BudgetKey; label: TranslationKey }[] = [
  { key: 'low', label: 'budget.low' },
  { key: 'mid', label: 'budget.mid' },
  { key: 'high', label: 'budget.high' },
];
export const SITUATION_OPTIONS: { key: SituationKey; label: TranslationKey }[] = [
  { key: 'boursier', label: 'sit.boursier' },
  { key: 'minima', label: 'sit.minima' },
  { key: 'cmi', label: 'sit.cmi' },
  { key: 'none', label: 'sit.none' },
];

export function hasActiveFilters(f: CatalogFilters): boolean {
  return !!(f.profil || f.freq || f.type || f.budget || f.situation);
}

/**
 * Une offre passe les filtres si elle satisfait CHAQUE groupe renseigné (ET entre groupes).
 * Sans filtre → tout le catalogue.
 */
export function planMatchesFilters(plan: Plan, f: CatalogFilters): boolean {
  const e = plan.eligibility ?? {};

  // Profil : âge représentatif dans la tranche + statut étudiant si requis
  if (f.profil) {
    const { age, student } = PROFIL[f.profil];
    if (e.minAge != null && age < e.minAge) return false;
    if (e.maxAge != null && age > e.maxAge) return false;
    if (e.studentOnly && !student) return false;
  }

  // Fréquence : la fréquence choisie tombe dans la plage d'usage conseillée de l'offre
  if (f.freq) {
    const days = FREQ_DAYS[f.freq];
    const r = plan.recommendedFor;
    if (r?.usageDaysPerWeekMin != null && days < r.usageDaysPerWeekMin) return false;
    if (r?.usageDaysPerWeekMax != null && days > r.usageDaysPerWeekMax) return false;
  }

  // Type : période exacte
  if (f.type && plan.period !== TYPE_PERIOD[f.type]) return false;

  // Budget : coût mensuel équivalent
  if (f.budget) {
    const m = plan.monthlyEquivalent;
    if (f.budget === 'low' && m > 50) return false;
    if (f.budget === 'mid' && (m <= 50 || m > 100)) return false;
    if (f.budget === 'high' && m <= 100) return false;
  }

  // Situation particulière
  if (f.situation === 'minima' && !e.meansTested) return false;
  if (f.situation === 'cmi' && !e.requiresCMI) return false;
  if (f.situation === 'boursier' && !e.studentOnly) return false; // réductions boursier = offres étudiantes (imagine R)
  if (f.situation === 'none' && (e.meansTested || e.requiresCMI)) return false;

  return true;
}
