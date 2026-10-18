# Journal des prompts — Module 4 « Cahier des charges » (requirements)

**Responsable : Nadhem Hmida** · Numérotation : `P-M4-001`, `P-M4-002`… · Captures : `docs/rapport/captures/p-m4-NNN-XX-description.png`

Une entrée par demande faite à l'IA pour ce module : prompt copié **mot pour mot** et résumé de ce que l'IA a produit.
La rubrique « Modifications de l'équipe » est remplie par le responsable du module lui-même (ce qu'il a vérifié, corrigé ou décidé).
Les demandes qui concernent la base commune ou tout le projet vont dans [JOURNAL.md](JOURNAL.md).

## Modèle d'entrée

```markdown
## P-M4-XXX — <titre court>

- **Date** : AAAA-MM-JJ
- **Auteur** : Nadhem Hmida
- **Outil / modèle** : <ex. Claude Code — Claude Opus 5.5, Cursor, GitHub Copilot, ChatGPT…>
- **Branche** : feature/requirements

### Prompt
<prompt copié mot pour mot, dans un bloc ```text>

#### Échanges complémentaires
<questions de l'IA et réponses, mot pour mot>

### Résumé de la production de l'IA
1. Ce qui était demandé.
2. Ce qui a été réalisé.
3. Fichiers créés et modifiés.
4. Vérifications effectuées et résultats.
5. Problèmes rencontrés et corrections.
6. Limites et ce qui reste à faire.

### Modifications de l'équipe
<à remplir par le responsable du module>
```

---

## P-M4-001 — Module 4 complet : éditeur, évaluation par l'IA et versions successives

- **Date** : 2026-10-18
- **Auteur** : Nadhem Hmida
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : feature/requirements
- **Captures** : `p-m4-001-01-prompt.png`, `p-m4-001-02-plan.png`, `p-m4-001-03-resume.png` (à prendre)

### Prompt

Prompt de départ `docs/prompts/modeles/prompt-m4-requirements.md`, complété par la section 5 (décision commune M3/M4 validée par Ismail et le chef de projet), envoyé en un seul message :

````text
Tu es le développeur du module 4 « requirements » (responsable : Nadhem Hmida). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/requirements/README.md : lis-les avant de commencer. Le module 1 (client-generator) est terminé et sert d'exemple de structure (server/src/modules/client-generator/).

Objectif : faire passer le module 4 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : éditeur structuré du cahier des charges (exigences fonctionnelles, non fonctionnelles, user stories).
- Rôle de l'IA : comparer le cahier des charges au besoin caché et le noter selon une grille (couverture, clarté, ambiguïtés).

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Éditeur structuré
- La lecture et l'enregistrement existants (GET et PUT /api/requirements/sessions/:sessionId/document) restent la base : améliore-les.
- Ajout, modification, suppression et réordonnancement des exigences ; trois types (fonctionnelle, non fonctionnelle, user story) avec une numérotation automatique (EF-01, ENF-01, US-01) ; priorité MoSCoW ; critères d'acceptation pour les user stories ; aide à la rédaction (« En tant que… je veux… afin de… »).
- Soumission du cahier des charges pour évaluation (le document n'est plus modifiable une fois soumis, sauf nouvelle version).

Évaluation par l'IA
- Nouvel endpoint POST /api/requirements/sessions/:sessionId/document/evaluate : lit le besoin caché et les contraintes implicites côté serveur (getScenarioSecrets), appelle le prompt evaluate-document, enregistre une RequirementsEvaluation et passe le document au statut EVALUATED.
- Le prompt evaluate-document passe en version 0.2 avec la grille officielle : couverture du besoin réel, clarté, ambiguïtés (tu peux ajouter des sous-critères si tu les justifies). Les pistes d'amélioration orientent l'étudiant sans jamais révéler le besoin caché ni les contraintes implicites.
- La réponse du LLM reste validée par un schéma Zod (documentEvaluationSchema), à adapter à la grille.
- Historique des évaluations (GET …/document/evaluations).

Versions successives
- Le module 3 a besoin de versions successives du cahier des charges (évolution après une demande de changement). Propose une solution commune (tables, endpoints, qui écrit quoi), signale-la et attends mon accord avant toute modification du schéma Prisma.

Interface
- Les pages respectent les maquettes docs/ui/maquettes/05-m4-cahier-des-charges.html et 06-m4-evaluation.html et la charte : onglets par type, formulaire d'exigence, note globale, détail par critère avec jauges, pistes d'amélioration, états de chargement et erreurs avec bouton « Réessayer ».

Mode sans clé API
- Le mock de evaluate-document produit une évaluation crédible qui dépend du contenu du cahier des charges (nombre et type d'exigences), pour que la démo fonctionne sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface, et le nom ou l'email de l'étudiant ne doivent jamais être envoyés au LLM (passe toujours userId à callLLM).
- Ne modifie que server/src/modules/requirements/ et client/src/modules/requirements/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant.
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/requirements à partir de develop.
- Ajoute des tests automatisés dans server/src/modules/requirements/tests/ : validation des schémas, mock conforme, absence du besoin caché dans les réponses des endpoints du module (y compris l'évaluation), contrôle des rôles et des statuts du document.
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 4 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(requirements): … », puis pousse la branche feature/requirements, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-M4-001 dans docs/prompts/requirements.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.

# 5. Décision commune M3/M4 : versions successives du cahier des charges

Cette décision a été prise avec Ismail (module 3) et validée par le chef de projet. Elle remplace la demande « Propose une solution commune » de la section 1 : applique-la au lieu d'en proposer une autre.

- Nouvelle table RequirementsDocumentVersion (propriété du module 4) : id, documentId (relation vers RequirementsDocument, onDelete Cascade), version (1, 2, 3…), snapshot (JSON : la liste des exigences à ce moment, validée par un schéma Zod), reason (texte), changeRequestId (relation optionnelle vers ChangeRequest, unique, onDelete SetNull), createdAt. Contrainte unique (documentId, version).
- Ajout d'un champ version Int? dans RequirementsEvaluation, pour savoir quelle version a été évaluée.
- Seul le module 4 écrit dans cette table. Le module 3 la lit seulement. Le module 4 lit ChangeRequest pour vérifier que la demande appartient à la même séance, qu'elle a le statut ANSWERED et la décision ACCEPT ou NEGOTIATE (ne jamais se fier au paramètre de l'URL sans cette vérification).
- Version 1 : créée quand l'étudiant soumet son cahier des charges. Version N+1 : quand l'étudiant arrive depuis le module 3 avec une demande acceptée ou négociée, le document est rouvert pour modification ; à l'enregistrement, la nouvelle version liée à la demande est créée et le document repasse au statut SUBMITTED, prêt à être réévalué.
- Communication : le module 3 ouvre le module 4 avec ?changeRequest=<id> dans l'URL. Endpoints du module 4 :
  - POST /api/requirements/sessions/:sessionId/document/versions { changeRequestId, reason } (STUDENT propriétaire) ;
  - GET /api/requirements/sessions/:sessionId/document/versions, avec un filtre optionnel ?changeRequestId= (propriétaire ou TEACHER) ;
  - GET /api/requirements/sessions/:sessionId/document/versions/:version (propriétaire ou TEACHER).
- Priorité : commence par la migration (npm run db:migrate -- --name ajout_versions_cahier) et un commit qui ne contient que server/prisma, pour que je puisse ouvrir une pull request « migration seule » vers develop. La modification du modèle ChangeRequest se limite au champ de relation inverse exigé par Prisma (accord du module 3) : ne touche à rien d'autre dans le module 3.
```
````

#### Échanges complémentaires

L'IA a présenté son plan (migration, 8 endpoints, pages, tests) et posé 5 questions :

```text
1. La grille d'évaluation (total 100) : Couverture du besoin réel 30, Contraintes implicites traduites 15,
   Clarté et testabilité 20, Absence d'ambiguïtés 15, User stories et critères d'acceptation 10,
   Priorisation MoSCoW 10. Tu valides, ou tu veux d'autres poids ?
2. Le corps de POST /versions : j'ajoute requirements pour que l'enregistrement et la création de la version
   soient une seule opération atomique. D'accord ?
3. Les codes stables (pas de renumérotation après une suppression). D'accord ?
4. Une évaluation par version (on ne peut évaluer qu'un document SUBMITTED). D'accord ?
5. Docker est-il lancé ?
```

Réponse de Nadhem :

```text
faire tout le  module
```

L'IA a considéré le plan comme validé avec ses propositions par défaut pour les questions 1 à 4, et a vérifié elle-même Docker (question 5 : base lancée avec `npm run db:up`).

### Résumé de la production de l'IA

1. **Ce qui était demandé.** Faire passer le module 4 du squelette à une version complète : éditeur structuré (EF, ENF, US, MoSCoW, critères d'acceptation, réordonnancement, soumission), évaluation par le LLM selon la grille officielle (prompt v0.2, Zod, historique), versions successives selon la décision commune M3/M4 (migration en priorité), interface conforme aux maquettes 05 et 06, mock crédible, tests, documentation et commits.
2. **Ce qui a été réalisé.**
   - Migration `ajout_versions_cahier` (commit séparé, seulement `server/prisma`) : table `RequirementsDocumentVersion`, champ `version` dans `RequirementsEvaluation`, relation inverse `documentVersion` dans `ChangeRequest`.
   - Serveur : 8 endpoints (GET/PUT document, submit, evaluate, evaluations, POST/GET versions, GET versions/:version) ; cycle DRAFT → SUBMITTED (V1) → EVALUATED → V(N+1) ; vérification serveur de la demande de changement (même séance, ANSWERED, ACCEPT ou NEGOTIATE, pas déjà utilisée) ; passage SUBMITTED → EVALUATED conditionnel (pas de double évaluation).
   - Grille à 6 critères dans `requirements.grid.js` (source unique du prompt, du schéma et du mock) ; prompt `evaluate-document` v0.2 ; schéma `createDocumentEvaluationSchema()` qui refuse une évaluation hors grille **ou qui recopie le besoin caché** (callLLM relance alors l'appel) ; note globale recalculée par le serveur.
   - Mock qui calcule l'évaluation à partir du contenu (nombre et type d'exigences, format des user stories, critères d'acceptation, termes vagues, priorités).
   - Client : éditeur (onglets, cartes, ajout/modification/suppression, ↑↓, aide à la rédaction, soumission, mode « nouvelle version » avec `?changeRequest=<id>`, historique des versions) et page d'évaluation (note, jauges, pistes, choix de l'évaluation par version, attente explicite, « Réessayer ») ; lecture seule pour l'enseignant.
3. **Fichiers créés et modifiés.**
   - `server/prisma/schema.prisma`, `server/prisma/migrations/20261018142302_ajout_versions_cahier/migration.sql` (base commune, avec accord).
   - `server/src/modules/requirements/` : `requirements.grid.js` (créé), `versions.service.js` (créé), `requirements.schemas.js`, `requirements.service.js`, `requirements.controller.js`, `requirements.routes.js`, `prompts/evaluate-document.md`, `mocks/evaluate-document.mock.js`, `README.md`, `tests/schemas.test.js` et `tests/endpoints.test.js` (créés).
   - `client/src/modules/requirements/` : `api.js`, `routes.jsx`, `requirements.constants.js`, `requirements.css`, `hooks/useChangeRequestContext.js`, `pages/RequirementsEditorPage.jsx`, `pages/RequirementsEvaluationPage.jsx`, `components/` (`RequirementForm`, `RequirementCard`, `RequirementTabs`, `SessionStepper`, `CriterionBar`, `VersionHistory`) ; `pages/RequirementsHomePage.jsx` supprimé (remplacé par l'éditeur).
   - `docs/ARCHITECTURE.md` (modèle de données, propriétaires des tables, endpoints M4), `docs/prompts/modeles/prompt-m4-requirements.md` (section 5), ce journal.
4. **Vérifications effectuées et résultats.**
   - `npm test` : 57 tests, 57 réussis, 0 échec, 0 ignoré (dont 26 pour le module 4, intégration comprise, Docker lancé).
   - `npm run build` : réussi.
   - Serveur démarré (fournisseur mock) et 16 appels réels sur les 8 endpoints : codes attendus (200, 201, 403, 404, 409), aucune réponse ne contient `hiddenNeed` ni `implicitConstraints`, aucune alerte `[responseGuard]`.
5. **Problèmes rencontrés et corrections.**
   - Faille existante : `PUT` ne bloquait que le statut SUBMITTED, un document EVALUATED pouvait être modifié et repasser en DRAFT → corrigé (409 dès que le document n'est plus un brouillon).
   - La numérotation côté client pouvait créer deux fois le même code après une suppression → codes stables (plus grand numéro + 1) et unicité vérifiée par Zod côté serveur.
   - Expression régulière des accents altérée lors d'une modification par `sed` → remplacée par `p{M}`.
   - Premier essai des appels réels en shell : chemins `/tmp` incompatibles entre Git Bash et Node sous Windows → script Node hors du dépôt.
6. **Limites et ce qui reste à faire.**
   - L'endpoint `respond` du module 3 n'existe pas encore : la création d'une version a été testée en passant la demande à ACCEPT directement en base. À vérifier avec Ismail une fois son endpoint livré.
   - Le mock ne connaît pas le besoin caché : sa note de couverture dépend du volume et de la diversité des exigences. À tester avec une vraie clé API.
   - Le contexte de l'entretien (M2) n'est pas transmis au prompt d'évaluation ; pas de comparaison visuelle (diff) entre versions.
   - L'interface n'a pas été vérifiée dans le navigateur par l'IA : à faire par Nadhem (`npm run dev`, captures des deux écrans).
   - Les échanges de préparation (lecture des docs, analyse de la proposition M3/M4) ne sont pas encore tracés : numérotation à décider (P-009 dans JOURNAL.md proposé).

### Modifications de l'équipe

<!-- À remplir par le responsable du module -->

## P-M4-002 — Section 5.4 du rapport et captures du module 4

- **Date** : 2026-10-18
- **Auteur** : Nadhem Hmida
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : feature/requirements

### Prompt

```text
si mon module est terminer en doit terminer le rapport avec des capture de ma partie
```

### Résumé de la production de l'IA

1. **Ce qui était demandé.** Compléter la partie du module 4 dans le rapport Word, avec des captures d'écran.
2. **Ce qui a été réalisé.**
   - 4 captures des écrans réels, prises automatiquement (navigateur sans interface piloté par le protocole CDP, comme `scripts/export-images.mjs`) sur l'application lancée en mode simulé, avec le scénario « Boulangerie artisanale » : éditeur, évaluation, nouvelle version après une demande de changement, historique des versions.
   - Section 5.4 du rapport rédigée sur le modèle de la 5.1 : objectif et fonctionnalités (tableaux 15 et 16), décision commune M3/M4, prompts utilisés et évolution du prompt système (tableaux 17 et 18), réalisation et captures (figures 34 à 37) comparées aux maquettes 05 et 06, tests, difficultés et apport de l'IA, limites.
   - Annexe B complétée (captures 16 à 22) ; son tableau renuméroté de 15 à 19.
   - Trois cadres « Capture à insérer » (figures 32, 33 et 38) pour les captures de la conversation que seul Nadhem peut prendre : prompt, plan, résumé.
3. **Fichiers créés et modifiés.** `docs/rapport/Rapport_Client_Infernal.docx`, `docs/rapport/captures/README.md`, `docs/rapport/captures/p-m4-001-04` à `-07` (créés) ; `client/src/modules/requirements/` (`requirements.css`, `requirements.constants.js`, `components/RequirementForm.jsx`, `components/VersionHistory.jsx`, `pages/RequirementsEvaluationPage.jsx`) et `server/src/modules/requirements/mocks/evaluate-document.mock.js` (corrections, commit séparé).
4. **Vérifications effectuées et résultats.** Chaque capture relue avant insertion ; rapport ouvert par Word et exporté en PDF sans erreur (67 pages), pages de la section 5.4 et de l'annexe B relues visuellement ; `npm test` 57/57 et `npm run build` réussis après les corrections.
5. **Problèmes rencontrés et corrections.**
   - La relecture des captures a révélé trois défauts de l'interface, corrigés avant l'insertion : liste des priorités qui débordait du formulaire, colonne de droite décalée (`styles.css` est chargé après le CSS du module, sélecteurs renforcés), pluriels incorrects (« 2 exigence non fonctionnelles », « user storys », « exigence(s) »).
   - Rapport : ligne « Responsable » mal justifiée après un ajout, tableau des endpoints trop serré, figure 37 trop haute → ajout retiré, largeurs rééquilibrées, capture recadrée.
6. **Limites et ce qui reste à faire.**
   - Prendre les 3 captures de la conversation (`p-m4-001-01-prompt.png`, `-02-plan.png`, `-03-resume.png`) et les insérer à la place des cadres rouges.
   - Compléter les 2 encadrés « À compléter » de la section 5.4 (vérifications personnelles, test avec une vraie clé).
   - Les numéros des figures et tableaux sont du texte : ils devront être décalés quand les sections 5.2 et 5.3 seront ajoutées avant la 5.4.
   - Pour les figures 36 et 37, la demande de changement a été acceptée directement en base (endpoint du module 3 pas encore livré).

### Modifications de l'équipe

<!-- À remplir par le responsable du module -->
