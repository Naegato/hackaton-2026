# Brief Projet — Application Mobilité Île-de-France (Gestion d'abonnements)

## Contexte

Application mobile permettant aux utilisateurs de gérer leurs différents abonnements de transport en Île-de-France, avec un système de recommandation basé sur des comparatifs chiffrés.

**Approche mobile first** : l'expérience mobile est la priorité de conception. L'interface, les parcours utilisateur et les performances sont pensés d'abord pour le mobile (écrans tactiles, contraintes réseau, usage en mobilité). Toute version web éventuelle est secondaire et dérivée de l'expérience mobile.

## Objectif principal

Centraliser la gestion des abonnements de transport (utilisateur + proches), permettre le transfert d'abonnement entre comptes, et recommander l'offre la plus pertinente via un comparatif statistique.

## Fonctionnalités clés

### Authentification et compte
- Inscription / connexion sécurisée (email + mot de passe, JWT access + refresh token)
- Réinitialisation de mot de passe
- Gestion du profil utilisateur
- Suppression de compte (droit à l'oubli RGPD)
- Un compte peut gérer plusieurs abonnements : le sien et ceux de ses proches

### Gestion des abonnements
- Lister les abonnements disponibles
- Afficher le détail d'un abonnement
- Souscrire, renouveler, résilier un abonnement
- Historique des abonnements
- Transfert d'un abonnement (avec ses informations) vers un autre compte

### Comparatif et recommandation
- Écran de comparaison entre plusieurs abonnements avec chiffres et statistiques
- Mise en avant de l'abonnement le plus pertinent selon l'usage de l'utilisateur

### Notifications
- Expiration imminente d'un abonnement
- Renouvellement
- Transfert reçu ou effectué

## Contraintes techniques

- Architecture backend déployée avec **Docker Swarm** pour le load balancing
- API versionnée (ex. `/api/v1/`)
- Environnements distincts : dev / staging / production
- CI/CD à mettre en place
- Monitoring et alerting (à définir : Sentry, Grafana, etc.)
- Stratégie de backup base de données

*Stack mobile et backend non encore figée — à proposer et documenter.*

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
- Gestion sécurisée des sessions (expiration, refresh token)
- Tests de sécurité (OWASP)

## Points à clarifier avant développement

- Source des données d'abonnements (API officielle IDFM, saisie manuelle, autre ?)
- Règles précises du transfert d'abonnement (délai, limite de transferts, révocation possible ?)
- Paiement intégré dans l'app ou redirection vers la plateforme IDFM ?
- Gestion des proches mineurs (compte rattaché à un adulte ?)
- Désignation d'un DPO (Délégué à la Protection des Données)

## Livrables attendus

- Backend API (versionné, sécurisé, déployé en Docker Swarm)
- Application mobile (à définir : React Native / Flutter / natif)
- Documentation technique et runbook de déploiement
- Suite de tests (unitaires, intégration, end-to-end, charge, accessibilité, sécurité)

## Définition de fait (Definition of Done)

- Code testé (unitaire + intégration)
- Conformité RGPD et RGAA validée
- Documentation à jour
- Déployé en staging et validé avant mise en production
