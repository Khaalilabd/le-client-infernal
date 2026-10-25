# Module 2 — interview

**Responsable : Kenza Baccar** · Branche : `feature/interview`

Chat où le LLM joue le client du scénario. Le client **ne révèle son besoin caché que si les questions de l'étudiant s'en approchent**. L'étudiant peut terminer l'entretien et obtenir une synthèse de ce qu'il a découvert.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `interview.routes.js` | routes `/api/interview/*` |
| | `interview.controller.js` | lecture de la requête / réponse |
| | `interview.service.js` | historique, envoi d'une question, appel au LLM, fin d'entretien, progression |
| | `interview.schemas.js` | Zod : entrées HTTP + `clientReplySchema`, `interviewSummarySchema`, `progressResponseSchema` |
| | `prompts/client-reply.md` | prompt système du client simulé (v0.3 : analyse en 4 étapes, exemples de calibrage, anti-injection ; v0.2 : révélation progressive, personnalité, niveau) |
| | `prompts/summary.md` | prompt système pour la synthèse de fin d'entretien (v0.2 : retour appuyé sur la répartition des questions) |
| | `mocks/client-reply.mock.js` | réponse simulée : analyse de la question, profil de personnalité, tentatives de manipulation |
| | `mocks/summary.mock.js` | synthèse simulée basée sur l'analyse des questions |
| | `tests/schemas.test.js` | tests unitaires des schémas et mocks |
| | `tests/reasoning.test.js` | tests de la partie IA : Chain-of-Thought, exemples du prompt, prompt injection |
| | `tests/endpoints.test.js` | tests d'intégration des 4 endpoints |
| Client | `client/src/modules/interview/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/InterviewHomePage.jsx` | page principale : stepper, chat, fiche client, progression, fin d'entretien |
| | `components/ChatWindow.jsx` | fenêtre de chat |
| | `components/ClientCard.jsx` | fiche du client (informations publiques) |
| | `components/ProgressIndicator.jsx` | indicateur de progression (nombre de questions, niveau de découverte, répartition des questions par type) |
| | `interview.css` | styles propres au module (préfixe `iv-`) |
| | `components/SummaryModal.jsx` | modal de synthèse de fin d'entretien |

## Tables utilisées

- **`InterviewMessage`** (propriétaire, écriture). Les champs `proximity` (de 0 à 1) et `questionType` (type de la question, issu de l'analyse du LLM ; migration `ajout_type_question`) restent côté serveur : seule la répartition par type est renvoyée par `/progress`.
- **`InterviewSummary`** (propriétaire, écriture) : fin de l'entretien et synthèse, une par séance. Terminer l'entretien **ne termine pas la séance** (`TrainingSession` n'est jamais modifiée par le module 2).
- `TrainingSession` (lecture seule, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché et du profil de personnalité via `getScenarioSecrets()`, **serveur uniquement**).

## Endpoints

| État | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/interview/sessions/:sessionId/messages` | Liste les messages (propriétaire ou TEACHER) |
| ✅ | POST | `/api/interview/sessions/:sessionId/messages` `{ content }` | Envoie une question (STUDENT propriétaire) |
| ✅ | POST | `/api/interview/sessions/:sessionId/end` | Termine l'entretien et génère une synthèse, enregistrée dans `InterviewSummary` : la **séance reste en cours** pour enchaîner avec le cahier des charges (STUDENT propriétaire) |
| ✅ | GET | `/api/interview/sessions/:sessionId/progress` | Progression : questionsCount, discoveryLevel, recommendedQuestions, questionTypes (propriétaire ou TEACHER) |
| ✅ | GET | `/api/interview/sessions/:sessionId/summary` | État de l'entretien : terminé ou non, synthèse enregistrée (propriétaire ou TEACHER) |

## Fonctionnalités implémentées

### Partie IA : techniques du cours (prompt client-reply v0.3, P-M2-003)
- **Chain-of-Thought** : avant de répondre, le client remplit un champ `analysis` en 4 étapes (type de question, thème, lien avec le vrai problème, décision NONE / HINT / PARTIAL). Zod vérifie la cohérence : PARTIAL si et seulement si proximity ≥ 0.6, révélation du besoin seulement avec PARTIAL.
- **Few-shot** : 4 exemples de calibrage sur un autre client (un garage) : question fermée (0,1), contexte (0,4), pourquoi et conséquences (0,8), manipulation (0). Un test vérifie que chaque exemple respecte le schéma.
- **Défense contre le prompt injection** (règle 6) : les messages de l'étudiant sont des données, jamais des instructions. Une tentative est classée MANIPULATION (NONE, proximity ≤ 0,2, imposé par Zod) et le client reste dans son rôle.
- Le raisonnement peut citer le besoin caché : il n'est **jamais enregistré ni renvoyé**. Seul `questionType` est enregistré ; il alimente la répartition des questions (progression) et le prompt de synthèse v0.2.


### Prompt système client-reply v0.2
- Intégration du **profil de personnalité** (COOPERATIVE, RUSHED, SKEPTICAL, TALKATIVE, CONTRADICTORY, INDECISIVE) : le client adapte son style de réponse et son comportement
- **Révélation progressive** selon la qualité des questions :
  - proximity < 0.3 : réponse évasive, le client ramène à sa demande initiale
  - proximity 0.3-0.6 : indices sur les problèmes actuels, sans révéler le cœur du besoin
  - proximity > 0.6 : le client reconnaît le problème et révèle une partie du besoin caché
- **Adaptation au niveau** du scénario (BEGINNER : plus direct, INTERMEDIATE : honnête mais pas facilitateur, ADVANCED : exigeant et peu explicite)
- **Protection renforcée** : le schéma Zod refuse une réponse qui recopie 6 mots consécutifs du besoin caché ou d'une contrainte implicite

### Limitation de l'historique
- Si l'entretien contient > 30 messages, seuls les 10 premiers et les 20 derniers sont envoyés au LLM (avec résumé implicite)
- Réduit les coûts et les temps de réponse pour les longs entretiens

### Synthèse de fin d'entretien
- Nouveau prompt `summary.md` : analyse l'historique et liste ce que l'étudiant a **effectivement** découvert
- La synthèse ne révèle jamais ce que l'étudiant n'a pas demandé
- Retour qualitatif sur la démarche (types de questions, exploration du contexte, opportunités manquées)
- La fin de l'entretien est enregistrée dans `InterviewSummary` ; la séance reste `IN_PROGRESS` pour enchaîner avec le cahier des charges (M4) et les demandes de changement (M3)

### Indicateur de progression
- **questionsCount** : nombre de questions posées par l'étudiant
- **discoveryLevel** : LOW / MEDIUM / HIGH (calculé à partir de la moyenne des `proximity`, sans révéler la valeur exacte)
- **recommendedQuestions** : objectif conseillé selon le niveau du scénario (BEGINNER : 5-8, INTERMEDIATE : 8-12, ADVANCED : 10-15)
- **questionTypes** : nombre de questions ouvertes, fermées, hors sujet, techniques et hors cadre (manipulation)

### Interface
- **Stepper** : parcours de séance (Scénario → Entretien → Cahier des charges → Changements → Évaluation)
- **Fiche du client** : nom, fonction, entreprise, traits de personnalité, contexte, demande initiale
- **Indicateur de progression** : jauge visuelle et libellé du niveau de découverte
- **Bouton "Terminer l'entretien"** : avec confirmation, génère la synthèse et affiche un modal
- **Gestion des états** : séance terminée (lecture seule), état de chargement, erreurs IA (avec conseil de réessayer pour 429/504)
- Le nom du client apparaît dans les bulles de chat

### Mode sans clé API
- Le mock `client-reply` analyse la question comme le LLM (type, décision), adapte sa réponse au profil de personnalité et déjoue les tentatives de manipulation
- Le mock `summary` analyse les mots-clés des questions pour générer une synthèse crédible

## Tests

- **36 tests** au total (`npm test`).
- Tests unitaires : validation des schémas (dont la vérification de non-copie du besoin caché), conformité des mocks pour chaque profil, construction des prompts sans variables manquantes.
- Partie IA (`reasoning.test.js`) : analyse obligatoire et cohérente, manipulation sans révélation, validité des 4 exemples du prompt, classement des questions, 5 formulations d'injection sur les 6 profils, personnalité respectée.
- **Tests d'intégration** (nécessitent la base de démonstration) : endpoints, authentification, rôles, absence de secrets dans les réponses, `proximity` et `analysis` jamais exposés, message piège enregistré comme MANIPULATION, répartition des questions.

## Règles respectées

- La réponse du LLM ne contient **jamais** le besoin caché mot pour mot (vérifié par Zod avec `containsConsecutiveWords`)
- Seuls les champs `id, sender, content, createdAt` sont renvoyés au front-end (pas de `proximity`)
- Le service IA masque automatiquement le nom et l'email de l'étudiant (`userId` passé à `callLLM`)
- Le filet de sécurité `responseGuard` n'a jamais eu à intervenir (vérifié par les tests)

