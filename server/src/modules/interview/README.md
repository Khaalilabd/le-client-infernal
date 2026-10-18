# Module 2 — interview

**Responsable : Kenza Baccar** · Branche : `feature/interview`

Chat où le LLM joue le client du scénario. Le client **ne révèle son besoin caché que si les questions de l'étudiant s'en approchent**.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `interview.routes.js` | routes `/api/interview/*` |
| | `interview.controller.js` | lecture de la requête / réponse |
| | `interview.service.js` | historique, envoi d'une question, appel au LLM |
| | `interview.schemas.js` | Zod : entrées HTTP + `clientReplySchema` (sortie du LLM) |
| | `prompts/client-reply.md` | prompt système du client simulé (brouillon v0.1) |
| | `mocks/client-reply.mock.js` | réponse simulée (donne un indice si la question contient « pourquoi », « problème »…) |
| Client | `client/src/modules/interview/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/InterviewHomePage.jsx` | choix de la séance + chat |
| | `components/ChatWindow.jsx` | fenêtre de chat |

## Tables utilisées

- **`InterviewMessage`** (propriétaire, écriture). Le champ `proximity` (de 0 à 1) reste côté serveur.
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché via `getScenarioSecrets()`, **serveur uniquement**).

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/interview/sessions/:sessionId/messages` | propriétaire ou TEACHER |
| ✅ | POST | `/api/interview/sessions/:sessionId/messages` `{ content }` | STUDENT propriétaire |
| 🔲 | POST | `/api/interview/sessions/:sessionId/end` | STUDENT propriétaire |
| 🔲 | GET | `/api/interview/sessions/:sessionId/progress` | propriétaire ou TEACHER |

## Règles à respecter

- La réponse du LLM ne doit **jamais** contenir le besoin caché mot pour mot : à vérifier dans le prompt, et éventuellement par un contrôle dans le service.
- Ne renvoyer au front-end que `id, sender, content, createdAt` (voir `PUBLIC_MESSAGE_FIELDS`).
- Les messages de l'étudiant peuvent contenir son nom : le service IA les masque automatiquement si `userId` est passé à `callLLM`.

## Tâches

- [ ] Améliorer le prompt `client-reply.md` : révélation progressive selon `proximity`, respect de la personnalité et du niveau, refus de sortir du rôle.
- [ ] Limiter la taille de l'historique envoyé au LLM (par exemple les 20 derniers messages + un résumé).
- [ ] Endpoint de fin d'entretien avec une synthèse (nouveau prompt `summary.md`, nouveau schéma Zod, nouveau mock).
- [ ] Indicateur de progression (nombre de questions, niveau de découverte), sans révéler le besoin.
- [ ] Côté client : indicateur de saisie, gestion des erreurs IA (429, timeout) avec un bouton « Réessayer », lecture seule pour l'enseignant.
- [ ] Mettre à jour le mock pour couvrir les nouveaux cas.
- [ ] Tracer chaque version du prompt dans `docs/prompts/interview.md`.
