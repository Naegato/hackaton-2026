import type { CollectionConfig } from 'payload'

import {
  canAccessAdminPanel,
  DEFAULT_ROLE,
  isAdminOrSelf,
  isAdminOnlyOrSelf,
  isSuperFieldLevel,
  ROLES,
} from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'roles', 'onboardingCompleted', 'createdAt'],
    group: 'Utilisateurs',
    description: 'Comptes utilisateurs — gestion des rôles et profils.',
  },
  auth: {
    // Durée de vie du JWT (en secondes). Le client peut le rafraîchir via /api/users/refresh-token
    tokenExpiration: 60 * 60 * 24 * 7, // 7 jours
    // Protection anti-bruteforce (cf. brief : rate limiting / OWASP)
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
    // Vérification de l'adresse email obligatoire avant la première connexion.
    // À la création, Payload met `_verified: false` et envoie cet email ; la connexion est bloquée tant que non vérifié.
    // Les comptes Google sont créés `_verified: true` (email déjà vérifié par Google), de même que les comptes de démo (seed).
    verify: {
      generateEmailHTML: (args) => {
        const token = (args as { token?: string } | undefined)?.token ?? ''
        const base = (process.env.APP_PUBLIC_URL || 'http://localhost:8081').replace(/\/$/, '')
        const verifyUrl = `${base}/verify-email?token=${token}`
        return `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <h2>Confirmez votre adresse email</h2>
            <p>Bienvenue sur IDF Mobilité ! Pour activer votre compte et pouvoir vous connecter, confirmez votre adresse email.</p>
            <p>
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#0a7ea4;color:#fff;border-radius:8px;text-decoration:none;">
                Confirmer mon adresse email
              </a>
            </p>
            <p>Ou copiez ce lien dans votre navigateur :<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p style="color:#888;font-size:13px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
          </div>
        `
      },
      generateEmailSubject: () => 'Confirmez votre adresse email — IDF Mobilité',
    },
    forgotPassword: {
      // Email envoyé lors d'une demande de réinitialisation.
      // Le lien pointe vers l'écran /reset-password de l'app (web mobile + natif via le même chemin),
      // base configurable via APP_PUBLIC_URL.
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const base = (process.env.APP_PUBLIC_URL || 'http://localhost:8081').replace(/\/$/, '')
        const resetUrl = `${base}/reset-password?token=${token}`
        return `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser le mot de passe de votre compte IDF Mobilité.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0a7ea4;color:#fff;border-radius:8px;text-decoration:none;">
                Choisir un nouveau mot de passe
              </a>
            </p>
            <p>Ou copiez ce lien dans votre navigateur :<br/><a href="${resetUrl}">${resetUrl}</a></p>
            <p style="color:#888;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `
      },
      generateEmailSubject: () => 'Réinitialisation de votre mot de passe — IDF Mobilité',
    },
  },
  access: {
    // Inscription publique : tout le monde peut créer un compte
    create: () => true,
    read: isAdminOrSelf,
    update: isAdminOnlyOrSelf,
    delete: isAdminOnlyOrSelf,
    admin: canAccessAdminPanel,
  },
  fields: [
    // email + mot de passe ajoutés automatiquement par `auth`
    {
      name: 'googleId',
      type: 'text',
      index: true,
      admin: { hidden: true },
      // Ne jamais exposer l'identifiant Google tiers dans les réponses REST
      access: { read: () => false },
    },
    {
      name: 'authProvider',
      type: 'select',
      label: 'Méthode de connexion',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Google', value: 'google' },
        { label: 'Apple', value: 'apple' },
      ],
      defaultValue: 'email',
      admin: { readOnly: true },
      // Le provider est fixé à la création, jamais modifiable par le client
      access: { update: () => false },
    },
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: [DEFAULT_ROLE],
      // 'user' conservé pour la rétrocompatibilité avec les comptes créés avant le RBAC
      options: [...ROLES, { label: 'Utilisateur (legacy)', value: 'user' }],
      saveToJWT: true,
      access: {
        create: isSuperFieldLevel,
        update: isSuperFieldLevel,
      },
    },
    // A-t-il rempli le questionnaire d'onboarding ? Pilote l'affichage du formulaire à la 1ʳᵉ connexion.
    {
      name: 'onboardingCompleted',
      type: 'checkbox',
      defaultValue: false,
    },
    // Préférences servant à l'éligibilité et à la recommandation d'abonnement. Modifiables par l'utilisateur.
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'birthdate',
          type: 'date',
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Élève / Étudiant', value: 'student' },
            { label: 'Actif', value: 'active' },
            { label: 'Retraité', value: 'retired' },
            { label: "En recherche d'emploi", value: 'jobseeker' },
            { label: 'Autre', value: 'other' },
          ],
        },
        {
          name: 'usageDaysPerWeek',
          type: 'number',
          min: 0,
          max: 7,
          admin: { description: 'Nombre de jours de trajet par semaine (déclaré)' },
        },
        {
          name: 'socialBeneficiary',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Bénéficiaire d’un tarif social (RSA, AAH, minima sociaux…)' },
        },
      ],
    },
  ],
}
