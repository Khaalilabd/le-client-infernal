# Module 1 — client-generator

**Responsable : Khalil Abdelmoumen** · Branche : `feature/client-generator`

Génère avec le LLM un **scénario** de client fictif selon un domaine et un niveau : client, personnalité, contexte, besoin exprimé, **besoin caché** et **contraintes implicites**. Ce scénario alimente ensuite tous les autres modules.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `client-generator.routes.js` | routes `/api/client-generator/*` |
| | `client-generator.controller.js` | lecture de la requête / réponse |
| | `client-generator.service.js` | génération (callLLM), enregistrement, lecture |
| | `client-generator.schemas.js` | Zod : entrées HTTP + `generatedScenarioSchema` (sortie du LLM) |
| | `prompts/generate-scenario.md` | prompt système (brouillon v0.1) |
| | `mocks/generate-scenario.mock.js` | réponse simulée (fournisseur mock) |
| Client | `client/src/modules/client-generator/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/ClientGeneratorHomePage.jsx` | formulaire de génération + liste des scénarios |
| | `components/ScenarioCard.jsx` | carte d'un scénario |

## Tables utilisées

- **`Scenario`** (propriétaire, écriture).
- `User` (lecture : `createdById`).

`hiddenNeed` et `implicitConstraints` sont **secrets**. Ils sont omis par défaut par Prisma, et toute réponse passe par `toPublicScenario()`.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | POST | `/api/client-generator/scenarios` `{ domain, level }` | connecté |
| ✅ | GET | `/api/client-generator/scenarios?domain=&level=` | connecté |
| ✅ | GET | `/api/client-generator/scenarios/:scenarioId` | connecté |
| 🔲 | DELETE | `/api/client-generator/scenarios/:scenarioId` | TEACHER |
| 🔲 | GET | `/api/client-generator/domains` | connecté |

## Tâches

- [ ] Améliorer le prompt `generate-scenario.md` : cohérence entre besoin caché et contexte, difficulté réellement graduée, variété des personnalités.
- [ ] Éviter les doublons : passer au prompt les titres des scénarios déjà existants pour le même domaine.
- [ ] Enrichir le schéma Zod si nécessaire (ex. `difficultyHints`, `stakeholders`). Toute modification de la table `Scenario` passe par une migration et doit être signalée.
- [ ] Endpoint de suppression réservé à l'enseignant ; endpoint de domaines suggérés.
- [ ] Côté client : filtres par domaine et niveau, page de détail d'un scénario, état « génération en cours » plus visible.
- [ ] Tester avec un vrai fournisseur (`AI_PROVIDER=claude` ou `openai`) et comparer les sorties dans le journal des prompts.
- [ ] Garder `mocks/generate-scenario.mock.js` conforme au schéma.
- [ ] Tracer chaque version du prompt dans `docs/prompts/JOURNAL.md`.
