# CLAUDE.md — Contexte du projet « Le Client Infernal »

> Ce fichier est rechargé automatiquement à chaque session Claude Code et partagé avec l'équipe via Git.
> Les parties « Cadre » à « Traçabilité des prompts » sont la référence du projet : ne pas les modifier sans accord de l'équipe.

## Cadre
Projet de 5 étudiants ingénieurs (ESPRIT, module « IA for Software Engineering », A.U 2026-2027). Livrables : code versionné sur GitHub, démo dans le navigateur, présentation des prompts utilisés, rapport technique. La note individuelle dépend des commits de chacun.

## L'application : « Le Client Infernal »
Plateforme web d'entraînement au recueil des besoins. L'étudiant joue l'ingénieur, un LLM joue un client fictif qui a une personnalité et un besoin caché. L'étudiant découvre ce besoin lors d'un entretien en chat, rédige un cahier des charges, gère des demandes de changement, puis il est évalué.

## Les 5 modules
1. client-generator (Khalil Abdelmoumen) : génère un scénario JSON (client fictif, personnalité, contexte, besoin exprimé, besoin caché, contraintes implicites) selon un domaine et un niveau.
2. interview (Kenza Baccar) : chat où le LLM joue le client et ne révèle le besoin caché que si les questions de l'étudiant s'en approchent.
3. change-requests (Ismail Ismail) : génère des demandes de changement réalistes et évalue la réponse de l'étudiant (accepter, négocier, refuser).
4. requirements (Nadhem Hmida) : éditeur structuré du cahier des charges (exigences fonctionnelles, non fonctionnelles, user stories) et évaluation par le LLM selon une grille, en comparant au besoin caché.
5. dashboard (Aziz Louati) : historique, statistiques, recommandation du prochain scénario, espace enseignant.

Base commune : authentification avec rôles (STUDENT, TEACHER), layout, gestion des erreurs et service IA partagé.

## Stack
- Front-end : React (Vite) + React Router
- Back-end : Node.js + Express
- Base de données : PostgreSQL + Prisma (lancée en local avec docker-compose)
- Validation : Zod
- LLM : service abstrait avec fournisseurs interchangeables (claude, openai, ollama, mock)

## Contraintes obligatoires
- Aucune donnée personnelle brute envoyée au LLM : jamais le nom ni l'email de l'étudiant.
- Toute sortie du LLM est validée par un schéma Zod avant d'être utilisée ou affichée.
- Les erreurs d'appel au LLM sont gérées : timeout, quota dépassé (429), clé API absente, réponse invalide.
- Le besoin caché ne quitte jamais le serveur : il est exclu de toutes les réponses API envoyées au front-end.

## Conventions
- Identifiants du code en anglais ; documentation, commentaires et textes de l'interface en français.
- Chaque module reste dans ses propres dossiers. Un module ne modifie jamais le code d'un autre module ni la base commune sans le signaler.
- Branches : main (stable), develop (intégration), feature/<module> pour chaque membre. Commits au format conventionnel, par exemple : feat(interview): ajout de l'historique du chat.
- Si une demande contredit cette architecture, signale-le avant d'agir. Si une information manque, pose la question au lieu de l'inventer.

## Traçabilité des prompts
- Après chaque demande, ajoute une entrée dans le journal du module concerné, docs/prompts/<module>.md (numérotation P-M1-001, P-M2-001… selon le module) : numéro, date, auteur, module, prompt copié mot pour mot, résumé de ce que tu as produit (fichiers créés ou modifiés). Les demandes qui concernent la base commune ou tout le projet vont dans docs/prompts/JOURNAL.md (P-001, P-002…). _(Règle mise à jour le 2026-10-18 par le chef de projet, P-007 : un journal par module pour éviter les conflits Git.)_
- Laisse vide la rubrique « Modifications de l'équipe » : l'équipe la remplit elle-même.
- Les prompts système utilisés par l'application sont stockés dans le dossier prompts/ de chaque module, jamais écrits en dur dans le code.

---

## Mémo technique (pour Claude et l'équipe)

- Architecture détaillée, modèle de données et contrat d'API : `docs/ARCHITECTURE.md`.
- Langage : JavaScript ESM (Node ≥ 20.19), monorepo npm workspaces (`client/`, `server/`).
- Base commune serveur : `server/src/shared/` — base commune client : `client/src/shared/`.
- Modules : `server/src/modules/<module>/` et `client/src/modules/<module>/`, chacun avec son `README.md`.
- Appel au LLM : **toujours** via `callLLM()` de `server/src/shared/ai/` (jamais d'appel direct à un fournisseur). Prompts dans `server/src/modules/<module>/prompts/*.md`, réponses simulées dans `server/src/modules/<module>/mocks/*.mock.js`.
- Besoin caché : les champs `hiddenNeed` et `implicitConstraints` du scénario sont omis par défaut par Prisma ; pour les lire côté serveur, utiliser `getScenarioSecrets()` de `server/src/shared/db/scenarioSecrets.js`. Le middleware `responseGuard` les retire de toute réponse JSON par sécurité.
- Le schéma Prisma (`server/prisma/schema.prisma`) est partagé : toute modification passe par une migration (`npm run db:migrate -- --name <nom>`) et doit être signalée à l'équipe.
- Chaque membre a sa propre base PostgreSQL locale (Docker, port 5434).
- Rapport : `docs/rapport/Rapport_Client_Infernal.docx` est **généré** par `npm run rapport` (ne jamais le modifier à la main). Chaque module rédige sa section dans `docs/rapport/sections/5.x-<module>.md` ; captures dans `docs/rapport/captures/`.
