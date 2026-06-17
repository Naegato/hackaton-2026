/**
 * Moteur d'éligibilité + recommandation d'abonnement (logique pure, testable).
 *
 * - Éligibilité : conditions DURES du plan (âge, statut étudiant, tarif social).
 * - Recommandation : parmi les offres éligibles, celle au **coût mensuel équivalent** le plus bas
 *   selon l'usage déclaré (occasionnel → Liberté+, quotidien → Annuel…).
 */

export type PlanLike = {
  slug: string
  name: string
  price: number
  period: 'per-trip' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  active?: boolean | null
  eligibility?: {
    minAge?: number | null
    maxAge?: number | null
    studentOnly?: boolean | null
    meansTested?: boolean | null
    requiresCMI?: boolean | null
  } | null
}

export type Profile = {
  age?: number | null
  status?: 'student' | 'active' | 'retired' | 'jobseeker' | 'other' | null
  usageDaysPerWeek?: number | null
  socialBeneficiary?: boolean | null
}

const WEEKS_PER_MONTH = 52 / 12

export function ageFromBirthdate(birthdate?: string | null, now: Date = new Date()): number | null {
  if (!birthdate) return null
  const d = new Date(birthdate)
  if (Number.isNaN(d.getTime())) return null
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export function isEligible(plan: PlanLike, profile: Profile): boolean {
  if (plan.active === false) return false
  const e = plan.eligibility ?? {}

  if (e.minAge != null && (profile.age == null || profile.age < e.minAge)) return false
  if (e.maxAge != null && (profile.age == null || profile.age > e.maxAge)) return false
  if (e.studentOnly && profile.status !== 'student') return false
  if (e.meansTested && !profile.socialBeneficiary) return false

  return true
}

/** Coût mensuel équivalent d'un plan pour un usage donné (en €/mois). */
export function monthlyEquivalentCost(plan: PlanLike, usageDaysPerWeek: number): number {
  switch (plan.period) {
    case 'monthly':
      return plan.price
    case 'annual':
      return plan.price / 12
    case 'quarterly':
      return plan.price / 3
    case 'weekly':
      return plan.price * WEEKS_PER_MONTH
    case 'per-trip': {
      // 2 trajets par jour de déplacement
      const tripsPerMonth = Math.max(0, usageDaysPerWeek) * 2 * WEEKS_PER_MONTH
      return plan.price * tripsPerMonth
    }
    default:
      return plan.price
  }
}

export type RecommendationResult = {
  recommendedSlug: string | null
  plans: {
    slug: string
    name: string
    price: number
    period: PlanLike['period']
    eligible: boolean
    monthlyEquivalent: number
  }[]
}

export function recommend(plans: PlanLike[], profile: Profile): RecommendationResult {
  // Usage par défaut si non renseigné : 3 j/sem (usage régulier) — n'affecte que l'estimation de coût
  const usage = profile.usageDaysPerWeek ?? 3

  const scored = plans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    eligible: isEligible(plan, profile),
    monthlyEquivalent: Math.round(monthlyEquivalentCost(plan, usage) * 100) / 100,
  }))

  const recommended = scored
    .filter((p) => p.eligible)
    .sort((a, b) => a.monthlyEquivalent - b.monthlyEquivalent)[0]

  return {
    recommendedSlug: recommended?.slug ?? null,
    plans: scored,
  }
}
