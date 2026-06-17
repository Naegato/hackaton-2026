# Brief Projet — Application Mobilité Île-de-France (Gestion d'abonnements)

## Contexte

Application mobile permettant aux utilisateurs de gérer leurs différents abonnements de transport en Île-de-France, avec un système de recommandation basé sur des comparatifs chiffrés.

**Approche mobile first** : l'expérience mobile est la priorité de conception. L'interface, les parcours utilisateur et les performances sont pensés d'abord pour le mobile (écrans tactiles, contraintes réseau, usage en mobilité). Toute version web éventuelle est secondaire et dérivée de l'expérience mobile.

## Objectif principal

Centraliser la gestion des abonnements de transport (utilisateur + proches), permettre le transfert d'abonnement entre comptes, et recommander l'offre la plus pertinente via un comparatif statistique.

## Fonctionnalités clés

### Authentification et compte
- Inscription / connexion sécurisée (email + mot de passe, JWT + sessions serveur, invalidation au logout)
- Réinitialisation de mot de passe
- Gestion du profil utilisateur
- Suppression de compte (droit à l'oubli RGPD)
- Un compte peut gérer plusieurs abonnements : le sien et ceux de ses proches
- Préférences de mobilité (année de naissance, statut, fréquence d'usage, éligibilité tarif social) collectées à l'onboarding et réutilisées pour la recommandation

### Gestion des abonnements
- Lister les abonnements disponibles
- Afficher le détail d'un abonnement
- Souscrire, renouveler, résilier un abonnement
- Historique des abonnements
- Transfert d'un abonnement (avec ses informations) vers un autre compte — **avec acceptation** du destinataire

### Internationalisation (i18n)
- Langues gérées : **français** (défaut), **anglais**, **espagnol**, **chinois** — extensible
- Le contenu éditorial (FAQ, CGU/CGV, mentions légales…) est servi par l'API selon la langue choisie
- Le choix de langue est disponible **avant connexion** et persiste entre les sessions

### Comparatif et recommandation
- **Questionnaire d'onboarding** (à la 1ʳᵉ connexion, **ignorable**) collectant les préférences ; modifiable ensuite dans le profil. Réutilisable pour la souscription (questions additionnelles).
- **Filtrage par éligibilité** : une fois les préférences connues, la liste n'affiche que les abonnements **éligibles** (conditions dures : âge, statut étudiant, tarif social) ; si le questionnaire est ignoré, **tout le catalogue** s'affiche.
- **Recommandation** de l'offre la plus pertinente par **coût mensuel équivalent** selon l'usage déclaré (occasionnel → Liberté+, quotidien → forfait annuel…), mise en avant par un badge « Recommandé ».
- Comparatif chiffré : prix par période + estimation €/mois.
- Catalogue d'offres (`plans`) portant deux dimensions : `eligibility` (dure, bloquante) et `recommendedFor` (persona d'usage).
- *Limites connues du calcul (à affiner) : usage supposé sur 52 semaines/an, 2 trajets/jour, plafond journalier de Liberté+ non pris en compte.*

### Notifications
- Expiration imminente d'un abonnement
- Renouvellement
- Transfert reçu ou effectué

## Contraintes techniques

- Architecture backend déployée avec **Docker Swarm** pour le load balancing
- API REST/GraphQL Payload sous `/api/` (versioning `/api/v1/` non retenu — routes Payload natives)
- Environnements distincts : dev / staging / production
- CI/CD à mettre en place
- Monitoring et alerting (à définir : Sentry, Grafana, etc.)
- Stratégie de backup base de données

**Stack figée** : mobile **Expo / React Native** (expo-router) ; backend **Next.js 16 + Payload CMS 3.85** sur **MongoDB** ; monorepo Turborepo géré avec **bun**. Détails dans le `CLAUDE.md` racine.

## Contraintes légales et conformité

- **RGPD** : politique de confidentialité, bandeau cookies, export et suppression des données personnelles, durée de conservation définie
- **RGAA** (niveau AA) : accessibilité mobile, compatibilité lecteurs d'écran (VoiceOver / TalkBack), contrastes et tailles de texte conformes
- CGU (Conditions Générales d'Utilisation)
- CGV (Conditions Générales de Vente)
- Mentions légales
- FAQ et page d'aide

## Sécurité

- Chiffrement des données sensibles
- Rate limiting et protection anti-abus
- Gestion sécurisée des sessions (expiration du token, sessions serveur, invalidation au logout)
- Tests de sécurité (OWASP)

## Points à clarifier avant développement

- Source des données d'abonnements (API officielle IDFM, saisie manuelle, autre ?)
- Règles fines du transfert : délai d'expiration de la demande, limite de transferts, révocation après acceptation ? (le principe « avec acceptation » est acté ; un seul transfert en attente par abonnement)
- Paiement intégré dans l'app ou redirection vers la plateforme IDFM ?
- Gestion des proches mineurs (compte rattaché à un adulte ?)
- Désignation d'un DPO (Délégué à la Protection des Données)

## Livrables attendus

- Backend API (sécurisé, déployé en Docker Swarm) — Next.js + Payload CMS
- Application mobile — Expo / React Native
- Documentation technique et runbook de déploiement
- Suite de tests (unitaires, intégration, end-to-end, charge, accessibilité, sécurité)

## Définition de fait (Definition of Done)

- Code testé (unitaire + intégration)
- Conformité RGPD et RGAA validée
- Documentation à jour
- Déployé en staging et validé avant mise en production
