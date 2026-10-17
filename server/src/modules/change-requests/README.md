# Module 3 — change-requests

**Responsable : Ismail Ismail** · Branche : `feature/change-requests`

Génère des **demandes de changement** réalistes de la part du client, puis évalue la réponse de l'étudiant : **accepter**, **négocier** ou **refuser**, avec une justification.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `change-requests.routes.js` | routes `/api/change-requests/*` |
| | `change-requests.controller.js` | lecture de la requête / réponse |
| | `change-requests.service.js` | liste, génération (callLLM) ; TODO : évaluation de la réponse |
| | `change-requests.schemas.js` | Zod : `respondBodySchema`, `generatedChangeRequestSchema`, `responseEvaluationSchema` |
| | `prompts/generate-change.md` | prompt de génération (brouillon v0.1, branché) |
| | `prompts/evaluate-response.md` | prompt d'évaluation (brouillon v0.1, **à brancher**) |
| | `mocks/*.mock.js` | réponses simulées des deux prompts |
| Client | `client/src/modules/change-requests/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/ChangeRequestsHomePage.jsx` | choix de la séance, liste, bouton de génération |
| | `components/ChangeRequestCard.jsx` | carte d'une demande |

## Tables utilisées

- **`ChangeRequest`** (propriétaire, écriture).
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché via `getScenarioSecrets()`, serveur uniquement).
- Optionnel : `Requirement` (lecture) pour générer des demandes qui touchent le cahier des charges de l'étudiant.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/change-requests/sessions/:sessionId` | propriétaire ou TEACHER |
| ✅ | POST | `/api/change-requests/sessions/:sessionId/generate` | STUDENT propriétaire |
| 🔲 | POST | `/api/change-requests/:changeRequestId/respond` `{ decision, justification }` | STUDENT propriétaire |

## Tâches

- [ ] Implémenter `respondToChangeRequest()` : vérifier que la demande appartient à une séance de l'étudiant et qu'elle est `PENDING`, appeler `evaluate-response`, puis enregistrer `decision`, `justification`, `score`, `feedback`, `status = ANSWERED` et `answeredAt`.
- [ ] Ajouter la route `POST /:changeRequestId/respond` avec `validate({ body: respondBodySchema })`.
- [ ] Améliorer les deux prompts ; s'appuyer sur le cahier des charges existant pour rendre les demandes plus réalistes.
- [ ] Limiter le nombre de demandes par séance (par exemple 3).
- [ ] Côté client : formulaire de réponse (choix de la décision + justification), affichage de la note et de la réaction du client.
- [ ] Tracer chaque version des prompts dans `docs/prompts/JOURNAL.md`.
