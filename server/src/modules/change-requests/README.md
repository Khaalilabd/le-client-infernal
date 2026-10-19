# Module 3 — change-requests

**Responsable : Ismail Ismail** · Branche : `feature/change-requests`

Génère des **demandes de changement** réalistes de la part du client, puis évalue la réponse de l'étudiant : **accepter**, **négocier** ou **refuser**, avec une justification.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `change-requests.routes.js` | routes `/api/change-requests/*` |
| | `change-requests.controller.js` | lecture de la requête / réponse |
| | `change-requests.service.js` | liste, génération (callLLM, limite 3, lecture M4) ; évaluation de la réponse |
| | `change-requests.schemas.js` | Zod : `respondBodySchema`, `generatedChangeRequestSchema`, `responseEvaluationSchema` |
| | `prompts/generate-change.md` | prompt de génération v0.2 (branché) |
| | `prompts/evaluate-response.md` | prompt d'évaluation v0.2 (branché) |
| | `mocks/generate-change.mock.js` | 3 demandes variées (effort LOW/MEDIUM/HIGH) |
| | `mocks/evaluate-response.mock.js` | réponse adaptée à la décision ACCEPT/NEGOTIATE/REFUSE |
| | `tests/schemas.test.js` | tests unitaires (Zod, mocks, prompts) |
| | `tests/endpoints.test.js` | tests d'intégration (endpoints, rôles, secrets) |
| Client | `routes.jsx` | menu + routes |
| | `api.js` | appels HTTP (list, generate, respond) |
| | `pages/ChangeRequestsPage.jsx` | page principale : stepper, layout 2 colonnes, formulaire, historique |
| | `components/ChangeRequestCard.jsx` | carte d'une demande (mode normal et compact) |
| | `components/RespondForm.jsx` | formulaire de réponse : choix de la décision + justification |
| | `change-requests.css` | styles spécifiques préfixés `.cr-*` |

## Tables utilisées

- **`ChangeRequest`** (propriétaire, écriture).
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché via `getScenarioSecrets()`, serveur uniquement).
- `RequirementsDocument` + `Requirement` (lecture — M4) pour générer des demandes qui touchent le cahier des charges.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/change-requests/sessions/:sessionId` | propriétaire ou TEACHER |
| ✅ | POST | `/api/change-requests/sessions/:sessionId/generate` | STUDENT propriétaire (limite : 3/séance) |
| ✅ | POST | `/api/change-requests/:changeRequestId/respond` `{ decision, justification }` | STUDENT propriétaire |

## Limites et prochaines étapes

- [x] Implémenter `respondToChangeRequest()` : vérifier que la demande appartient à une séance de l'étudiant et qu'elle est `PENDING`, appeler `evaluate-response`, puis enregistrer `decision`, `justification`, `score`, `feedback`, `status = ANSWERED` et `answeredAt`.
- [x] Ajouter la route `POST /:changeRequestId/respond`.
- [x] Améliorer les deux prompts (v0.2) ; s'appuyer sur le cahier des charges existant.
- [x] Limiter le nombre de demandes par séance (3).
- [x] Côté client : formulaire de réponse, affichage de la note et de la réaction du client.
- [x] Tracer les prompts dans `docs/prompts/change-requests.md`.
- [ ] Bouton « Mettre à jour le cahier des charges » vers `?changeRequest=<id>` (après accord M4) — endpoint M4 disponible, à brancher côté UI.
- [ ] Tester avec une vraie clé API (le mock suffit pour la démo).
