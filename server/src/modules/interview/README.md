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
| | `prompts/client-reply.md` | prompt système du client simulé (v0.2 : révélation progressive, personnalité, niveau) |
| | `prompts/summary.md` | prompt système pour la synthèse de fin d'entretien (v0.1) |
| | `mocks/client-reply.mock.js` | réponse simulée adaptée au profil de personnalité |
| | `mocks/summary.mock.js` | synthèse simulée basée sur l'analyse des questions |
| | `tests/schemas.test.js` | tests unitaires des schémas et mocks |
| | `tests/endpoints.test.js` | tests d'intégration des 4 endpoints |
| Client | `client/src/modules/interview/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/InterviewHomePage.jsx` | page principale : stepper, chat, fiche client, progression, fin d'entretien |
| | `components/ChatWindow.jsx` | fenêtre de chat |
| | `components/ClientCard.jsx` | fiche du client (informations publiques) |
| | `components/ProgressIndicator.jsx` | indicateur de progression (nombre de questions, niveau de découverte) |
| | `components/SummaryModal.jsx` | modal de synthèse de fin d'entretien |

## Tables utilisées

- **`InterviewMessage`** (propriétaire, écriture). Le champ `proximity` (de 0 à 1) reste côté serveur.
- `TrainingSession` (lecture via `getAccessibleSession()`, mise à jour du statut à COMPLETED lors de la fin d'entretien).
- `Scenario` (lecture du besoin caché et du profil de personnalité via `getScenarioSecrets()`, **serveur uniquement**).

## Endpoints

| État | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/interview/sessions/:sessionId/messages` | Liste les messages (propriétaire ou TEACHER) |
| ✅ | POST | `/api/interview/sessions/:sessionId/messages` `{ content }` | Envoie une question (STUDENT propriétaire) |
| ✅ | POST | `/api/interview/sessions/:sessionId/end` | Termine l'entretien et génère une synthèse (STUDENT propriétaire) |
| ✅ | GET | `/api/interview/sessions/:sessionId/progress` | Progression : questionsCount, discoveryLevel, recommendedQuestions (propriétaire ou TEACHER) |

## Fonctionnalités implémentées

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
- Le statut de la séance passe à `COMPLETED` après la fin de l'entretien

### Indicateur de progression
- **questionsCount** : nombre de questions posées par l'étudiant
- **discoveryLevel** : LOW / MEDIUM / HIGH (calculé à partir de la moyenne des `proximity`, sans révéler la valeur exacte)
- **recommendedQuestions** : objectif conseillé selon le niveau du scénario (BEGINNER : 5-8, INTERMEDIATE : 8-12, ADVANCED : 10-15)

### Interface
- **Stepper** : parcours de séance (Scénario → Entretien → Cahier des charges → Changements → Évaluation)
- **Fiche du client** : nom, fonction, entreprise, traits de personnalité, contexte, demande initiale
- **Indicateur de progression** : jauge visuelle et libellé du niveau de découverte
- **Bouton "Terminer l'entretien"** : avec confirmation, génère la synthèse et affiche un modal
- **Gestion des états** : séance terminée (lecture seule), état de chargement, erreurs IA (avec conseil de réessayer pour 429/504)
- Le nom du client apparaît dans les bulles de chat

### Mode sans clé API
- Le mock `client-reply` adapte sa réponse au profil de personnalité et à la qualité de la question
- Le mock `summary` analyse les mots-clés des questions pour générer une synthèse crédible

## Tests

- **13 tests unitaires** : validation des schémas (dont la vérification de non-copie du besoin caché), conformité des mocks pour chaque profil, construction des prompts sans variables manquantes
- **Tests d'intégration** (nécessitent la base de démonstration) : 4 endpoints, authentification, rôles, absence de secrets dans les réponses, vérification que `proximity` n'est pas exposé au front-end

## Règles respectées

- La réponse du LLM ne contient **jamais** le besoin caché mot pour mot (vérifié par Zod avec `containsConsecutiveWords`)
- Seuls les champs `id, sender, content, createdAt` sont renvoyés au front-end (pas de `proximity`)
- Le service IA masque automatiquement le nom et l'email de l'étudiant (`userId` passé à `callLLM`)
- Le filet de sécurité `responseGuard` n'a jamais eu à intervenir (vérifié par les tests)

