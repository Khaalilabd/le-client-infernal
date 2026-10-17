# Journal des prompts

Traçabilité des demandes faites à l'IA (Claude Code) pour le projet « Le Client Infernal ».
Chaque entrée contient : numéro, date, auteur, module, prompt copié mot pour mot, résumé de ce que l'IA a produit.
La rubrique « Modifications de l'équipe » est remplie par l'équipe elle-même.

## Modèle d'entrée

```markdown
## P-XXX — <titre court>

- **Date** : AAAA-MM-JJ
- **Auteur** : <nom>
- **Module** : <module ou « base commune »>
- **Outil / modèle** : <ex. Claude Code — Claude Opus 5.5>

### Prompt
<prompt copié mot pour mot>

### Résumé de la production de l'IA
<fichiers créés ou modifiés, décisions prises>

### Modifications de l'équipe
<à remplir par l'équipe>
```

---

## P-001 — Conception de l'architecture et génération de la base de code

- **Date** : 2026-10-17 (fin de génération le 2026-10-18)
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune + squelettes des 5 modules
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Tu es l'architecte logiciel de notre équipe. Nous démarrons un projet universitaire et ce dossier est vide. Ta mission : mémoriser le contexte du projet, concevoir l'architecture complète et générer la base de code, pour que chacun des 5 membres puisse ensuite faire un pull et travailler uniquement sur son module.

Avant de créer le moindre fichier, présente-moi ton plan (arborescence complète et liste des fichiers) et attends ma validation.

# PARTIE 1 — CONTEXTE DU PROJET (à enregistrer dans CLAUDE.md)

Crée à la racine un fichier CLAUDE.md qui reprend toute cette partie 1, pour que le contexte soit rechargé à chaque session et partagé avec l'équipe via Git.

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
- Après chaque demande, ajoute une entrée dans docs/prompts/JOURNAL.md : numéro (P-001, P-002…), date, auteur, module, prompt copié mot pour mot, résumé de ce que tu as produit (fichiers créés ou modifiés).
- Laisse vide la rubrique « Modifications de l'équipe » : l'équipe la remplit elle-même.
- Les prompts système utilisés par l'application sont stockés dans le dossier prompts/ de chaque module, jamais écrits en dur dans le code.

# PARTIE 2 — DOCUMENTATION D'ARCHITECTURE

Crée docs/ARCHITECTURE.md, réutilisable dans le rapport technique, avec :
- un diagramme Mermaid de l'architecture globale (front, back, base de données, service IA, fournisseur LLM) et l'explication de chaque couche ;
- l'arborescence du dépôt, en indiquant ce qui appartient à la base commune et à chaque module ;
- le modèle de données (Mermaid erDiagram), le module propriétaire de chaque table, et la circulation du scénario du module 1 vers les modules 2, 3, 4 et 5 ;
- le contrat d'API : endpoints REST par module (méthode, route, rôle autorisé, requête, réponse) ;
- le fonctionnement du service IA partagé ;
- les conventions Git et la méthode de travail en parallèle.

# PARTIE 3 — CODE DE LA BASE COMMUNE

Monorepo avec /client et /server :
- schéma Prisma complet (tables communes et tables de tous les modules), migration initiale, et script de seed avec des données de démonstration (un enseignant, deux étudiants, quelques scénarios déjà générés) pour que chaque membre puisse avancer sans attendre les autres ;
- authentification JWT (inscription, connexion, middleware de rôles), mots de passe hachés avec bcrypt ;
- gestion centralisée des erreurs côté serveur ;
- service IA partagé dans server/src/shared/ai/ : fonction commune d'appel au LLM, choix du fournisseur par variable d'environnement, timeout, nouvelle tentative en cas d'échec temporaire, messages d'erreur clairs, validation Zod de la réponse. Le fournisseur mock est utilisé par défaut quand aucune clé n'est configurée, pour que tout le monde puisse développer sans clé API ;
- côté client : layout avec un menu vers les 5 modules, pages de connexion et d'inscription, routes protégées, client HTTP commun ;
- .env.example, .gitignore, docker-compose.yml pour PostgreSQL, scripts npm pour installer et lancer le projet.

# PARTIE 4 — SQUELETTES DES 5 MODULES

Pour chaque module :
- côté serveur, server/src/modules/<module>/ avec routes, controller, service, schémas Zod et un dossier prompts/ contenant un premier brouillon du prompt système. Les routes sont déjà branchées sur l'application et un endpoint d'exemple fonctionne ;
- côté client, client/src/modules/<module>/ avec ses pages, ses composants et ses appels API. Une page d'accueil du module est accessible depuis le menu ;
- un README.md propre au module, qui explique à son responsable ce qu'il doit implémenter : fonctionnalités, endpoints prévus, tables utilisées, liste de tâches.

# PARTIE 5 — GIT ET FINALISATION

- README.md à la racine : présentation du projet, installation, lancement, répartition des modules par membre, conventions Git.
- Crée docs/prompts/JOURNAL.md et enregistre ce prompt comme entrée P-001.
- Initialise Git, crée les branches main et develop, et fais un premier commit. Ne fais pas de push : j'ajouterai moi-même le dépôt distant.
- Vérifie que le projet s'installe et démarre (serveur, client, base de données), corrige les erreurs éventuelles, puis termine par un résumé de ce qui a été créé et des instructions pour chaque membre après le pull.
```

#### Échanges complémentaires (même demande)

L'IA a présenté son plan, puis posé 4 questions : langage JS ou TS, auteur de P-001, modèle Claude par défaut, port PostgreSQL. Réponse de l'auteur, mot pour mot :

```text
1) Faîtes ce que vous vouelz 
2) Chacun va faire son moduel mais puisque je suis le chef de projet je dois d'abord rédiger un promp a l'id et le sauvegarder pour le rapport ( car c'est une matiére IA for software engineer pour voir les prompt  ) 
3) Peut importe comme model 
5) chachun aura sa bd normalement non ?
```

Pendant la génération, l'auteur a demandé une pause pour fermer Docker (« avez vous terminer tout car la j'ai besoin de fermer docker svp »). Il a ensuite relancé la suite avec « continuer ».

### Résumé de la production de l'IA

**Décisions d'architecture**
- JavaScript ESM (pas TypeScript), monorepo npm workspaces (`client`, `server`).
- Express 5, Prisma 6, Zod 4, React 19, Vite 7, React Router 7, bcryptjs, jsonwebtoken.
- Une base PostgreSQL locale par membre (Docker). Port **5434**, car 5432 et 5433 étaient déjà occupés sur la machine de l'auteur. Port modifiable via `DB_PORT`.
- Besoin caché protégé à trois niveaux : `omit` Prisma par défaut, `toPublicScenario()` et middleware `responseGuard`. `implicitConstraints` est aussi traité comme secret (choix à valider par l'équipe).
- Données personnelles : masquage automatique du nom, du prénom et de l'email de l'étudiant dans tout ce qui est envoyé au LLM.
- Fournisseur `auto` : claude, sinon openai, sinon mock selon les clés présentes. Les réponses simulées sont fournies par chaque module (`mocks/*.mock.js`).
- Registres de modules (serveur et client) pour qu'aucun membre n'ait à modifier la base commune pour brancher son module.

**Fichiers créés**
- Racine : `CLAUDE.md`, `README.md`, `package.json`, `docker-compose.yml`, `.gitignore`, `.gitattributes`, `.editorconfig`, `scripts/setup.mjs`.
- Documentation : `docs/ARCHITECTURE.md`, `docs/prompts/JOURNAL.md`.
- Serveur, base commune :
  - `server/package.json`, `server/.env.example` ;
  - `server/prisma/schema.prisma`, `server/prisma/migrations/<horodatage>_init/migration.sql`, `server/prisma/seed.js` ;
  - `server/src/index.js`, `server/src/app.js`, `server/src/config/env.js` ;
  - `server/src/shared/` : `ai/` (index, errors, promptLoader, sanitize, parseJson, providers/claude, openai, ollama, mock, http, index), `auth/`, `sessions/`, `db/`, `errors/`, `middleware/`, `serializers/` ;
  - `server/src/modules/index.js` ;
  - `server/tests/ai.test.js`, `server/tests/hidden-need.test.js`.
- Serveur, modules (pour chacun des 5) : `index.js`, `<module>.routes.js`, `.controller.js`, `.service.js`, `.schemas.js`, `prompts/*.md`, `mocks/*.mock.js`, `README.md`.
  - Prompts : `generate-scenario.md`, `client-reply.md`, `generate-change.md`, `evaluate-response.md`, `evaluate-document.md`, `recommend-scenario.md`.
- Client :
  - `client/package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css` ;
  - `src/shared/` : `api/http.js`, `api/sessions.js`, `auth/AuthContext.jsx`, `auth/ProtectedRoute.jsx`, `layout/Layout.jsx`, `components/` (Loader, ErrorMessage, SessionPicker), `pages/` (Login, Register, Home, NotFound) ;
  - `src/modules/index.js`, puis pour chaque module `routes.jsx`, `api.js`, `pages/<Module>HomePage.jsx`, `components/*.jsx`.

**Vérifications effectuées**
- `npm install` réussi. `npm test` : 13 tests passés (service IA, timeout, 429, clé absente, réponse invalide, masquage des données personnelles, besoin caché).
- PostgreSQL lancé avec Docker, migration `init` créée, seed exécuté.
- Tous les endpoints d'exemple testés avec curl (rôles, validation, erreurs, absence de `hiddenNeed` dans les réponses). Erreur `AI_MISSING_KEY` (503) vérifiée avec `AI_PROVIDER=claude` sans clé.
- Client : `vite build` réussi ; serveur de développement et proxy `/api` vérifiés.
- Correction apportée : port PostgreSQL 5433 → 5434 (conflit avec un autre projet local).
- Point signalé : faille `deepmerge-ts` dans l'outil CLI `prisma` (développement uniquement), correction possible seulement avec Prisma 7.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->
