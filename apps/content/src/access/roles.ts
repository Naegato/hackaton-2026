import type { Access, FieldAccess } from 'payload'

type WithRoles = { id: string; roles?: string[] | null } | null

const getUser = (req: { user?: unknown }): WithRoles => req.user as WithRoles

export const isAdminFromUser = (user: WithRoles): boolean => user?.roles?.includes('admin') ?? false

/** Accès collection réservé aux admins. */
export const isAdmin: Access = ({ req }) => isAdminFromUser(getUser(req))

/** Accès champ (field-level) réservé aux admins. */
export const isAdminField: FieldAccess = ({ req }) => isAdminFromUser(getUser(req))

/** Accès réservé aux utilisateurs connectés. */
export const isAuthenticated: Access = ({ req }) => Boolean(getUser(req))

/**
 * Sécurité par ligne sur un champ relationnel vers `users`.
 * - admin : tout
 * - sinon : uniquement les documents où <field> == utilisateur courant
 */
export const ownedBy =
  (field: string): Access =>
  ({ req }) => {
    const user = getUser(req)
    if (!user) return false
    if (isAdminFromUser(user)) return true
    return { [field]: { equals: user.id } }
  }

/**
 * Sécurité par ligne quand l'utilisateur peut être sur l'un de plusieurs champs
 * (ex. émetteur OU destinataire d'un transfert).
 */
export const ownedByAny =
  (fields: string[]): Access =>
  ({ req }) => {
    const user = getUser(req)
    if (!user) return false
    if (isAdminFromUser(user)) return true
    return { or: fields.map((field) => ({ [field]: { equals: user.id } })) }
  }
