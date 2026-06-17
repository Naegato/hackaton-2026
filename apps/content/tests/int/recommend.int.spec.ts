// @vitest-environment node
// Tests du moteur de recommandation : logique pure (unitaire) + endpoint via le Local API n'est pas testable ici,
// on teste donc la logique pure exhaustivement contre le catalogue réel.
import { describe, expect, it } from 'vitest'

import { ageFromBirthdate, isEligible, recommend, type PlanLike } from '@/lib/recommend'

// Sous-ensemble du catalogue réel (tarifs 2026)
const CATALOG: PlanLike[] = [
  { slug: 'imagine-r-junior', name: 'imagine R Junior', price: 17.2, period: 'annual', active: true, eligibility: { minAge: 4, maxAge: 10, studentOnly: true } },
  { slug: 'imagine-r-etudiant', name: 'imagine R Étudiant', price: 393.3, period: 'annual', active: true, eligibility: { minAge: 18, maxAge: 26, studentOnly: true } },
  { slug: 'navigo-annuel', name: 'Navigo Annuel', price: 998.8, period: 'annual', active: true },
  { slug: 'navigo-mois', name: 'Navigo Mois', price: 90.8, period: 'monthly', active: true },
  { slug: 'navigo-semaine', name: 'Navigo Semaine', price: 32.4, period: 'weekly', active: true },
  { slug: 'navigo-senior', name: 'Navigo Senior', price: 544.8, period: 'annual', active: true, eligibility: { minAge: 62 } },
  { slug: 'navigo-liberte-plus', name: 'Navigo Liberté+', price: 2.04, period: 'per-trip', active: true },
  { slug: 'solidarite-transport', name: 'TST', price: 0, period: 'monthly', active: true, eligibility: { meansTested: true } },
]

describe('ageFromBirthdate', () => {
  it('calcule l’âge à une date donnée', () => {
    const now = new Date('2026-06-17')
    expect(ageFromBirthdate('2000-01-01', now)).toBe(26)
    expect(ageFromBirthdate('2000-12-31', now)).toBe(25) // anniversaire pas encore passé
    expect(ageFromBirthdate(null, now)).toBeNull()
  })
})

describe('isEligible', () => {
  it('respecte les bornes d’âge', () => {
    const junior = CATALOG[0]
    expect(isEligible(junior, { age: 8, status: 'student' })).toBe(true)
    expect(isEligible(junior, { age: 12, status: 'student' })).toBe(false) // trop vieux
    expect(isEligible(junior, { age: undefined, status: 'student' })).toBe(false) // âge requis
  })

  it('exige le statut étudiant pour imagine R', () => {
    const etu = CATALOG[1]
    expect(isEligible(etu, { age: 22, status: 'student' })).toBe(true)
    expect(isEligible(etu, { age: 22, status: 'active' })).toBe(false)
  })

  it('réserve le tarif social aux bénéficiaires', () => {
    const tst = CATALOG[7]
    expect(isEligible(tst, { socialBeneficiary: true })).toBe(true)
    expect(isEligible(tst, { socialBeneficiary: false })).toBe(false)
  })

  it('laisse Navigo Mois ouvert à tous (aucune condition d’âge)', () => {
    const mois = CATALOG[3]
    expect(isEligible(mois, { age: 24, status: 'active' })).toBe(true)
    expect(isEligible(mois, { age: 70, status: 'retired' })).toBe(true)
  })
})

describe('recommend', () => {
  it('recommande Liberté+ pour un usage occasionnel', () => {
    const res = recommend(CATALOG, { age: 30, status: 'active', usageDaysPerWeek: 1 })
    expect(res.recommendedSlug).toBe('navigo-liberte-plus')
  })

  it('recommande le Navigo Annuel pour un usage quotidien', () => {
    const res = recommend(CATALOG, { age: 30, status: 'active', usageDaysPerWeek: 6 })
    // Annuel (≈83€/mois) < Mois (90,8€) pour un usage quotidien
    expect(res.recommendedSlug).toBe('navigo-annuel')
  })

  it('recommande imagine R Étudiant à un étudiant éligible', () => {
    const res = recommend(CATALOG, { age: 22, status: 'student', usageDaysPerWeek: 5 })
    expect(res.recommendedSlug).toBe('imagine-r-etudiant')
  })

  it('recommande le tarif social à un bénéficiaire (coût nul)', () => {
    const res = recommend(CATALOG, { age: 40, status: 'jobseeker', usageDaysPerWeek: 4, socialBeneficiary: true })
    expect(res.recommendedSlug).toBe('solidarite-transport')
  })

  it('exclut les offres non éligibles de la liste recommandable', () => {
    const res = recommend(CATALOG, { age: 30, status: 'active', usageDaysPerWeek: 5 })
    const senior = res.plans.find((p) => p.slug === 'navigo-senior')
    const etu = res.plans.find((p) => p.slug === 'imagine-r-etudiant')
    expect(senior?.eligible).toBe(false)
    expect(etu?.eligible).toBe(false)
    expect(res.recommendedSlug).not.toBe('navigo-senior')
  })
})
