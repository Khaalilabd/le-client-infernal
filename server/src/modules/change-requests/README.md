# Module 3 — change-requests

**Responsable : Ismail Ismail** · Branche : `feature/change-requests`

Génère des **demandes de changement** réalistes de la part du client, puis évalue la réponse de l'étudiant : **accepter**, **négocier** ou **refuser**, avec une justification.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `change-requests.routes.js` | routes `/api/change-requests/*` |
| | `change-requests.controller.js` | lecture de la requête / réponse |
| | `change-requests.service.js` | liste, génération (callLLM, limite 3, lecture M4) ; évaluation de la réponse |
| | `change-requests.schemas.js` | Zod : `respondBodySchema`, `generatedChangeRequestSchema`, `createResponseEvaluationSchema()` (refuse un retour qui recopie le besoin caché ou une contrainte implicite : texte entier ou 6 mots consécutifs) |
| | `prompts/generate-change.md` | prompt de génération v0.2 (branché) |
| | `prompts/evaluate-response.md` | prompt d'évaluation v0.2 (branché) |
| | `mocks/generate-change.mock.js` | 3 demandes variées (effort LOW/MEDIUM/HIGH) |
| | `mocks/evaluate-response.mock.js` | réponse adaptée à la décision ACCEPT/NEGOTIATE/REFUSE |
| | `tests/schemas.test.js` | tests unitaires (Zod, mocks, prompts) |
| | `tests/endpoints.test.js` | tests d'intégration (endpoints, rôles, secrets) |
| Client | `routes.jsx` | menu + routes |
| | `api.js` | appels HTTP (list, generate, respond) et lecture des versions du cahier des charges (API du M4) |
| | `pages/ChangeRequestsPage.jsx` | page principale : stepper, layout 2 colonnes, formulaire, historique |
| | `components/ChangeRequestCard.jsx` | carte d'une demande (mode normal et compact), avec le lien vers le cahier des charges après une demande acceptée ou négociée |
| | `components/RespondForm.jsx` | formulaire de réponse : choix de la décision + justification |
| | `change-requests.css` | styles spécifiques préfixés `.cr-*` |

## Tables utilisées

- **`ChangeRequest`** (propriétaire, écriture), dont `clientReaction` (réaction du client, enregistrée).
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché via `getScenarioSecrets()`, serveur uniquement).
- `RequirementsDocument` + `Requirement` (lecture — M4) pour générer des demandes qui touchent le cahier des charges.
- `RequirementsDocumentVersion` (lecture via l'API du M4) pour afficher « Version N créée suite à cette demande ».

## Lien avec le module 4 (versions du cahier des charges)

Après « Accepter » ou « Négocier », la carte de la demande propose **« Mettre à jour le cahier des charges »**, qui ouvre `/requirements?session=<id>&changeRequest=<id>`. Le module 4 enregistre alors la version suivante, liée à la demande. De retour dans le module 3, la carte affiche **« Version N du cahier des charges créée suite à cette demande »**. Le module 3 n'écrit jamais dans les tables du module 4.

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
- [x] Bouton « Mettre à jour le cahier des charges » vers `?changeRequest=<id>` et affichage de la version créée (P-M3-002).
- [x] Protection réelle du besoin caché dans l'évaluation, réaction du client enregistrée, double réponse bloquée (P-M3-002).
- [ ] Tester avec une vraie clé API (le mock suffit pour la démo).
