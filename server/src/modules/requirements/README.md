# Module 4 — requirements

**Responsable : Nadhem Hmida** · Branche : `feature/requirements`

Éditeur structuré du **cahier des charges** (exigences fonctionnelles, non fonctionnelles, user stories), puis **évaluation par le LLM** selon une grille, en comparant le document au besoin caché.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `requirements.routes.js` | routes `/api/requirements/*` |
| | `requirements.controller.js` | lecture de la requête / réponse |
| | `requirements.service.js` | lecture et enregistrement du document ; TODO : évaluation |
| | `requirements.schemas.js` | Zod : `requirementInputSchema`, `saveDocumentBodySchema`, `documentEvaluationSchema` |
| | `prompts/evaluate-document.md` | prompt d'évaluation avec la grille (brouillon v0.1, **à brancher**) |
| | `mocks/evaluate-document.mock.js` | réponse simulée |
| Client | `client/src/modules/requirements/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/RequirementsHomePage.jsx` | liste des exigences, ajout, suppression, enregistrement |
| | `components/RequirementForm.jsx` | formulaire d'ajout |

## Tables utilisées

- **`RequirementsDocument`**, **`Requirement`**, **`RequirementsEvaluation`** (propriétaire, écriture).
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché et des contraintes via `getScenarioSecrets()`, serveur uniquement).
- Optionnel : `InterviewMessage` (lecture) pour donner au LLM le contexte de l'entretien.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/requirements/sessions/:sessionId/document` | propriétaire ou TEACHER |
| ✅ | PUT | `/api/requirements/sessions/:sessionId/document` `{ requirements: [...] }` | STUDENT propriétaire |
| 🔲 | POST | `/api/requirements/sessions/:sessionId/document/evaluate` | STUDENT propriétaire |
| 🔲 | GET | `/api/requirements/sessions/:sessionId/document/evaluations` | propriétaire ou TEACHER |

## Règles à respecter

- Le retour d'évaluation ne doit **pas** citer le besoin caché ni les contraintes implicites mot pour mot : il propose des pistes.
- `missingPoints` et `feedback` sont affichés à l'étudiant : à vérifier dans le prompt.

## Tâches

- [ ] Implémenter `evaluateDocument()` : charger le document et `getScenarioSecrets()`, appeler `evaluate-document`, créer une `RequirementsEvaluation`, passer le document au statut `EVALUATED`.
- [ ] Ajouter les routes d'évaluation.
- [ ] Éditeur : modification d'une exigence existante, réordonnancement, critères d'acceptation des user stories, filtres par type.
- [ ] Affichage de l'évaluation : note globale, détail par critère, pistes.
- [ ] Affiner la grille du prompt (pondérations, exemples).
- [ ] Tracer chaque version du prompt dans `docs/prompts/requirements.md`.
