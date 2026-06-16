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

  payload.logger.info(`Seed terminé : ${seedUsers.length} comptes.`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed échoué :', err)
    process.exit(1)
  })
