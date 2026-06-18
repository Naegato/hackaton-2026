import type { DocType, RecommendationResult } from './api';
import type { TranslationKey } from './i18n';

type Plan = RecommendationResult['plans'][number];
type Translate = (key: TranslationKey) => string;

/** Types de documents requis pour souscrire (clés), dérivés des conditions de l'offre. */
export function requiredDocumentTypes(plan: Plan): DocType[] {
  const e = plan.eligibility ?? {};
  const types: DocType[] = ['id', 'photo'];
  if (e.studentOnly) types.push('school');
  if (e.meansTested) types.push('income');
  if (e.requiresCMI) types.push('cmi');
  return types;
}

/** Conditions d'éligibilité lisibles, dérivées des critères de l'offre. */
export function eligibilityLines(plan: Plan, t: Translate): string[] {
  const e = plan.eligibility ?? {};
  const lines: string[] = [];
  if (e.minAge != null && e.maxAge != null)
    lines.push(`${t('elig.age')} : ${e.minAge}–${e.maxAge} ${t('elig.years')}`);
  else if (e.minAge != null) lines.push(`${t('elig.age')} : ${e.minAge}+ ${t('elig.years')}`);
  else if (e.maxAge != null) lines.push(`${t('elig.age')} : ≤ ${e.maxAge} ${t('elig.years')}`);
  if (e.studentOnly) lines.push(t('elig.student'));
  if (e.meansTested) lines.push(t('elig.social'));
  if (e.requiresCMI) lines.push(t('elig.cmi'));
  if (lines.length === 0) lines.push(t('elig.none'));
  return lines;
}

/** Documents requis pour souscrire, dérivés des conditions. */
export function requiredDocuments(plan: Plan, t: Translate): string[] {
  const e = plan.eligibility ?? {};
  const docs = [t('doc.id'), t('doc.photo')];
  if (e.studentOnly) docs.push(t('doc.school'));
  if (e.meansTested) docs.push(t('doc.income'));
  if (e.requiresCMI) docs.push(t('doc.cmi'));
  return docs;
}
