import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config.js'

/**
 * Comptes de départ pour le développement / la démo.
 * Lancer avec : `bun run seed` (depuis apps/content) ou `make seed`.
 *
 * Idempotent : chaque compte est supprimé puis recréé.
 * Via le Local API, `overrideAccess` est `true` par défaut → on peut fixer les `roles`
 * (le contrôle d'accès qui réserve ce champ aux admins ne s'applique pas ici).
 */
const seedUsers: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  roles: ('admin' | 'user')[]
}[] = [
  {
    email: 'admin@idf.test',
    password: 'Admin1234!',
    firstName: 'Admin',
    lastName: 'IDF',
    roles: ['admin'],
  },
  {
    email: 'camille@idf.test',
    password: 'User1234!',
    firstName: 'Camille',
    lastName: 'Martin',
    roles: ['user'],
  },
  {
    email: 'sofiane@idf.test',
    password: 'User1234!',
    firstName: 'Sofiane',
    lastName: 'Benali',
    roles: ['user'],
  },
]

/**
 * Catalogue des offres IDFM (tarifs toutes zones 2026).
 * `eligibility` = conditions dures (bloquantes) ; `recommendedFor` = persona d'usage (reco).
 */
type Period = 'per-trip' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
const seedPlans: {
  name: string
  slug: string
  price: number
  period: Period
  zones?: string
  eligibility?: {
    minAge?: number
    maxAge?: number
    studentOnly?: boolean
    meansTested?: boolean
    requiresCMI?: boolean
  }
  recommendedFor?: {
    minAge?: number
    maxAge?: number
    usageDaysPerWeekMin?: number
    usageDaysPerWeekMax?: number
    profileLabel?: string
  }
}[] = [
  {
    name: 'imagine R Junior',
    slug: 'imagine-r-junior',
    price: 17.2,
    period: 'annual',
    eligibility: { minAge: 4, maxAge: 10, studentOnly: true },
    recommendedFor: { minAge: 4, maxAge: 10, usageDaysPerWeekMin: 5, usageDaysPerWeekMax: 7, profileLabel: 'Écolier (maternelle/primaire)' },
  },
  {
    name: 'imagine R Scolaire',
    slug: 'imagine-r-scolaire',
    price: 393.3,
    period: 'annual',
    eligibility: { minAge: 11, maxAge: 18, studentOnly: true },
    recommendedFor: { minAge: 11, maxAge: 18, usageDaysPerWeekMin: 5, usageDaysPerWeekMax: 5, profileLabel: 'Collégien / lycéen' },
  },
  {
    name: 'imagine R Étudiant',
    slug: 'imagine-r-etudiant',
    price: 393.3,
    period: 'annual',
    eligibility: { minAge: 18, maxAge: 26, studentOnly: true },
    recommendedFor: { minAge: 18, maxAge: 26, usageDaysPerWeekMin: 4, usageDaysPerWeekMax: 7, profileLabel: 'Étudiant' },
  },
  {
    name: 'Navigo Annuel',
    slug: 'navigo-annuel',
    price: 998.8,
    period: 'annual',
    recommendedFor: { minAge: 18, usageDaysPerWeekMin: 5, usageDaysPerWeekMax: 7, profileLabel: 'Actif, usage quotidien' },
  },
  {
    name: 'Navigo Mois',
    slug: 'navigo-mois',
    price: 90.8,
    period: 'monthly',
    recommendedFor: { minAge: 18, usageDaysPerWeekMin: 3, usageDaysPerWeekMax: 5, profileLabel: 'Usage régulier' },
  },
  {
    name: 'Navigo Semaine',
    slug: 'navigo-semaine',
    price: 32.4,
    period: 'weekly',
    recommendedFor: { minAge: 18, usageDaysPerWeekMin: 2, usageDaysPerWeekMax: 4, profileLabel: 'Courte durée / ponctuel' },
  },
  {
    name: 'Navigo Senior',
    slug: 'navigo-senior',
    price: 544.8,
    period: 'annual',
    eligibility: { minAge: 62 },
    recommendedFor: { minAge: 62, usageDaysPerWeekMin: 2, usageDaysPerWeekMax: 5, profileLabel: 'Retraité' },
  },
  {
    name: 'Navigo Liberté+',
    slug: 'navigo-liberte-plus',
    price: 2.04, // par trajet métro/RER (1,64 € bus/tram) — facturation mensuelle à l'usage
    period: 'per-trip',
    recommendedFor: { minAge: 18, usageDaysPerWeekMin: 1, usageDaysPerWeekMax: 2, profileLabel: 'Usage occasionnel' },
  },
  {
    name: 'Solidarité Transport (TST)',
    slug: 'solidarite-transport',
    price: 0, // réduction 50/75/100 % selon ressources — sur dossier
    period: 'monthly',
    eligibility: { meansTested: true },
    recommendedFor: { profileLabel: 'Bénéficiaire de minima sociaux' },
  },
  {
    name: 'Améthyste',
    slug: 'amethyste',
    price: 0, // attribution selon conditions CCAS / département
    period: 'annual',
    eligibility: { minAge: 60, meansTested: true, requiresCMI: true },
    recommendedFor: { minAge: 60, usageDaysPerWeekMin: 2, usageDaysPerWeekMax: 4, profileLabel: 'Senior revenus modestes / CMI' },
  },
]

async function seed(): Promise<void> {
  const payload = await getPayload({ config })

  for (const user of seedUsers) {
    // Supprime un éventuel compte existant avec le même email (idempotence)
    await payload.delete({
      collection: 'users',
      where: { email: { equals: user.email } },
    })

    await payload.create({
      collection: 'users',
      data: user,
    })

    payload.logger.info(`✓ Utilisateur créé : ${user.email} (${user.roles.join(', ')})`)
  }

  for (const plan of seedPlans) {
    await payload.delete({ collection: 'plans', where: { slug: { equals: plan.slug } } })
    await payload.create({ collection: 'plans', data: { ...plan, active: true } })
    payload.logger.info(`✓ Offre créée : ${plan.name} (${plan.price}€)`)
  }

  payload.logger.info(`Seed terminé : ${seedUsers.length} comptes, ${seedPlans.length} offres.`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed échoué :', err)
    process.exit(1)
  })
