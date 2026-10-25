# Module 4 — requirements

**Responsable : Nadhem Hmida** · Branche : `feature/requirements`

Éditeur structuré du **cahier des charges** (exigences fonctionnelles, non fonctionnelles, user stories), **évaluation par le LLM** selon une grille en comparant le document au besoin caché, et **versions successives** après une demande de changement (décision commune avec le module 3).

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `requirements.routes.js` | routes `/api/requirements/*` |
| | `requirements.controller.js` | lecture de la requête / réponse |
| | `requirements.service.js` | lecture, enregistrement, soumission (V1), évaluation par le LLM (matching puis notation) |
| | `versions.service.js` | versions successives : création (V N+1), liste, détail |
| | `requirements.schemas.js` | Zod : entrées HTTP, `snapshotSchema`, `createDocumentEvaluationSchema()` (sortie du LLM) |
| | `requirements.grid.js` | grille d'évaluation (source unique pour le prompt, le schéma et le mock) |
| | `requirements.matching.js` | matching besoin caché ↔ exigences : points de référence, schéma Zod, calcul des notes de couverture |
| | `prompts/match-requirements.md` | prompt de matching, **v0.1** |
| | `prompts/evaluate-document.md` | prompt d'évaluation, **v0.3** |
| | `mocks/match-requirements.mock.js` | matching simulé (mots communs entre points et exigences) |
| | `mocks/evaluate-document.mock.js` | évaluation simulée, calculée à partir du contenu du cahier des charges |
| | `tests/schemas.test.js`, `tests/matching.test.js`, `tests/endpoints.test.js` | tests unitaires et d'intégration |
| Client | `client/src/modules/requirements/routes.jsx` | menu + routes (`/requirements`, `/requirements/evaluation`) |
| | `api.js` | appels HTTP (et lecture de la liste des demandes du module 3) |
| | `requirements.constants.js` | libellés, numérotation des codes, format des user stories |
| | `pages/RequirementsEditorPage.jsx` | éditeur (maquette 05) |
| | `pages/RequirementsEvaluationPage.jsx` | évaluation (maquette 06) |
| | `components/` | `RequirementForm`, `RequirementCard`, `RequirementTabs`, `SessionStepper`, `CriterionBar`, `MatchingPanel`, `VersionHistory` |
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

## Matching besoin caché ↔ exigences (prompt match-requirements v0.1)

L'évaluation (`POST …/document/evaluate`) fait **deux appels** au LLM :

1. **match-requirements** : le besoin caché est découpé en points `N1`, `N2`… (une phrase = un point) et chaque contrainte implicite devient un point `C1`, `C2`… Le LLM indique pour chaque point `COVERED`, `PARTIAL` ou `MISSING`, les codes des exigences qui le traitent et une confiance (0 à 1). Sa réponse ne contient **aucun texte** : seulement des identifiants et des codes. `createMatchingSchema()` vérifie qu'il y a un résultat par point, que les codes existent dans le document et que les statuts sont cohérents (aucun code pour `MISSING`, au moins un pour `COVERED` ou `PARTIAL`).
2. **evaluate-document** : notation selon la grille, avec le résultat du matching dans le prompt pour des commentaires cohérents.

Le serveur **calcule** ensuite deux notes à partir du matching (couvert = 1, partiel = ½) :
- Couverture du besoin réel = 30 × (couverts + ½ partiels) / nombre de points `N` ;
- Contraintes implicites identifiées = 15 × (couvertes + ½ partielles) / nombre de points `C` (note du LLM conservée si le scénario n'a aucune contrainte).

Stockage **sans migration** : le matching est joint aux deux critères concernés dans le JSON `criteria`, dont le format `[{ name, score, maxScore, comment }]` reste inchangé :

```json
{ "name": "Couverture du besoin réel", "score": 15, "maxScore": 30, "comment": "…",
  "matching": { "points": [{ "id": "N1", "status": "COVERED", "requirementCodes": ["EF-01"], "confidence": 0.83 }],
                "unmatchedCodes": ["EF-02"] } }
```

L'interface (`MatchingPanel`) affiche « Point clé 1 : Couvert — EF-01 » sans jamais afficher le texte du point.

## Grille d'évaluation (prompt v0.3)

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
- Le matching ne renvoie que des identifiants (`N1`, `C1`), des statuts et des codes d'exigences : le texte des points ne quitte jamais le serveur.
- Les codes (EF-01, ENF-01, US-01) sont stables : une nouvelle exigence prend le plus grand numéro de son type + 1, sans renumérotation après une suppression, pour comparer les versions.

## Limites et pistes

- Le mock du matching compare des mots (racines de 5 lettres) et ne comprend pas le sens : il ne reconnaît pas un synonyme. Le vrai matching est à tester avec une clé API.
- Le nombre de points clés et de contraintes est visible par l'étudiant (« 1 / 2 couverts ») : il sait combien il en reste à trouver, sans savoir lesquels.
- Le découpage par phrase dépend de la rédaction du besoin caché par le module 1 : une phrase qui contient deux idées compte pour un seul point.
- Deux appels au LLM par évaluation au lieu d'un (temps et coût).
- Le contexte de l'entretien (`InterviewMessage`) n'est pas encore transmis au prompt d'évaluation.
- Pas de comparaison visuelle (diff) entre deux versions.
