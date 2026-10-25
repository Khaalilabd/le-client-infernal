# Module 1 — client-generator

**Responsable : Khalil Abdelmoumen** · Branche : `feature/client-generator` · Version : **0.3** (prompt P-M1-001)

Génère avec le LLM un **scénario** de client fictif selon un **domaine**, un **niveau** et une **personnalité** : client, personnalité, contexte, besoin exprimé, **besoin caché** et **contraintes implicites**. Ce scénario alimente tous les autres modules.

Depuis la v0.3, la génération s'appuie sur une **base de connaissances métier** (RAG, technique du cours vue en Séance 4) : voir [`knowledge/README.md`](knowledge/README.md) et la section « RAG » ci-dessous.

## Fonctionnalités

| Fonctionnalité | État |
|---|---|
| Choix du domaine (saisie libre + 12 domaines suggérés) | ✅ |
| Choix du niveau (débutant, intermédiaire, avancé) | ✅ |
| Choix de la personnalité : 6 profils (coopératif, pressé, méfiant, bavard, contradictoire, indécis) ou aléatoire | ✅ |
| Base de connaissances : 12 fiches métier (une par domaine suggéré, 36 situations) | ✅ |
| RAG : recherche par similarité cosinus, top-2 diversifié (MMR) par rapport aux scénarios existants | ✅ |
| Génération par le LLM avec le prompt v0.3 (fiches métier, sources citées, personnalité imposée, difficulté graduée, anti-doublons) | ✅ |
| Validation Zod renforcée : besoin caché ≠ besoin exprimé, nombre de contraintes conforme au niveau, sources parmi les fiches fournies | ✅ |
| Encadré « apport du RAG » après chaque génération (nombre de fiches, mode de vectorisation, jamais leur contenu) | ✅ |
| Formulaire pré-rempli par l'adresse (`?domain=&level=&personality=`), utilisé par la recommandation du module 5 (P-M1-002) | ✅ |
| Liste filtrable (domaine, niveau, personnalité) avec état vide | ✅ |
| Page de détail publique avec « Démarrer une séance » | ✅ |
| Suppression réservée à l'enseignant, refusée si le scénario est utilisé (409) | ✅ |
| Mock : lit les fiches injectées dans le prompt ; gabarits pour un domaine sans fiche | ✅ |

## RAG (génération augmentée par recherche)

| Étape | Réalisation | Fichier |
|---|---|---|
| 1. Découpage | Un bloc par situation des fiches (chevauchement d'une ligne au-delà de 220 mots) | `rag/knowledgeBase.js` |
| 2. Vectorisation | Embeddings du service partagé (`embedTexts`, OpenAI ou Ollama) ; sinon TF-IDF local | `shared/ai/embeddings.js`, `rag/vectorizer.js` |
| 3. Recherche | Similarité cosinus avec le domaine, seuil de pertinence, MMR contre les scénarios existants du domaine | `rag/similarity.js`, `rag/retriever.js` |
| 4. Génération | Blocs `[identifiant]` dans `{{knowledge}}` ; le LLM cite ses sources (`knowledgeSources`), vérifiées par Zod | `prompts/generate-scenario.md`, `client-generator.schemas.js` |

- Les vecteurs des fiches sont calculés une seule fois par démarrage du serveur.
- Si les embeddings échouent (quota, clé refusée…), le module utilise la vectorisation locale pendant 5 minutes : la génération n'est jamais bloquée.
- Les seuils de pertinence sont dans `rag/retriever.js` (`RELEVANCE`) : ceux des embeddings sont à recalibrer avec le modèle choisi.
- Les fiches ne sortent jamais du serveur : la réponse de l'API ne contient que `{ mode, engine, retrieved, used, domains }`.
- Pour enrichir la base : ajouter une section `##` dans une fiche, au format de `knowledge/README.md` ; les tests vérifient le format.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `client-generator.routes.js` | routes `/api/client-generator/*` |
| | `client-generator.controller.js` | lecture de la requête / réponse |
| | `client-generator.service.js` | options, génération (RAG + callLLM), liste filtrée, détail, suppression |
| | `client-generator.schemas.js` | Zod : entrées HTTP, `generatedScenarioSchema`, `createGeneratedScenarioSchema(level, { allowedSources })` |
| | `client-generator.catalog.js` | niveaux, profils, domaines, contraintes attendues par niveau |
| | `data/personalities.json`, `data/domains.json` | catalogue éditable (libellés, descriptions, comportement attendu) |
| | `knowledge/*.md` | base de connaissances : une fiche métier par domaine (format dans `knowledge/README.md`) |
| | `rag/knowledgeBase.js` | lecture des fiches et découpage en blocs |
| | `rag/vectorizer.js` | vectorisation locale TF-IDF |
| | `rag/similarity.js` | similarité cosinus et sélection MMR |
| | `rag/retriever.js` | recherche des fiches (embeddings ou TF-IDF), mise en forme pour le prompt |
| | `prompts/generate-scenario.md` | prompt système v0.3 |
| | `prompts/level-*.md` | règles de difficulté par niveau (injectées dans `{{levelRules}}`) |
| | `mocks/generate-scenario.mock.js`, `mocks/scenario-templates.js` | réponses simulées (à partir des fiches, ou gabarits) |
| | `tests/schemas.test.js`, `tests/rag.test.js`, `tests/endpoints.test.js` | tests du module (`npm test`) |
| Client | `client/src/modules/client-generator/routes.jsx` | routes `/client-generator` et `/client-generator/:scenarioId` |
| | `api.js` | appels HTTP |
| | `pages/ClientGeneratorHomePage.jsx` | formulaire, filtres, liste |
| | `pages/ScenarioDetailPage.jsx` | fiche publique du client |
| | `components/GenerateScenarioForm.jsx`, `ScenarioFilters.jsx`, `ScenarioCard.jsx` | composants (dont l'encadré du RAG) |
| | `hooks/useClientGeneratorOptions.js`, `hooks/useScenarioActions.js` | options, démarrer une séance, supprimer |
| | `client-generator.css` | styles propres au module (préfixe `cg-`) |

Base commune (signalé, P-M1-001) : `server/src/shared/ai/embeddings.js` (nouveau), variables `AI_EMBEDDING_PROVIDER` et `AI_EMBEDDING_MODEL` (`server/src/config/env.js`, `server/.env.example`), code d'erreur `AI_EMBEDDINGS_UNAVAILABLE`, tests `server/tests/embeddings.test.js`.

## Tables utilisées

- **`Scenario`** (propriétaire, écriture). Le profil de personnalité choisi est stocké dans `personality.profile` (JSON) : **aucune migration**. Les sources du RAG ne sont pas enregistrées.
- `TrainingSession` (lecture : comptage avant suppression ; création via l'API commune `/api/sessions`).

`hiddenNeed` et `implicitConstraints` sont **secrets** : omis par défaut par Prisma, toute réponse passe par `toPublicScenario()`. Les tests vérifient qu'ils n'apparaissent dans aucune réponse, sans compter sur le filet `responseGuard`.

## Endpoints

| | Méthode | Route | Rôle | Requête → Réponse |
|---|---|---|---|---|
| ✅ | GET | `/api/client-generator/options` | connecté | → `{ domains, levels, personalities }` |
| ✅ | POST | `/api/client-generator/scenarios` | connecté | `{ domain, level, personality? }` (`RANDOM` par défaut) → `201 { scenario, knowledge }` |
| ✅ | GET | `/api/client-generator/scenarios?domain=&level=&personality=` | connecté | → `{ scenarios }` |
| ✅ | GET | `/api/client-generator/scenarios/:scenarioId` | connecté | → `{ scenario }` |
| ✅ | DELETE | `/api/client-generator/scenarios/:scenarioId` | TEACHER | → `204`, `409 SCENARIO_IN_USE` si des séances l'utilisent |

`knowledge` = `{ mode: 'embeddings' | 'local', engine, retrieved, used, domains }`.

## Prompt

| Version | Prompt du journal | Évolution |
|---|---|---|
| v0.1 | P-001 | brouillon initial |
| v0.2 | P-005 | personnalité imposée, difficulté graduée (fragments `level-*.md`), besoin caché cohérent et découvrable, anti-doublons (titres existants du domaine) |
| v0.3 | P-M1-001 | RAG : fiches métier dans `{{knowledge}}`, faits du secteur pris uniquement dans les fiches, sources citées (`knowledgeSources`) |

## Tâches restantes

- [ ] Tester le prompt v0.3 et les embeddings avec un vrai fournisseur (`OPENAI_API_KEY` ou Ollama), recalibrer `RELEVANCE.embeddings` et comparer les sorties dans le journal.
- [ ] Enrichir la base de connaissances (plus de situations par domaine).
- [ ] Pagination de la liste si le nombre de scénarios devient important.
