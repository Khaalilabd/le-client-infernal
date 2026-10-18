# Module 4 — requirements

**Responsable : Nadhem Hmida** · Branche : `feature/requirements`

Éditeur structuré du **cahier des charges** (exigences fonctionnelles, non fonctionnelles, user stories), **évaluation par le LLM** selon une grille en comparant le document au besoin caché, et **versions successives** après une demande de changement (décision commune avec le module 3).

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `requirements.routes.js` | routes `/api/requirements/*` |
| | `requirements.controller.js` | lecture de la requête / réponse |
| | `requirements.service.js` | lecture, enregistrement, soumission (V1), évaluation par le LLM |
| | `versions.service.js` | versions successives : création (V N+1), liste, détail |
| | `requirements.schemas.js` | Zod : entrées HTTP, `snapshotSchema`, `createDocumentEvaluationSchema()` (sortie du LLM) |
| | `requirements.grid.js` | grille d'évaluation (source unique pour le prompt, le schéma et le mock) |
| | `prompts/evaluate-document.md` | prompt d'évaluation, **v0.2** |
| | `mocks/evaluate-document.mock.js` | évaluation simulée, calculée à partir du contenu du cahier des charges |
| | `tests/schemas.test.js`, `tests/endpoints.test.js` | tests unitaires et d'intégration |
| Client | `client/src/modules/requirements/routes.jsx` | menu + routes (`/requirements`, `/requirements/evaluation`) |
| | `api.js` | appels HTTP (et lecture de la liste des demandes du module 3) |
| | `requirements.constants.js` | libellés, numérotation des codes, format des user stories |
| | `pages/RequirementsEditorPage.jsx` | éditeur (maquette 05) |
| | `pages/RequirementsEvaluationPage.jsx` | évaluation (maquette 06) |
| | `components/` | `RequirementForm`, `RequirementCard`, `RequirementTabs`, `SessionStepper`, `CriterionBar`, `VersionHistory` |
| | `hooks/useChangeRequestContext.js` | contexte d'une demande reçue du module 3 (`?changeRequest=<id>`) |
| | `requirements.css` | styles du module (préfixe `requirements-`) |

## Tables utilisées

- **`RequirementsDocument`**, **`Requirement`**, **`RequirementsEvaluation`**, **`RequirementsDocumentVersion`** (propriétaire, écriture).
- `ChangeRequest` (lecture) : vérification de la demande avant une nouvelle version.
- `TrainingSession` (lecture, via `getAccessibleSession()`).
- `Scenario` (lecture du besoin caché et des contraintes via `getScenarioSecrets()`, serveur uniquement).

## Cycle de vie du document

```
DRAFT ──submit──▶ SUBMITTED (V1) ──evaluate──▶ EVALUATED
                       ▲                            │
                       └──── POST /versions ◀───────┘   demande de changement ACCEPT ou NEGOTIATE → V(N+1)
```

- Un brouillon se modifie librement (`PUT`). Une fois soumis, il est verrouillé : `PUT` renvoie `409`.
- Une seule évaluation par version : on ne peut évaluer qu'un document `SUBMITTED`.
- Une demande de changement ne produit qu'une version (`changeRequestId` unique).

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/requirements/sessions/:sessionId/document` | propriétaire ou TEACHER |
| ✅ | PUT | `/api/requirements/sessions/:sessionId/document` `{ requirements: [...] }` | STUDENT propriétaire (brouillon) |
| ✅ | POST | `/api/requirements/sessions/:sessionId/document/submit` | STUDENT propriétaire |
| ✅ | POST | `/api/requirements/sessions/:sessionId/document/evaluate` | STUDENT propriétaire |
| ✅ | GET | `/api/requirements/sessions/:sessionId/document/evaluations` | propriétaire ou TEACHER |
| ✅ | POST | `/api/requirements/sessions/:sessionId/document/versions` `{ changeRequestId, reason, requirements }` | STUDENT propriétaire |
| ✅ | GET | `/api/requirements/sessions/:sessionId/document/versions?changeRequestId=` | propriétaire ou TEACHER |
| ✅ | GET | `/api/requirements/sessions/:sessionId/document/versions/:version` | propriétaire ou TEACHER |

Détail des réponses : `docs/ARCHITECTURE.md`, section 4.

## Pour le module 3 (Ismail)

- Après « Accepter » ou « Négocier », ouvrir `/requirements?session=<sessionId>&changeRequest=<changeRequestId>`.
- Pour afficher « Version N créée suite à la demande n°X » : `GET …/document/versions?changeRequestId=<id>` (liste vide tant que l'étudiant n'a pas enregistré la version), ou lecture directe de `RequirementsDocumentVersion` par `changeRequestId`.
- Le module 4 n'écrit jamais dans `ChangeRequest`.

## Grille d'évaluation (prompt v0.2)

| Critère | Points |
|---|---|
| Couverture du besoin réel | 30 |
| Contraintes implicites identifiées | 15 |
| Clarté et testabilité | 20 |
| Absence d'ambiguïtés | 15 |
| User stories et critères d'acceptation | 10 |
| Priorisation MoSCoW | 10 |

## Règles respectées

- Le besoin caché et les contraintes implicites ne sont lus que pour construire le prompt ; aucune réponse ne contient le scénario.
- `createDocumentEvaluationSchema()` **refuse** une évaluation dont le retour recopie le besoin caché ou une contrainte (6 mots consécutifs ou le texte entier) : `callLLM` redemande alors une réponse.
- La note globale est recalculée par le serveur (somme des critères).
- Les codes (EF-01, ENF-01, US-01) sont stables : une nouvelle exigence prend le plus grand numéro de son type + 1, sans renumérotation après une suppression, pour comparer les versions.

## Limites et pistes

- Le mock ne connaît pas le besoin caché : sa note de « couverture » dépend du volume et de la diversité des exigences.
- Le contexte de l'entretien (`InterviewMessage`) n'est pas encore transmis au prompt d'évaluation.
- Pas de comparaison visuelle (diff) entre deux versions.
