import type { DocStatus, DocType, PlanEligibility, RecommendationResult } from './api';
import type { TranslationKey } from './i18n';

type Plan = RecommendationResult['plans'][number];
type Translate = (key: TranslationKey) => string;

/** Types de documents requis pour souscrire (clés), dérivés des conditions de l'offre. */
export function requiredDocumentTypes(plan: Pick<Plan, 'eligibility'>): DocType[] {
  const e = plan.eligibility ?? {};
  const types: DocType[] = ['id', 'photo'];
  if (e.studentOnly) types.push('school');
  if (e.meansTested) types.push('income');
  if (e.requiresCMI) types.push('cmi');
  return types;
}

/**
 * Statut d'abonnement affiché à l'usager.
 * Un abonnement « en cours de validation » (pending) dont il manque un document requis
 * (absent ou refusé) est présenté comme « en attente des documents » : l'usager doit agir.
 * Une fois tous les documents fournis, il repasse en « en cours de validation » (côté staff).
 */
export type DisplayStatus = 'pending' | 'awaiting-documents' | 'active' | 'expired' | 'cancelled' | string;

export function subscriptionDisplayStatus(
  status: string,
  eligibility: PlanEligibility,
  docs: { type: DocType; status: DocStatus }[],
): DisplayStatus {
  if (status !== 'pending') return status;
  const byType = new Map(docs.map((d) => [d.type, d]));
  const needsDocuments = requiredDocumentTypes({ eligibility }).some((ty) => {
    const d = byType.get(ty);
    return !d || d.status === 'refused';
  });
  return needsDocuments ? 'awaiting-documents' : 'pending';
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
