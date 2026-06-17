import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'
import { ageFromBirthdate, recommend, type Profile } from '../lib/recommend'

/**
 * Catalogue des offres d'abonnement IDFM (Navigo, imagine R, social…).
 *
 * Deux dimensions distinctes :
 *  - `eligibility` : conditions DURES (bloquantes) — qui a le DROIT de souscrire.
 *  - `recommendedFor` : persona d'usage (NON bloquant) — pour mettre en avant la bonne offre.
 *
 * Ex. Navigo Mois n'a aucune condition d'âge (éligible à tous) mais cible un usage régulier.
 * Lecture publique ; écriture réservée aux admins.
 */
export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'period', 'zones', 'active'],
    group: 'Abonnements',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  endpoints: [
    {
      // GET /api/plans/recommend — filtre les offres éligibles et désigne la recommandée.
      // Profil pris dans les query params (pour prévisualiser pendant l'onboarding) ; à défaut, dans les préférences du compte connecté.
      path: '/recommend',
      method: 'get',
      handler: async (req) => {
        const q = (req.query ?? {}) as Record<string, string | undefined>
        const prefs =
          (req.user as { preferences?: Record<string, unknown> } | null)?.preferences ?? {}

        const profile: Profile = {
          age: q.age != null ? Number(q.age) : ageFromBirthdate(prefs.birthdate as string | undefined),
          status: (q.status ?? (prefs.status as string | undefined)) as Profile['status'],
          usageDaysPerWeek:
            q.usageDaysPerWeek != null
              ? Number(q.usageDaysPerWeek)
              : (prefs.usageDaysPerWeek as number | undefined) ?? null,
          socialBeneficiary:
            q.socialBeneficiary != null
              ? q.socialBeneficiary === 'true'
              : Boolean(prefs.socialBeneficiary),
        }

        const { docs } = await req.payload.find({
          collection: 'plans',
          where: { active: { equals: true } },
          limit: 100,
          depth: 1, // peuple `image` (media) pour récupérer son URL
        })

        const result = recommend(docs, profile)
        // Métadonnées par offre pour la fiche info (image, zones, éligibilité)
        const metaBySlug = new Map(
          docs.map((d) => {
            const img = d.image
            const url = img && typeof img === 'object' && 'url' in img ? (img.url ?? null) : null
            return [d.slug, { image: url, zones: d.zones ?? null, eligibility: d.eligibility ?? null }]
          }),
        )
        const plans = result.plans.map((p) => ({ ...p, ...metaBySlug.get(p.slug) }))

        return Response.json({ profile, recommendedSlug: result.recommendedSlug, plans })
      },
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true, // profite de l'i18n déjà en place
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Illustration de l’offre (affichée en bandeau au-dessus de la carte)' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description:
          'Tarif en euros pour la période. Pour Liberté+ : prix au trajet. Pour les offres sur dossier (TST/Améthyste) : 0 + meansTested.',
      },
    },
    {
      name: 'period',
      type: 'select',
      required: true,
      defaultValue: 'monthly',
      options: [
        { label: 'Au trajet', value: 'per-trip' },
        { label: 'Hebdomadaire', value: 'weekly' },
        { label: 'Mensuel', value: 'monthly' },
        { label: 'Trimestriel', value: 'quarterly' },
        { label: 'Annuel', value: 'annual' },
      ],
    },
    {
      name: 'zones',
      type: 'text',
      defaultValue: '1-5',
      admin: { description: 'Zones couvertes, ex. "1-5"' },
    },
    {
      name: 'eligibility',
      type: 'group',
      label: 'Éligibilité (conditions dures, bloquantes)',
      admin: { description: 'Détermine qui a le droit de souscrire. Champs vides = aucune condition.' },
      fields: [
        { name: 'minAge', type: 'number', min: 0 },
        { name: 'maxAge', type: 'number', min: 0 },
        {
          name: 'studentOnly',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Réservé aux élèves / étudiants' },
        },
        {
          name: 'meansTested',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Soumis à conditions de ressources / dossier (TST, Améthyste)' },
        },
        {
          name: 'requiresCMI',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Nécessite une Carte Mobilité Inclusion (Améthyste)' },
        },
      ],
    },
    {
      name: 'recommendedFor',
      type: 'group',
      label: 'Recommandation (persona d’usage, non bloquant)',
      admin: { description: 'Sert à recommander l’offre la plus pertinente selon le profil/usage.' },
      fields: [
        { name: 'minAge', type: 'number', min: 0, admin: { description: 'Âge typique min' } },
        { name: 'maxAge', type: 'number', min: 0, admin: { description: 'Âge typique max' } },
        { name: 'usageDaysPerWeekMin', type: 'number', min: 0, max: 7 },
        { name: 'usageDaysPerWeekMax', type: 'number', min: 0, max: 7 },
        {
          name: 'profileLabel',
          type: 'text',
          admin: { description: 'Ex. "Actif temps plein", "Usage occasionnel", "Étudiant"' },
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Offre proposée aux utilisateurs' },
    },
  ],
}
