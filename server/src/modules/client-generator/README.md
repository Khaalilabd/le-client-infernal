# Module 1 — client-generator

**Responsable : Khalil Abdelmoumen** · Branche : `feature/client-generator` · Version : **0.2** (prompt P-005)

Génère avec le LLM un **scénario** de client fictif selon un **domaine**, un **niveau** et une **personnalité** : client, personnalité, contexte, besoin exprimé, **besoin caché** et **contraintes implicites**. Ce scénario alimente tous les autres modules.

## Fonctionnalités

| Fonctionnalité | État |
|---|---|
| Choix du domaine (saisie libre + 12 domaines suggérés) | ✅ |
| Choix du niveau (débutant, intermédiaire, avancé) | ✅ |
| Choix de la personnalité : 6 profils (coopératif, pressé, méfiant, bavard, contradictoire, indécis) ou aléatoire | ✅ |
| Génération par le LLM avec le prompt v0.2 (personnalité imposée, difficulté graduée, anti-doublons) | ✅ |
| Validation Zod renforcée : besoin caché ≠ besoin exprimé, nombre de contraintes conforme au niveau | ✅ |
| Liste filtrable (domaine, niveau, personnalité) avec état vide | ✅ |
| Page de détail publique avec « Démarrer une séance » | ✅ |
| Suppression réservée à l'enseignant, refusée si le scénario est utilisé (409) | ✅ |
| Mock varié (5 familles de domaines + générique, 6 profils, 3 niveaux) | ✅ |

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `client-generator.routes.js` | routes `/api/client-generator/*` |
| | `client-generator.controller.js` | lecture de la requête / réponse |
| | `client-generator.service.js` | options, génération (callLLM), liste filtrée, détail, suppression |
| | `client-generator.schemas.js` | Zod : entrées HTTP, `generatedScenarioSchema`, `createGeneratedScenarioSchema(level)` |
| | `client-generator.catalog.js` | niveaux, profils, domaines, contraintes attendues par niveau |
| | `data/personalities.json`, `data/domains.json` | catalogue éditable (libellés, descriptions, comportement attendu) |
| | `prompts/generate-scenario.md` | prompt système v0.2 |
| | `prompts/level-*.md` | règles de difficulté par niveau (injectées dans `{{levelRules}}`) |
| | `mocks/generate-scenario.mock.js`, `mocks/scenario-templates.js` | réponses simulées |
| | `tests/schemas.test.js`, `tests/endpoints.test.js` | tests du module (`npm test`) |
| Client | `client/src/modules/client-generator/routes.jsx` | routes `/client-generator` et `/client-generator/:scenarioId` |
| | `api.js` | appels HTTP |
| | `pages/ClientGeneratorHomePage.jsx` | formulaire, filtres, liste |
| | `pages/ScenarioDetailPage.jsx` | fiche publique du client |
| | `components/GenerateScenarioForm.jsx`, `ScenarioFilters.jsx`, `ScenarioCard.jsx` | composants |
| | `hooks/useClientGeneratorOptions.js`, `hooks/useScenarioActions.js` | options, démarrer une séance, supprimer |
| | `client-generator.css` | styles propres au module (préfixe `cg-`) |

## Tables utilisées

- **`Scenario`** (propriétaire, écriture). Le profil de personnalité choisi est stocké dans `personality.profile` (JSON) : **aucune migration**.
- `TrainingSession` (lecture : comptage avant suppression ; création via l'API commune `/api/sessions`).

`hiddenNeed` et `implicitConstraints` sont **secrets** : omis par défaut par Prisma, toute réponse passe par `toPublicScenario()`. Les tests vérifient qu'ils n'apparaissent dans aucune réponse, sans compter sur le filet `responseGuard`.

## Endpoints

| | Méthode | Route | Rôle | Requête → Réponse |
|---|---|---|---|---|
| ✅ | GET | `/api/client-generator/options` | connecté | → `{ domains, levels, personalities }` |
| ✅ | POST | `/api/client-generator/scenarios` | connecté | `{ domain, level, personality? }` (`RANDOM` par défaut) → `201 { scenario }` |
| ✅ | GET | `/api/client-generator/scenarios?domain=&level=&personality=` | connecté | → `{ scenarios }` |
| ✅ | GET | `/api/client-generator/scenarios/:scenarioId` | connecté | → `{ scenario }` |
| ✅ | DELETE | `/api/client-generator/scenarios/:scenarioId` | TEACHER | → `204`, `409 SCENARIO_IN_USE` si des séances l'utilisent |

## Prompt

| Version | Prompt du journal | Évolution |
|---|---|---|
| v0.1 | P-001 | brouillon initial |
| v0.2 | P-005 | personnalité imposée, difficulté graduée (fragments `level-*.md`), besoin caché cohérent et découvrable, anti-doublons (titres existants du domaine) |

## Tâches restantes

- [ ] Tester le prompt v0.2 avec un vrai fournisseur (`ANTHROPIC_API_KEY` ou `OPENAI_API_KEY`) et comparer les sorties dans le journal.
- [ ] Enrichir le mock avec des familles dédiées pour les domaines suggérés encore génériques (tourisme, immobilier, agriculture…).
- [ ] Pagination de la liste si le nombre de scénarios devient important.
