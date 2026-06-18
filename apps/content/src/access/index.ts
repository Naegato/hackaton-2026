import type { Access, FieldAccess, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

export const ROLES = [
  { label: 'Développeur', value: 'developer' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Gestionnaire Comutitres', value: 'comutitres_manager' },
  { label: 'Payeur', value: 'payer' },
  { label: 'Porteur de carte', value: 'cardholder' },
  { label: 'Sans abonnement', value: 'unsubscribed' },
] as const

export type Role = (typeof ROLES)[number]['value']

export const DEFAULT_ROLE: Role = 'unsubscribed'

export const SUPER_ROLES: Role[] = ['developer', 'admin']

export const STAFF_ROLES: Role[] = ['developer', 'admin', 'comutitres_manager']

export const hasRole = (user: User | null | undefined, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((role) => roles.includes(role as Role)))

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** developer + admin : lecture élargie, panel admin, édition des Pages. */
export const isAdmin: Access = ({ req: { user } }) =>
  hasRole(user as User | null, ...SUPER_ROLES)

/** admin uniquement : écriture sur les collections métier (Media, Users…). */
export const isOnlyAdmin: Access = ({ req: { user } }) =>
  hasRole(user as User | null, 'admin')

export const isStaff: Access = ({ req: { user } }) =>
  hasRole(user as User | null, ...STAFF_ROLES)

/** developer + admin peut lire tous les utilisateurs ; un user peut lire son propre profil. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  const u = user as User | null
  if (!u) return false
  if (hasRole(u, ...SUPER_ROLES)) return true
  return { id: { equals: u.id } }
}

/** admin seulement peut modifier/supprimer un autre utilisateur ; un user peut modifier son propre profil. */
export const isAdminOnlyOrSelf: Access = ({ req: { user } }) => {
  const u = user as User | null
  if (!u) return false
  if (hasRole(u, 'admin')) return true
  return { id: { equals: u.id } }
}

export const canAccessAdminPanel = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  hasRole(user as User | null, ...STAFF_ROLES)

/** admin uniquement : écriture sur les champs sensibles (roles, managedBy…). */
export const isSuperFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user as User | null, 'admin')