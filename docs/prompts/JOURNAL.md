# Journal des prompts

Traçabilité des demandes faites à l'IA pour le projet « Le Client Infernal ».
Chaque entrée contient : numéro, date, auteur, module, prompt copié mot pour mot, résumé de ce que l'IA a produit.
La rubrique « Modifications de l'équipe » est remplie par l'équipe elle-même.

## Organisation des journaux (depuis P-007)

Pour que les 5 membres travaillent en parallèle sans conflit Git ni numéro en double, **chaque module a son propre journal** :

| Journal | Contenu | Numérotation |
|---|---|---|
| **Ce fichier** (`JOURNAL.md`) | Prompts qui concernent la base commune ou tout le projet | P-001, P-002… |
| [`client-generator.md`](client-generator.md) | Module 1 — Khalil Abdelmoumen | P-M1-001… |
| [`interview.md`](interview.md) | Module 2 — Kenza Baccar | P-M2-001… |
| [`change-requests.md`](change-requests.md) | Module 3 — Ismail Ismail | P-M3-001… |
| [`requirements.md`](requirements.md) | Module 4 — Nadhem Hmida | P-M4-001… |
| [`dashboard.md`](dashboard.md) | Module 5 — Aziz Louati | P-M5-001… |

Les prompts de départ de chaque module sont dans [`modeles/`](modeles/). Le mode d'emploi complet est dans [`docs/GUIDE_EQUIPE.md`](../GUIDE_EQUIPE.md).

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
- **Complément** : les 3 captures manquantes ont été ajoutées. La page des branches GitHub (dépôt public) a été capturée par l'IA. La sortie de `npm test` (31 tests sur 31) et l'arborescence (2 captures : serveur et client) ont été collées par l'auteur dans la conversation, puis rangées par l'IA. Le rapport a été régénéré : toutes les captures sont insérées, il ne reste plus aucun cadre « à insérer ».

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-007 — Guide de l'équipe et prompts de départ des modules 2 à 5

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (organisation de l'équipe)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `docs/guide-equipe` (créée depuis `feature/client-generator`)

### Prompt

```text
j'ai terminer mon module ? si oui je dois guider mon équipe pour qu'il travaille bien avec leur Modéle AI qui vvont utiliser je dois bien les guider
```

#### Échanges complémentaires (même demande)

L'IA a confirmé que le module 1 est terminé. Il reste des formalités : pull request, « Modifications de l'équipe », test avec une vraie clé.

Elle a ensuite signalé un problème. Avec un journal unique et une numérotation unique, cinq membres en parallèle créeraient des numéros en double et des conflits Git. Corriger cela imposait de modifier une règle de `CLAUDE.md`, d'où deux questions :
- Organisation du journal → choix de l'auteur : « Un journal par module (Recommandé) ».
- IA utilisées par l'équipe → choix de l'auteur : « Je ne sais pas, couvrir les plus courantes (Recommandé) ».

### Résumé de la production de l'IA

1. **Demandé** : guider l'équipe pour qu'elle travaille correctement avec ses propres assistants IA.
2. **Réalisé** :
   - `docs/GUIDE_EQUIPE.md` : démarrage et identité Git, règles d'or, contexte à donner selon l'outil, méthode en 6 étapes, premier prompt et suivants, vérification, journal et captures, coordination entre modules, Git, rapport, définition de « module terminé », FAQ.
   - `docs/prompts/modeles/` : un prompt de départ par module (M2 à M5), sur le modèle de P-005, aligné sur le tableau officiel.
   - Journaux par module : `docs/prompts/<module>.md`, numérotation P-M1-001…P-M5-001, avec un modèle d'entrée.
   - `AGENTS.md` (lu par Cursor, Codex…) et `.github/copilot-instructions.md` (lu par GitHub Copilot), qui renvoient vers `CLAUDE.md`.
3. **Fichiers modifiés** :
   - `CLAUDE.md` : règle de traçabilité (un journal par module ; signalé comme modification de la partie 1) ;
   - `JOURNAL.md` : index des journaux ;
   - `README.md` : lien vers le guide ;
   - `docs/ARCHITECTURE.md` : arborescence et conventions ;
   - `docs/rapport/captures/README.md` : nommage des captures ;
   - **dans les modules 1 à 5** : chemin du journal dans les en-têtes de prompts système (commentaires HTML, retirés avant l'envoi au LLM) et dans les listes de tâches des README. Aucun code des autres modules n'est modifié.
4. **Vérifications** : 31 tests sur 31 réussis. Affirmations du guide sur les outils relues : Gemini CLI ne lit pas `AGENTS.md` par défaut, le guide a été corrigé en conséquence.
5. **Points d'attention** :
   - la coordination M3/M4 sur les versions du cahier des charges et le calcul de `finalScore` sont à décider en équipe ;
   - la règle de `CLAUDE.md` a été modifiée par le chef de projet, l'équipe doit en être informée.
6. **Reste à faire** : fusionner `feature/client-generator` puis `docs/guide-equipe` dans `develop`, et présenter le guide à l'équipe.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-008 — Ordre de travail de l'équipe et coordination M3/M4

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (organisation, Git)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Qui doit travailler en premier
```

#### Échanges complémentaires (même sujet)

```text
La j'ai nadhem et ismail sur discord il doient faire quoi dîtes moi ce qu'il doivent faire
```

```text
Oui
```

### Résumé de la production de l'IA

- Constat : la pull request #2 avait été fusionnée dans `main` au lieu de `develop`. Le guide demandant de partir de `develop`, l'équipe serait partie d'une base sans le module 1 ni le guide.
- Ordre de travail proposé : tout le monde démarre en parallèle (mock, données de démonstration, registres de modules), après une réunion préalable entre Ismail (M3) et Nadhem (M4) sur les versions du cahier des charges. La migration est faite en priorité par Nadhem et fusionnée tôt, Aziz (M5) termine en dernier, et une seule migration de schéma est faite à la fois.
- Message Discord rédigé pour Ismail et Nadhem :
  - préparation ;
  - 4 décisions à prendre, avec une solution proposée : table `RequirementsDocumentVersion` propriété du M4, lue seulement par le M3, versions créées à la soumission puis après une demande acceptée ou négociée, liaison par `?changeRequest=<id>` et endpoints de lecture des versions ;
  - étapes après la réunion.
- Après l'accord de l'auteur (« Oui »), `develop` a été avancé jusqu'à `main` (avance rapide, sans réécriture) et poussé : les deux branches sont identiques (`2dde647`).

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-009 — Revue du module 4 et génération du rapport à partir de sections Markdown

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (revue de code, Git, rapport)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

> Note : le journal du module 4 proposait le numéro P-009 pour ses échanges de préparation. Ce numéro est pris ici ; ces échanges, s'ils sont tracés, prendront le numéro P-M4-003 dans `docs/prompts/requirements.md`.

### Prompt

```text
A ce que je vois mon camarade nadhem m'a dit qu'il a terminer pouvez vous vérifiez ce qu'il a fait du projet et est ce que il a bien réalier son module parfaitement et il a fait comme j'ai fait dans le rapport ?
```

#### Échanges complémentaires (même demande)

Après la revue, l'IA a posé 6 points. Réponse de l'auteur, mot pour mot :

```text
1) Corriger oui 
2) Oui j'ai valider 
3) Ok 
4) Faites le 
5) vous pouvez pas trouver une idée pour esayer de le récupérer les nouvelle donneé pour les mettre dans lel script ? 
6) On vera
```

### Résumé de la production de l'IA

1. **Revue du module 4 (Nadhem)** :
   - tests : 57 sur 57 réussis avec la vraie base, dont 26 du module 4 ; build réussi ;
   - migration conforme à la décision M3/M4 ;
   - besoin caché protégé, avec un refus automatique d'une évaluation qui le recopie ; `userId` transmis à l'IA ; validation Zod ; périmètre respecté ;
   - journal P-M4-001 et P-M4-002 complet ; section 5.4 du rapport sur le modèle de la 5.1 ; 10 commits conventionnels à son nom.
2. **Points relevés** :
   - PR #3 fusionnée dans `main` au lieu de `develop` ;
   - décisions déléguées à l'IA (« faire tout le module ») ;
   - captures du prompt, du plan et du résumé présentes seulement dans le Word ;
   - rapport modifié à la main dans Word, donc incompatible avec la génération par script ;
   - branche `change-requests` créée sans le préfixe `feature/`.
3. **Corrections** :
   - `develop` avancé jusqu'à `main` (avance rapide) ;
   - 12 captures du module 4 extraites du Word vers `docs/rapport/captures/` (reconnaissance par empreinte des images déjà présentes).
4. **Nouvelle méthode pour le rapport** :
   - générateur placé dans le dépôt (`scripts/rapport/generer-rapport.cjs`, commande `npm run rapport`, dépendances `docx` et `jszip`) ;
   - chaque module rédige sa section dans `docs/rapport/sections/5.x-<module>.md` (Markdown simple : titres, tableaux, captures, encadrés) ;
   - sections 5.1 et 5.4 converties automatiquement depuis le Word ; modèles créés pour 5.2, 5.3 et 5.5 ;
   - annexe B construite automatiquement à partir des captures utilisées ; chapitre 6 mis à jour (57 tests).
5. **Vérifications** :
   - rapport validé par le contrôle XSD de Word ;
   - comparaison paragraphe par paragraphe avec les originaux : section 5.1 identique ; section 5.4 de Nadhem identique (même texte, mêmes 16 images ; seules les légendes de figures en plusieurs parties ajoutent « (N captures successives) »).
6. **Documentation mise à jour** : `docs/rapport/README.md`, `docs/GUIDE_EQUIPE.md` (sections 10 à 12), `docs/rapport/captures/README.md`, mémo technique de `CLAUDE.md`, arborescence de `docs/ARCHITECTURE.md`.
7. **Non fait, car ce contenu appartient à Nadhem** : la rubrique « Modifications de l'équipe » du journal M4 et la traçabilité de ses échanges de préparation.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-010 — Accompagnement de Kenza (module 2) et configuration de Kiro

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (organisation de l'équipe)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Elle utilise Kiro qui utilise claude sonnet
```

#### Échanges précédents (même sujet, sans production de fichiers)

```text
Alors maintenant il reste le travail de kenza et ismail c'"est ca ?
```

L'IA a vérifié GitHub : il reste trois modules (Kenza M2, Ismail M3, Aziz M5), sans aucun travail poussé. La branche `change-requests` est vide et mal nommée. L'IA a rédigé un message de point d'avancement pour l'équipe.

```text
Kenza va traaviller elle a juste a coller ce prompt  c'est tout et sa lui fera ton travail ?
```

L'IA a répondu que le prompt lance le travail technique, mais que Kenza doit elle-même valider le plan, prendre les décisions, vérifier, faire les captures, écrire sa rubrique « Modifications de l'équipe » et rédiger sa section du rapport. Elle a donné une liste de 9 étapes.

### Résumé de la production de l'IA

- `.kiro/steering/projet.md` : fichier de règles chargé automatiquement par Kiro (`inclusion: always`). Il inclut `CLAUDE.md` (`#[[file:CLAUDE.md]]`) et rappelle les règles principales, dont la nouvelle règle du rapport.
- `docs/GUIDE_EQUIPE.md` (section 3) : ligne Kiro avec le mode agent, Autopilot désactivé pour relire chaque modification, et le nom de l'outil à noter dans le journal.
- Point d'attention : la syntaxe des fichiers de règles de Kiro peut évoluer selon sa version. Kenza doit vérifier dans Kiro (panneau « Steering ») que le fichier est bien chargé.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-011 — Prompt court pour le module 2 (Kenza)

- **Date** : 2026-10-18
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : organisation de l'équipe (module 2)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
je voudrai aidez kenez a envoyer un prompt direct pour que l'ia comprenne ce qu'il doti faire lire les fichier nécéssaire le projet et qu'il travail directe ce qu'elle a comme module a faire tout ssimplement
```

### Résumé de la production de l'IA

- Ajout d'une **version courte** en tête de `docs/prompts/modeles/prompt-m2-interview.md`. L'IA de Kenza :
  - lit les fichiers du projet (`CLAUDE.md`, guide, architecture, charte, README du module, module 1 comme exemple) ;
  - exécute le prompt détaillé du même fichier ;
  - présente un plan court et ses questions en une seule fois, puis réalise tout le module sans s'arrêter, sauf pour la base commune ;
  - termine par les tests, le journal P-M2-001, la section 5.2 du rapport, les commits, le push et le résumé en 6 points.
- Choix argumenté : une étape de validation du plan est conservée. Elle garantit que Kenza dirige l'IA, ce que le rapport et l'oral évaluent.
- La liste de ce que Kenza fait elle-même (captures, réponses, vérification, « Modifications de l'équipe », pull request) figure sous le prompt.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-012 — Revue et fusion des modules 2 (Kenza) et 3 (Ismail)

- **Date** : 2026-10-19
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : base commune (revue, intégration, schéma)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Rebonsoir , vérifiez grace au github a ce qui parrait nadhem a terminé , kenza , issmail aussi j'aimerai que vous vérifiez si il ont terminer leur module parfaitemenet et d'avoir un merge complet dans main et develop pour continuer a travailler car j'ai des nouveauté a vous donner c'est pour ce la
```

#### Échanges complémentaires (même demande)

Après la revue, l'IA a proposé trois options de fusion. Choix de l'auteur : « Je corrige puis je fusionne tout (Recommandé) ».

### Résumé de la production de l'IA

1. **État GitHub** :
   - Nadhem (M4) : rien de nouveau, déjà fusionné ;
   - Kenza : `feature/interview`, 5 commits ;
   - Ismail : branche `change-requests` (sans `feature/`), 1 commit « change-requests done » parti d'une ancienne version de `develop` ;
   - Aziz (M5) : rien.
2. **Revue de Kenza (M2)** :
   - fonctionnalités du tableau officiel réalisées ; protection forte du besoin caché ; journal complet avec « Modifications de l'équipe » ; section 5.2 et 17 captures ; 81 tests sur 81 sur sa branche ;
   - styles ajoutés dans `client/src/styles.css` (base commune, ajouts sans modification de l'existant), alors que le journal affirme « aucune modification de la base commune » ;
   - **défaut bloquant** : la fin d'entretien passait la séance à `COMPLETED`.
3. **Revue d'Ismail (M3)** :
   - endpoint `respond` correct (propriétaire, une seule réponse, Zod, `userId`) ; limite de 3 demandes ; lecture du cahier des charges du M4 ; badge des demandes en attente ;
   - **manques** : tests jamais lancés par lui ; pas de lien vers les versions du M4 (bouton « Mettre à jour le cahier des charges ») ; protection du besoin caché superficielle (recherche des seuls mots « besoin caché ») ; pas de section 5.3 ni de captures ; « Modifications de l'équipe » vide ; ancienne page `ChangeRequestsHomePage.jsx` laissée en place ; un seul commit non conventionnel.
4. **Intégration** (branche locale) : avance rapide sur Kenza, fusion d'Ismail sans conflit. Résultat : 2 tests en échec, qui révélaient en pratique le blocage de séance.
5. **Corrections** :
   - module 2 : table `InterviewSummary` et migration `ajout_synthese_entretien`, la séance reste en cours, endpoint `/summary`, interface (voir P-M2-002) ;
   - tests des modules 2 et 3 isolés sur des séances dédiées, supprimées à la fin (exécution parallèle de `node --test`) ;
   - documentation : `docs/ARCHITECTURE.md` (modèle de données, propriétaires, endpoints), README M2, section 5.2 (passages devenus inexacts + paragraphe sur la correction), chapitre 6 du rapport (117 tests) ;
   - diagramme du modèle de données régénéré, rapport régénéré.
6. **Vérifications** : 117 tests sur 117 réussis deux fois de suite (base 13, M1 18, M2 26, M3 34, M4 26) ; build réussi ; diagrammes Mermaid valides ; rapport validé par le contrôle XSD de Word (54 figures).
7. **Reste à faire** :
   - Ismail : lien M3 → M4, vraie protection du besoin caché, captures, section 5.3, « Modifications de l'équipe », suppression de l'ancienne page ;
   - Kenza : relire la correction (P-M2-002) ;
   - Aziz : tout le module 5.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-013 — Fournisseur IA compatible OpenAI (Gemini gratuit) : variable OPENAI_BASE_URL

- **Date** : 2026-10-24
- **Auteur** : Nadhem Hmida (module 4)
- **Module** : base commune (service IA partagé) — **modification signalée à l'équipe**
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : feature/requirements

### Prompt

```text
est ce que je doit avoir une cle api?
```

#### Échanges complémentaires (même demande)

```text
j ai pas la capacite de installer ollama on peux avec geminiai?
```

```text
note bien que je doit des cle api gratuite sans installer des model dans le pc car il eest faible a supporter ceci
```

```text
voici l cle que j ai
```

(Capture d'écran de Google AI Studio jointe. Elle n'est pas reproduite ici car elle montrait la clé en clair.)

```text
j ai fait ceci verifier
j ai fait verifier ceci
```

### Résumé de la production de l'IA

1. **Ce qui était demandé.** Tester le projet avec un vrai LLM, avec une clé API gratuite et sans modèle installé sur le PC : Gemini (Google AI Studio).
2. **Ce qui a été réalisé.**
   - Variable facultative `OPENAI_BASE_URL` : le fournisseur `openai` peut parler à toute API compatible OpenAI (Gemini, Groq, OpenRouter). Si la variable est vide, il garde l'adresse d'OpenAI : **aucun changement pour le reste de l'équipe**.
   - Réglage Gemini documenté dans `server/.env.example` (commentaire). La clé reste dans `server/.env`, ignoré par git, et a été collée par l'auteur lui-même : l'IA ne l'a ni recopiée ni affichée.
3. **Fichiers modifiés (base commune).** `server/src/shared/ai/providers/openai.js`, `server/src/shared/ai/providers/index.js`, `server/src/config/env.js`, `server/.env.example`, `server/tests/ai.test.js` (nouveau test de l'adresse utilisée).
4. **Vérifications effectuées et résultats.**
   - `npm test` : 69 tests sur 69 avant la fusion de `develop`.
   - Appels réels à Gemini, sur des données fictives, avec les prompts `match-requirements` et `evaluate-document` du module 4 : réponses conformes aux schémas Zod, aucune réponse refusée par le contrôle de fuite. Le matching reconnaît les synonymes (« téléphone portable » couvre « smartphone »), ce que le mock ne sait pas faire.
   - Temps de réponse : `gemini-3.8-flash` de 13 s à plus de 60 s (dépasse `AI_TIMEOUT_MS=30000`) ; `gemini-flash-lite-latest` environ 2 s par appel, avec le même matching. **Modèle conseillé : `gemini-flash-lite-latest`.**
5. **Problèmes rencontrés et corrections.**
   - `gemini-2.5-flash` : erreur 404, le modèle n'est plus proposé aux nouveaux comptes → liste des modèles disponibles consultée avec la clé, puis choix du modèle lite.
   - Erreur passagère 401/403 après plusieurs appels rapprochés (probablement le quota de l'offre gratuite) : le projet l'affiche « clé refusée » alors que la clé est valide (elle a refonctionné aussitôt après).
6. **Limites et ce qui reste à faire.**
   - L'offre gratuite de Gemini a un quota par minute et par jour ; Google peut utiliser les requêtes pour améliorer ses modèles (les données envoyées sont fictives et le nom et l'email de l'étudiant sont déjà masqués).
   - Avec le modèle lite, un commentaire d'évaluation a donné un indice sur le besoin caché sans le recopier : renforcement du prompt `evaluate-document` à prévoir (module 4).
   - L'auteur a montré sa clé dans une capture : la renouveler dans Google AI Studio après les tests.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-014 — Partie IA de chaque membre : techniques vues en cours

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : tout le projet (répartition, guide de l'équipe, rapport)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Alors ma prof nous a dit que chacun d'entre vous doit intégrer une partie AI n'importe ou mais on doit chacun appliquer une partie IA dans son travail pour l'ajouter au rapport et aussi il faudrait le minium utiliser une approche vue en cour regardez les chapitres je les mise ici dans le projet les cours jetez un oeil
```

Pièces jointes : le cours « Prompt Engineering » (PDF), et une capture des trois cours déposés à la racine du projet (« Prompt Engineering(1).pdf », « Seance 3_Generation_du_code.pptx », « Séance 4.pptx »).

### Résumé de la production de l'IA

1. **Lecture des trois cours** :
   - Prompt Engineering : anatomie d'un prompt ; techniques avancées (Priming, Least-to-most, Self-consistency, Knowledge generation, Zero/One/Few-shot, Chain-of-Thought) ; sortie structurée ; risques et checklist d'un prompt « safe » ;
   - Séance 3 : génération du code (4 composants d'un prompt, Chain-of-Thought pour le code, itération, vérification avant merge) ;
   - Séance 4 : fine-tuning, LoRA/QLoRA, RAG, RAFT, quantization, pruning, intégration d'une API IA.
2. **Analyse des prompts existants** des 5 modules : rôle, sortie JSON et Zod, et itération sont déjà présents partout. Le matching de Nadhem (P-M4-003) applique déjà Least-to-most.
3. **Répartition** : une technique principale différente par membre, pour que le rapport couvre le cours :
   - M1 (Khalil) : RAG ;
   - M2 (Kenza) : Chain-of-Thought + Few-shot + défense contre le prompt injection ;
   - M3 (Ismail) : Self-consistency ;
   - M4 (Nadhem) : Least-to-most, déjà réalisé, à présenter ;
   - M5 (Aziz) : Few-shot + données anonymisées.

   Fine-tuning, LoRA/QLoRA, RAFT et pruning sont exclus : il faudrait un GPU et un jeu de données.
4. **Fichiers** :
   - `docs/PARTIE_IA.md` (créé) : cours de référence avec les pages, répartition, contenu attendu dans le rapport, détail par membre, prompts prêts à coller pour Kenza (P-M2-003), Ismail (P-M3-003) et Nadhem (P-M4-004) ;
   - `docs/prompts/modeles/prompt-m5-dashboard.md` : technique Few-shot et sous-section du rapport ajoutées au prompt de départ d'Aziz ;
   - `docs/rapport/sections/5.5-dashboard.md` : sous-section « Technique d'IA du cours appliquée » ajoutée au modèle ;
   - `docs/GUIDE_EQUIPE.md` : cette sous-section devient obligatoire, avec un lien vers `docs/PARTIE_IA.md`.
5. **Validation** : l'auteur a validé la répartition en demandant la réalisation de sa propre partie (P-M1-001). Les fichiers ont été committés et poussés le 2026-10-25 ; les cours ne sont pas versionnés.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-015 — Finalisation : tous les modules avec leur partie IA, fin de séance et rapport complet

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : tout le projet (modules 3, 4 et 5, base commune, rapport) — **modifications de la base commune et du schéma signalées à l'équipe**
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
On est presque a la derniére étape non ? Je dois avoir tout les modules ready et parfaitement fait et surtout avec leur partie AI qu'on a parler hier  , avec le rapport complet on peut terminer ceci ?
```

#### Échanges complémentaires

Message précédent du chef de projet, qui a déclenché la revue du module 5 :

```text
Regardez ce qu'il y'a de nouveau fait dans le projet
```

L'IA a constaté qu'Aziz avait poussé `feature/dashboard` (5 commits). Elle a lancé ses tests avec la base de données et relevé plusieurs problèmes :
- les tests d'intégration étaient ignorés en silence ;
- 12 tests sur 34 échouaient une fois exécutés ;
- erreurs 404 transformées en 500 ;
- personnalités et domaines inexistants dans la recommandation ;
- classes CSS absentes de la charte ;
- graphiques et écrans enseignant manquants.

Elle a recommandé de fusionner la branche telle quelle, pour conserver les commits d'Aziz, puis de corriger par-dessus.

### Résumé de la production de l'IA

1. **Demandé** : terminer tous les modules avec leur partie IA (P-014) et un rapport complet.
2. **Réalisé** :
   - **Module 5** : branche d'Aziz fusionnée telle quelle, puis corrigée (P-M5-003) :
     - erreurs 404 ;
     - domaines et profils du module 1 ;
     - recommandation chargée séparément ;
     - interface selon les maquettes 08 et 09 (graphique de progression, compétences, bilan de séance, fiche étudiant, commentaires) ;
     - tests d'intégration réécrits et réellement exécutés ;
     - fichier personnel `Aziz_Louati_Work.md` retiré de la racine.
   - **Base commune** : fin de séance et note finale. `sessionScore.js` pondère l'entretien à 30 % (3 meilleures proximités), le cahier des charges à 50 % et les changements à 20 %. `PATCH /api/sessions/:id/status` exige un cahier évalué et refuse une séance déjà terminée.
   - **Module 1** : formulaire pré-rempli par la recommandation (P-M1-002).
   - **Module 3** : partie IA d'Ismail, Self-consistency (P-M3-003). L'IA évalue chaque réponse 3 fois, procède à un vote majoritaire et retient la note médiane. La décision attendue et les votes sont enregistrés (migration `ajout_auto_coherence_evaluation`) et affichés.
   - **Module 4** : lien « Bilan de la séance » après l'évaluation, et section 5.4 complétée avec P-M4-003, Least-to-most et le test Gemini (P-M4-004).
   - **Campagne finale** : parcours complet joué par l'API (3 séances, dont 2 terminées), puis vérifié dans le navigateur. Les captures ont été prises automatiquement.
   - **Rapport** :
     - sections 5.1 à 5.5 complétées ;
     - nouvelle section 2.9, qui présente les techniques du cours par module ;
     - nouvelle section 3.9, sur la note finale ;
     - chapitre 6 (répartition des tests, campagne finale) et conclusion rédigés ;
     - liste complète des prompts communs ;
     - captures « prompt et résumé » générées à partir du texte exact des journaux, et légendées comme telles.
3. **Fichiers** : voir les entrées P-M1-002, P-M3-003, P-M4-004 et P-M5-003. Également :
   - base commune : `server/src/shared/sessions/sessionScore.js` (créé), `sessions.service.js`, `server/tests/sessions.test.js` (créé) ;
   - schéma : `server/prisma/schema.prisma` et migration ;
   - documentation : `docs/ARCHITECTURE.md`, `docs/PARTIE_IA.md`, `docs/rapport/diagrammes/03-modele-de-donnees.html` et l'image associée, `scripts/rapport/generer-rapport.cjs`, `docs/rapport/captures/README.md`.
4. **Vérifications** :
   - `npm test` : **237 tests sur 237, aucun ignoré**, base lancée (base commune 30, M1 35, M2 35, M3 45, M4 37, M5 55) ;
   - `npm run build` réussi ;
   - rapport régénéré et validé : aucune capture manquante, aucun Markdown brut.
5. **Problèmes et corrections** :
   - les tests originaux du module 5, exécutés pour le diagnostic, avaient écrit 8 commentaires d'enseignant dans les séances de démonstration ; ils ont été supprimés de la base locale ;
   - une capture trop haute pour le Word a été coupée en deux ;
   - le graphique de progression faisait se chevaucher une étiquette et l'axe ; c'est corrigé.
6. **Limites et suite** :
   - en dehors du test Gemini du module 4, les prompts n'ont été vérifiés qu'en mode simulé ;
   - l'export CSV et les filtres de l'espace enseignant restent à faire ;
   - les rubriques « Modifications de l'équipe » restent à remplir par chaque membre ;
   - après le pull, chaque membre doit lancer `npm install && npm run db:deploy` ;
   - les données de la campagne finale (3 séances de l'étudiant de démonstration) sont conservées dans la base locale pour la démonstration.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-016 — Test de toute l'application avec un vrai LLM (Gemini) et corrections

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : tout le projet (base commune, modules 1 et 2, rapport) — **modifications de la base commune et du module 2 signalées à l'équipe**
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Peut on lancer le tesst icisi j'ai une cé geminie ?
```

#### Échanges complémentaires

Message précédent du chef de projet, auquel l'IA a répondu par un état honnête du projet : tout est livré, mais les prompts n'avaient été vérifiés qu'en mode simulé, sauf ceux du module 4 (P-013).

```text
Le projet est parfaitement terminée tout tout tout ?
```

Message suivant (la clé n'est pas reproduite) :

```text
voici la clé germinie : [clé masquée]
```

La clé a été écrite uniquement dans `server/.env`, exclu de Git (vérifié). Elle n'apparaît ni dans le code, ni dans ce journal, ni dans le rapport, ni dans les sorties des scripts. Elle a été transmise dans une conversation : elle est à renouveler dans Google AI Studio après les tests.

### Résumé de la production de l'IA

1. **Demandé** : lancer l'application avec Gemini et vérifier le parcours complet avec un vrai LLM.
2. **Réalisé** :
   - **Configuration** : `AI_PROVIDER=openai`, `OPENAI_BASE_URL` vers l'API compatible OpenAI de Gemini, `AI_MODEL=gemini-flash-lite-latest`, `AI_TIMEOUT_MS=60000`, `AI_EMBEDDING_MODEL=gemini-embedding-001`.
   - **Séance complète jouée par l'API** :
     - génération d'un client (Restauration, intermédiaire, méfiant) ;
     - entretien de 6 questions, dont une tentative de prompt injection ;
     - cahier des charges de 4 exigences ;
     - demande de changement négociée ;
     - fin de séance et recommandation.
   - **Résultats** :
     - 17 appels au LLM, sans erreur ni nouvelle tentative ;
     - réponses en 1,1 à 5,0 secondes ;
     - client resté dans son rôle, injection sans effet ;
     - cahier des charges hors sujet noté 0 sur 30 pour la couverture du besoin réel ;
     - 3 évaluations sur 3 concordantes ;
     - note finale 50,5 et recommandation par l'IA.
   - **Vérification des secrets** : les 16 endpoints de lecture de la séance ont été appelés avec les comptes étudiant et enseignant. Aucun ne renvoie le besoin caché, une contrainte implicite, une proximité ou un raisonnement, et `responseGuard` n'est jamais intervenu.
   - **Trois défauts corrigés** :
     - **Base commune, service IA** : Gemini refuse une conversation qui se termine par le modèle, d'où une erreur 400 sur la synthèse de l'entretien. `callLLM` ajoute désormais un dernier message de l'utilisateur.
     - **Base commune, service IA** : le modèle avait recopié une contrainte implicite. Après ce refus, chaque nouvelle tentative renvoyait la même requête, et le modèle refaisait la même erreur : 3 refus, puis une erreur 502. La nouvelle tentative transmet maintenant au modèle sa réponse et le motif du refus (champ et règle, jamais un secret).
     - **Module 2** : la question et la réponse, créées dans la même transaction, avaient la même date, et l'historique pouvait afficher la réponse avant la question. Les deux messages ont maintenant des dates distinctes, et le tri place la question en premier à date égale (P-M2-004).
   - **Module 1, calibrage du RAG** : les scores de `gemini-embedding-001` ont été mesurés (0,62 à 0,76 pour les bons blocs, 0,49 à 0,62 pour les autres). Une règle propre à ce modèle a été ajoutée (P-M1-003).
   - **Rapport** :
     - nouvelle section 6.4 « Test avec un vrai LLM (Gemini) », avec deux captures ;
     - les deux nouvelles règles du service IA (section 3.6) ;
     - limites des sections 5.1 à 5.5 mises à jour ;
     - nombre de tests, perspectives et conclusion mis à jour.
3. **Fichiers** :
   - base commune : `server/src/shared/ai/index.js`, `server/tests/ai.test.js` (2 tests), `server/.env.example` (exemple Gemini testé) ;
   - module 1 : `server/src/modules/client-generator/rag/retriever.js`, `tests/rag.test.js` (1 test), `README.md` ;
   - module 2 : `server/src/modules/interview/interview.service.js`, `tests/endpoints.test.js` (1 test), `README.md` ;
   - documentation : `docs/ARCHITECTURE.md`, `scripts/rapport/generer-rapport.cjs`, sections 5.1 à 5.5, captures `p016-01-entretien-gemini.png` et `p016-02-changement-gemini.png`.
4. **Vérifications** :
   - `npm test` : **241 tests sur 241, aucun ignoré**, base lancée (base commune 32, M1 36, M2 36, M3 45, M4 37, M5 55) ;
   - les tests d'intégration forcent le fournisseur simulé : le nombre d'appels à Gemini dans `AiCallLog` est le même avant et après `npm test` ;
   - rapport régénéré et validé.
5. **Problèmes et corrections** :
   - deux séances interrompues par les erreurs ci-dessus ont été supprimées de la base locale, avec leurs scénarios ;
   - la première capture de l'entretien montrait la réponse avant la question (défaut du module 2) et l'en-tête de page au milieu de l'image ; elle a été refaite après la correction.
6. **Limites et suite** :
   - une seule séance, un seul modèle, sur l'offre gratuite (quota par minute et par jour) ;
   - le commentaire d'évaluation du module 4 oriente encore vers le besoin caché, sans le recopier (limite déjà relevée en P-013) ;
   - `server/.env` reste configuré pour Gemini sur le poste du chef de projet ; `AI_PROVIDER=mock` rétablit le mode simulé.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->

---

## P-017 — Contrôle du projet selon la grille de validation et corrections

- **Date** : 2026-10-26
- **Auteur** : Khalil Abdelmoumen (chef de projet)
- **Module** : tout le projet (base commune, rapport, consignes de l'équipe) — **migration de la base commune signalée à l'équipe**
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5

### Prompt

```text
Vous êtes sur qu'on a terminer tout et tout sembe parfait ? voici la grille d'évaluation
```

La grille de validation « IA for Software Engineering » était jointe en image.

#### Échanges complémentaires

Après le bilan critère par critère de l'IA :

```text
Comencez a corriger ce que vous pouvez faire et faîtes moi le bilan ici
```

### Résumé de la production de l'IA

1. **Demandé** : comparer le projet à la grille, puis corriger ce qui relève du chef de projet.
2. **Constat** :
   - le rapport ne parlait ni d'éthique, ni de vulnérabilités, ni de refactoring, ni de productivité ;
   - les techniques d'optimisation étaient appliquées sans être présentées ;
   - les tokens n'étaient pas mesurés ;
   - `npm audit` signalait 4 failles graves ;
   - 30 rubriques « Modifications de l'équipe » sur 39 étaient vides ;
   - les commits étaient déséquilibrés (Ismail : 1 commit).
3. **Réalisé** :
   - **Failles** : body-parser 2.4.0, dont la version précédente permettait un déni de service sur chaque requête Express. Les 3 autres alertes (deepmerge-ts, outil Prisma en ligne de commande, développement seulement) sont analysées et documentées. Leur correction demande Prisma 7 ; une tentative de forcer la version corrigée n'a pas abouti proprement et a été annulée.
   - **Tokens** :
     - les fournisseurs renvoient `{ text, usage }` ;
     - `callLLM` et `embedTexts` additionnent les tokens de toutes les tentatives ;
     - `AiCallLog` les enregistre dans les colonnes `inputTokens` et `outputTokens` (migration `ajout_tokens_appels_ia`) ;
     - 2 tests ajoutés.
   - **Mesure avec Gemini** : une séance complète rejouée consomme 27 382 tokens en entrée et 4 058 en sortie, sur 15 appels. L'entretien représente 54 % des tokens en entrée. Aucun secret dans les 16 endpoints de lecture.
   - **Rapport** :
     - section 6.5 : anomalies trouvées par l'IA, vulnérabilités, recommandations de refactoring ;
     - chapitre 7 : performance et fiabilité, tokens, techniques d'optimisation de la note 2 de la grille, choix des modèles et des outils, limites éthiques et techniques ;
     - chapitre 8 : répartition et commits, gain de productivité mesuré, valeurs ajoutées ;
     - deux encadrés « À compléter » laissés aux membres : justification de leur outil, estimation du temps sans IA.
   - **Présentation** : `docs/presentation/Presentation_Client_Infernal.pptx`, 19 diapositives aux couleurs de la charte :
     - projet et architecture ;
     - méthode et anatomie du prompt P-001 ;
     - prompts de l'application ;
     - une diapositive par module, présentée par son responsable ;
     - Gemini, tokens, optimisation, anomalies, éthique, productivité, conclusion.
     
     Les notes de l'orateur proposent qui présente quoi. Le fichier a été généré par un script (pptxgenjs), puis rendu et relu diapositive par diapositive.
   - **Équipe** : `docs/prompts/modeles/taches-finales.md`, une tâche réelle par membre avec son prompt : campagne d'injection (Kenza), mesure de l'auto-cohérence (Ismail), prompt d'évaluation renforcé (Nadhem), cache de la recommandation (Aziz). Lien ajouté dans `docs/GUIDE_EQUIPE.md`.
4. **Fichiers** :
   - base commune : `server/prisma/schema.prisma` et migration, `server/src/shared/ai/index.js`, `embeddings.js`, `providers/claude.js`, `openai.js`, `ollama.js`, `server/tests/ai.test.js`, `server/tests/embeddings.test.js`, `package-lock.json` ;
   - documentation : `docs/ARCHITECTURE.md`, `docs/GUIDE_EQUIPE.md`, `docs/prompts/modeles/taches-finales.md`, `scripts/rapport/generer-rapport.cjs`.
5. **Vérifications** :
   - `npm test` : **243 tests sur 243, aucun ignoré**, base lancée ;
   - `npm audit` : il ne reste que la chaîne Prisma documentée ;
   - rapport régénéré : aucun Markdown brut, 2 encadrés « À compléter » volontaires.
6. **Limites et suite** :
   - après le pull : `npm install && npm run db:deploy` ;
   - Gemini n'indique pas les tokens des embeddings ;
   - les tâches des membres, leurs justifications et leurs estimations restent à faire ; les estimations sont à dire à l'oral sur la diapositive 18 ;
   - la présentation a été rendue avec LibreOffice : un dernier coup d'œil dans PowerPoint est conseillé, car les polices peuvent légèrement différer.

### Modifications de l'équipe

<!-- À remplir par l'équipe -->
