# hackaton-2k26

Application mobile de **gestion d'abonnements de transport Île-de-France** (IDFM) : gérer ses abonnements et ceux de ses proches, transférer un abonnement entre comptes, recommander l'offre la plus pertinente.

## Règles du projet

- **Toujours consulter le brief avant chaque prompt** : lire [brief-projet-idf-mobilite.md](brief-projet-idf-mobilite.md) au début de chaque tâche pour cadrer le contexte produit, les contraintes (RGPD, RGAA, sécurité) et les choix techniques attendus.
- Projet **mobile first** : prioriser l'expérience mobile dans toute décision de conception.
- **bun uniquement** (pas npm/pnpm/yarn). `make` orchestre les tâches courantes.

## Structure (monorepo Turborepo)

- [apps/application/](apps/application/) — front **Expo / React Native** (expo-router). Routes dans `app/`, alias `@/*` → racine.
- [apps/content/](apps/content/) — backend **Next.js 16 + Payload CMS 3.85** sur **MongoDB**. Admin sur `/admin`, API REST/GraphQL auto-générées. Voir le skill Payload dans `.claude/skills/payload/`.
- [packages/docker/](packages/docker/) — `compose.yml` : **MongoDB 8.2** (27017) + **MailHog** (SMTP 1025, UI http://localhost:8025).

## Commandes

- `make up` — lance docker + content + app (tout-en-un)
- `make dev-content` / `make dev-app` — un seul service (backend sur :3000 / Expo)
- `make seed` — comptes + offres de démo (base démarrée requise)
- `make test` — tests d'intégration backend (vitest)
- `make .env` — crée les `.env` depuis les `.env.example`

Comptes de démo : `admin@idf.test` / `Admin1234!` (admin), `camille@idf.test` & `sofiane@idf.test` / `User1234!`.

## Conventions

- **Auth** : Payload natif (`Users` avec `auth: true`). Mobile = JWT dans le header `Authorization: JWT <token>`, stocké via `expo-secure-store` (fallback localStorage web). Inscription publique ; rôle `roles` réservé aux admins (anti-escalade). Sessions serveur activées → le logout invalide réellement le token.
- **Localization** : langues `fr` (défaut) / `en` / `es` / `zh` dans [apps/content/src/locales.ts](apps/content/src/locales.ts). Contenu `localized` servi via `?locale=`. Côté app, i18n UI dans [apps/application/lib/i18n.ts](apps/application/lib/i18n.ts) + `useLocale()` (choix persisté, dispo sans compte).
- **Accès Payload** : helpers dans [apps/content/src/access/roles.ts](apps/content/src/access/roles.ts) (`isAdmin`, `ownedBy`, …). Sécurité par ligne sur les abonnements (`managedBy`).
- **Tests int** : fichiers `tests/int/*.int.spec.ts` avec `// @vitest-environment node` (pas de jsdom), Local API + Mongo réel, nettoyage en `afterAll`.
- **Email** : adaptateur nodemailer → MailHog en dev. Toujours `bunx payload generate:types` après un changement de schéma.

## Modèle de données (Payload)

- `users` — comptes (email/password, firstName/lastName, roles).
- `plans` — catalogue d'offres (prix, période, zones, `eligibility` dure + `recommendedFor` persona). Endpoint `GET /api/plans/recommend` (filtre éligibles + désigne la recommandée par coût mensuel équivalent).
- `users.preferences` — année de naissance, statut, fréquence d'usage, tarif social ; `onboardingCompleted`. Accès self (`ownedBy('id')`).
- `subscriptions` — abonnement réel : `plan`, `managedBy` (lien **transférable**), infos titulaire **propres** (découplées du compte), `status`, dates, `transferHistory`.
- `transfer-requests` — transfert **avec acceptation** : le destinataire accepte → hook qui bascule `managedBy` + historise.
- globals `pages` localisés : `faq`, `help`, `terms`, `sales-terms`, `privacy`, `legal-notice`.

## Fait / à faire

- ✅ Auth (login, register, mot de passe oublié + reset via MailHog, invalidation de session)
- ✅ i18n (back + front, sélecteur de langue sans compte, vouvoiement partout)
- ✅ Abonnements transférables avec acceptation (+ tests)
- ✅ Onboarding (questionnaire ignorable) + préférences éditables dans le profil
- ✅ Éligibilité + recommandation d'offres (moteur + endpoint + tests) ; écran Offres avec badge « Recommandé »
- ⬜ Détail d'offre + souscription (réutilise le questionnaire)
- ⬜ Renouveler / résilier / historique d'abonnement
- ⬜ Notifications (expiration, transfert reçu/effectué)
- ⬜ Front : initier/accepter un transfert, afficher les pages localisées
- ⬜ Conformité RGPD/RGAA, suppression de compte, CI/CD, déploiement Docker Swarm
