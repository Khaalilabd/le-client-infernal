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

---

## P-002 — Auteur des commits avant le premier push

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (Git)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Attendez lorsque je vais push j'aimerai pas vour khaalilabd et claude (et on voit vos commit )
```

#### Échanges complémentaires (même demande)

L'IA a proposé trois choix pour l'auteur des commits. L'auteur a choisi « Khalil Abdelmoumen, même email ». Il a ensuite posé deux questions sur la publication, mot pour mot :

```text
vous êtes sur que vous avez push ou je dois le faire manuellement
```

```text
comment crer un depot vide
```

### Résumé de la production de l'IA

- Commit initial réécrit, alors qu'il n'avait pas encore été poussé : la ligne `Co-Authored-By` a été retirée et l'auteur est devenu « Khalil Abdelmoumen <khalilabdelmoumen7@gmail.com> ». La branche `develop` a été recalée sur `main`.
- Identité Git réglée pour ce dépôt seulement (`git config user.name` et `user.email`).
- Préférence mémorisée pour les prochaines sessions : aucune mention de l'assistant dans les commits.
- Rappel : GitHub rattache un commit à un compte par l'email. L'IA a confirmé qu'aucun push n'avait été fait et qu'aucun dépôt distant n'était configuré, puis a expliqué comment créer un dépôt GitHub vide et pousser `main` et `develop`. C'est l'auteur qui a fait le push.
- Aucun fichier du projet modifié.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-003 — Charte graphique, maquettes UI/UX et début du rapport

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (interface) + documentation (rapport)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
On devrait commecner a rédiger el rapport petit a petit car on a taper un prompt il nous faut une photo qui nous a fait générer l'architechture il nous faut des captures vous m'avez compris ou pas ?
```

#### Échanges complémentaires (même demande)

L'IA a reformulé la demande. Elle a signalé qu'elle ne peut pas faire de captures de l'écran de l'utilisateur, a proposé de préparer tout le reste, puis a demandé le format du rapport. Réponse de l'auteur, mot pour mot :

```text
Pdf  , ou world , mais maintenant puisque on est entrain de faire marcher le projet , on va commecner a préparer l'itnerface UIX et preparer l'architechture des modules ( je crois que c'est déja fait ) on a push et rédiger le rapport ce qu'on a fait et je vvais vous donner chacun d'entre nous qu'elle est son module
```

L'IA a ensuite vérifié que le push était bien fait. Elle a rappelé que la répartition des modules était déjà enregistrée dans `CLAUDE.md` et que l'architecture des modules existait déjà. Elle a ensuite proposé deux choix :
- Rapport : « Word (.docx) » (choisi), « PDF directement » ou « Les deux ».
- Interface : « Charte + maquettes » (choisi), « Améliorer l'interface commune » ou « Maquettes seulement ».

### Résumé de la production de l'IA

**Charte graphique et interface commune** (modifications de la base commune, signalées à l'équipe) :
- `client/src/styles.css` réécrit comme système de design : jetons (couleurs, typographie, espacements) et composants (boutons, badges, alertes, onglets, parcours de séance, jauges, fiche client, choix exclusif, note, chronologie, statistiques). Les noms de classes existants sont conservés, donc les pages des modules fonctionnent toujours.
- Nouveaux composants : `shared/layout/AuthLayout.jsx`, `shared/components/PageHeader.jsx`, `shared/components/EmptyState.jsx`.
- Mises à jour : `Layout.jsx` (logo, menu numéroté), `LoginPage.jsx`, `RegisterPage.jsx`, `HomePage.jsx` (parcours de séance), `ErrorMessage.jsx` (bouton « Réessayer » pour les erreurs temporaires de l'IA).
- Contrastes vérifiés par calcul (WCAG AA). Le gris 400 (2,5:1) a été retiré des libellés de texte.

**Maquettes** :
- `docs/ui/CHARTE.md` : charte, principes UX, accessibilité, correspondance entre composants et classes, écran par module.
- `docs/ui/maquettes/*.html` : 10 écrans (charte, connexion, accueil, M1, M2, M4 éditeur, M4 évaluation, M3, M5 étudiant, M5 enseignant) et `index.html`. Ils utilisent le vrai `styles.css`.
- `docs/ui/maquettes/png/*.png` : exports pleine page.

**Scripts** :
- `scripts/export-images.mjs` : export de pages HTML en PNG pleine page via Chrome ou Edge sans interface (protocole DevTools).
- `scripts/export-diagrams.mjs` : extraction des diagrammes Mermaid de `docs/ARCHITECTURE.md` et export en PNG.

**Rapport** :
- `docs/rapport/Rapport_Client_Infernal.docx` (version 0.1, 25 figures, 11 tableaux), avec :
  - page de garde, sommaire, introduction ;
  - chapitre 1 : présentation du projet ;
  - chapitre 2 : démarche IA, analyse de P-001 à P-003 ;
  - chapitre 3 : architecture, avec les diagrammes ;
  - chapitre 4 : UI/UX, avec les maquettes ;
  - chapitres 5 et 6 et conclusion : à compléter ;
  - annexe A : prompt P-001 intégral ; annexe B : liste des captures.
- 9 cadres « [CAPTURE N À INSÉRER] » à remplacer par les captures de l'équipe.
- `docs/rapport/README.md`, `docs/rapport/captures/README.md`, `docs/rapport/images/*.png` (6 diagrammes), `docs/rapport/diagrammes/*.html`.

**Corrections** :
- `docs/ARCHITECTURE.md` : erreur de syntaxe Mermaid dans le modèle de données (accents dans des étiquettes sans guillemets). Le diagramme ne s'affichait pas sur GitHub ; il est corrigé et les 6 diagrammes sont validés par l'analyseur Mermaid.
- `README.md` et `docs/ARCHITECTURE.md` : liens et arborescence mis à jour. `.gitattributes` : fichiers binaires déclarés.

**Vérifications** :
- `npm run build` (client) réussi.
- Rapport validé par le contrôle XSD de Word.
- Le rendu visuel du `.docx` n'a pas pu être contrôlé : ni Word ni LibreOffice ne sont installés sur la machine.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-004 — Publication du travail et préparation du prompt du module 1

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (Git) + client-generator (préparation)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Alors maintenant faisons un push de ce qu'on a fait et commence a améliorer  notre partie mais l'objectif c'est de laner un sseul script  pour voir si qu'il va faire , la base c'est le principe du prompt car je dois le mettre dans le rapport pour faire un résumé de chaque prompt ce qu'il a réaliser
```

#### Échanges précédents (questions sans production de fichiers)

```text
Comment je lance le projet ?
```

```text
COmment je fais pour tester un peu le projet ou rien n'est encore fait car la je me suis connecter avec les deux comptes
```

L'auteur a ensuite partagé le tableau officiel des 5 modules et demandé quel module prendre (« A vvotre avis je prend quelle module ? »). L'IA a recommandé le module 1 pour le chef de projet. Elle a aussi relevé les écarts entre le tableau officiel et le code généré : choix de la personnalité, compteur de questions, versions du cahier des charges, grille couverture/clarté/ambiguïtés, graphiques.

### Résumé de la production de l'IA

- Commit `feat(core): charte graphique, maquettes UI et rapport v0.1` (travail de P-003) sur `develop`, puis push sur GitHub.
- Rédaction d'un prompt unique et complet pour le module 1, à envoyer par le chef de projet comme entrée P-005 : cadrage, périmètre aligné sur le tableau officiel, contraintes, plan avant action, vérifications et résumé final destiné au rapport.
- Aucun code du module 1 modifié dans cette étape.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-005 — Module 1 client-generator : version complète (v0.2)

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet, responsable du module 1)
- **Module** : client-generator
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `feature/client-generator`

### Prompt

```text
Tu es le développeur du module 1 « client-generator » (responsable : Khalil Abdelmoumen). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/client-generator/README.md : lis-les avant de commencer.

Objectif : faire passer le module 1 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : choix du domaine, du niveau et de la personnalité ; stockage des scénarios.
- Rôle de l'IA : générer un scénario complet en JSON (client fictif, contexte, besoin exprimé, besoin caché, contraintes implicites).

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Génération
- L'étudiant choisit le domaine (saisie libre + liste de domaines suggérés), le niveau (débutant, intermédiaire, avancé) et la personnalité du client : une liste de profils prédéfinis (par exemple coopératif, pressé, méfiant, bavard, contradictoire, indécis) ou « aléatoire ».
- Le prompt système generate-scenario passe en version 0.2 : il respecte la personnalité choisie, gradue réellement la difficulté selon le niveau, garantit un besoin caché cohérent avec le contexte et découvrable par de bonnes questions, et évite les doublons en recevant les titres des scénarios déjà existants pour ce domaine.
- La réponse du LLM reste validée par un schéma Zod ; enrichis-le si nécessaire.

Stockage et consultation
- Liste des scénarios avec filtres (domaine, niveau, personnalité) et un état vide clair.
- Page de détail d'un scénario (version publique uniquement), avec le bouton « Démarrer une séance ».
- Suppression d'un scénario réservée à l'enseignant.

Interface
- Les pages respectent la maquette docs/ui/maquettes/03-m1-generateur.html et la charte : PageHeader, cartes, badges de niveau, états de chargement (« Génération… »), erreurs avec bouton « Réessayer », EmptyState.

Mode sans clé API
- Le mock du prompt generate-scenario produit des scénarios variés selon le domaine, le niveau et la personnalité choisis, pour que la démo soit crédible sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface.
- Ne modifie que server/src/modules/client-generator/ et client/src/modules/client-generator/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant. Privilégie les solutions sans migration (par exemple stocker le profil de personnalité dans le JSON personality).
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/client-generator à partir de develop.
- Ajoute des tests automatisés pour le module : validation du schéma, mock conforme, absence du besoin caché dans les réponses des endpoints du module.
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 1 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(client-generator): … », puis pousse la branche feature/client-generator, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-005 dans docs/prompts/JOURNAL.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.
```

#### Échanges complémentaires (même demande)

L'IA a présenté son plan et posé deux questions : que faire d'un scénario déjà utilisé lors de sa suppression, et qui a le droit de générer des scénarios. Réponse de l'auteur, mot pour mot :

```text
Faîtes cequi convient le mieux
```

Choix appliqués : la suppression est refusée (409) si des séances utilisent le scénario ; la génération est ouverte aux étudiants et aux enseignants.

En cours de route, l'IA a signalé que les tests communs du service IA dépendaient du prompt du module 1 et a demandé comment corriger. Option choisie par l'auteur : « Découpler les tests (Recommandé) ».

### Résumé de la production de l'IA

Voir le résumé détaillé ci-dessous, rédigé pour le rapport.

1. **Demandé** : version complète du module 1, avec choix du domaine, du niveau et de la personnalité, prompt v0.2, filtres, page de détail, suppression par l'enseignant, interface conforme à la maquette, mock varié, tests, documentation et traçabilité.
2. **Réalisé** :
   - 6 profils de personnalité plus « aléatoire » (tiré au sort par le serveur) ;
   - 12 domaines suggérés ;
   - prompt v0.2 avec des fragments de règles par niveau ;
   - validation Zod renforcée : besoin caché différent du besoin exprimé, nombre de contraintes implicites selon le niveau ;
   - endpoints `/options` et `DELETE` (avec refus 409 si le scénario est utilisé), filtre par personnalité sans migration (JSON) ;
   - interface : formulaire avec cartes de profils, filtres, page de détail, états de chargement, d'erreur et vide ;
   - mock avec 5 familles de domaines, un mode générique, 6 profils et 3 niveaux.
3. **Fichiers** : le détail est dans le README du module ; 10 commits sur `feature/client-generator`.
4. **Vérifications** :
   - 31 tests sur 31 réussis : 18 nouveaux tests du module (dont le mock pour 108 combinaisons et les endpoints sur une vraie base) et les 13 tests communs ;
   - build du client réussi ;
   - endpoints appelés via le serveur de développement ;
   - écrans capturés dans Chrome sans interface (génération par l'interface, page de détail vue par l'enseignant), sans erreur JavaScript.
5. **Problèmes et corrections** :
   - les tests communs utilisaient le prompt du module 1 : ils ont été découplés avec l'accord de l'auteur (base commune, commit `test(core)`) ;
   - le mock générique ne mentionnait pas le domaine demandé : corrigé.
6. **Limites** : le prompt v0.2 n'a pas été testé avec un vrai LLM, faute de clé API ; la variété du mock reste limitée (2 situations par famille) ; pas de pagination.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-006 — Captures d'écran et rapport v0.2

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : documentation (rapport) + client-generator (section 5.1)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Je viens de réaliser tout les captures sur le desktop , vérifiez ces captures et déplacer les dans leur emplacement et faîtes le nécéssaire
```

#### Échanges précédents (même sujet)

```text
La je dois faire quoi exactement qu'est ce qui manque pour que je dis mon module est totalement termineé et ma partie du rapport aussi
```

L'IA a listé ce qui restait : test du prompt v0.2 avec un vrai LLM, pull request, information de l'équipe, captures, section 5.1 du rapport, rubrique « Modifications de l'équipe ».

```text
Donc la on va prendre les captures c'est CA , e problléme je sais pas qu'elle capture prendre
```

L'IA a généré elle-même les 5 captures de l'application, avec Chrome sans interface et les comptes de démonstration : connexion, accueil, maquette, écrans du module 1. Elle a ensuite donné la liste précise des 11 captures restantes (où les prendre, quoi montrer, nom du fichier).

```text
Faut lancer l'application non ?
```

```text
petite question vite fait vous pouvez pass faire la capture d'écran des prompt et la réponse par vous même ?
```

L'IA a répondu qu'elle n'a pas accès à l'affichage de VS Code. Elle a déconseillé de fabriquer une image imitant l'interface (crédibilité de la démarche) et proposé à la place un export de la session, clairement présenté comme tel.

### Résumé de la production de l'IA

- **Vérification des 20 captures** du Bureau (`OneDrive\Desktop`) :
  - 19 sont conformes et ont été déplacées dans `docs/rapport/captures/` en `pXXX-NN-description-N.png`. Les deux fichiers mal nommés (`… .png .png`) ont été corrigés.
  - `p005-04-resume3.png` n'est pas utilisable : on y voit des chemins techniques et un message système, mais pas la fin du résumé. Elle est restée sur le Bureau.
  - Il manque encore `p001-04-arborescence`, `p001-05-tests` et `p001-07-github`.
- **Captures générées par l'IA** (application réelle) : `p001-06-application-connexion`, `p001-06-application-accueil`, `p003-02-maquettes-navigateur`, `p005-05-ecran-generateur`, `p005-06-ecran-detail-scenario`.
- **Rapport Word v0.2** (`docs/rapport/Rapport_Client_Infernal.docx`, 31 figures, 15 tableaux, validation XSD réussie) :
  - captures insérées automatiquement ; les 3 manquantes restent sous forme de cadre ;
  - prompts P-004 et P-005 ajoutés au tableau ;
  - nouvelles sections 2.7 (P-004) et 2.8 (P-005 : structure, déroulement, analyse critique) ;
  - section 5.1 du module 1 rédigée : fonctionnalités, endpoints, prompts, évolution v0.1 → v0.2, écrans, tests, difficultés, limites ;
  - chapitre 6 mis à jour (31 tests) et annexe B avec l'état de chaque capture.
- `docs/rapport/captures/README.md` mis à jour.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->
