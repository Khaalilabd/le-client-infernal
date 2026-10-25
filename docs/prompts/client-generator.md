# Journal des prompts — Module 1 « Générateur de clients » (client-generator)

**Responsable : Khalil Abdelmoumen** · Numérotation : `P-M1-001`, `P-M1-002`… · Captures : `docs/rapport/captures/p-m1-NNN-XX-description.png`

Une entrée par demande faite à l'IA pour ce module : prompt copié **mot pour mot** et résumé de ce que l'IA a produit.
La rubrique « Modifications de l'équipe » est remplie par le responsable du module lui-même (ce qu'il a vérifié, corrigé ou décidé).
Les demandes qui concernent la base commune ou tout le projet vont dans [JOURNAL.md](JOURNAL.md).

## Modèle d'entrée

```markdown
## P-M1-XXX — <titre court>

- **Date** : AAAA-MM-JJ
- **Auteur** : Khalil Abdelmoumen
- **Outil / modèle** : <ex. Claude Code — Claude Opus 5.5, Cursor, GitHub Copilot, ChatGPT…>
- **Branche** : feature/client-generator

### Prompt
<prompt copié mot pour mot, dans un bloc ```text>

#### Échanges complémentaires
<questions de l'IA et réponses, mot pour mot>

### Résumé de la production de l'IA
1. Ce qui était demandé.
2. Ce qui a été réalisé.
3. Fichiers créés et modifiés.
4. Vérifications effectuées et résultats.
5. Problèmes rencontrés et corrections.
6. Limites et ce qui reste à faire.

### Modifications de l'équipe
<à remplir par le responsable du module>
```

---

## Historique (avant la création de ce journal)

Les premiers prompts du module 1 sont dans [JOURNAL.md](JOURNAL.md) :
- **P-001** : squelette du module et prompt système v0.1 ;
- **P-004** : rédaction du prompt du module ;
- **P-005** : version complète du module (v0.2) ;
- **P-006** : captures et section 5.1 du rapport.

Les prochains prompts du module 1 sont numérotés à partir de **P-M1-001** dans ce fichier.

---

## P-M1-001 — Partie IA du module 1 : RAG (génération augmentée par recherche)

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : feature/client-generator

### Prompt

```text
J'aimerai que vous commencez a travailler mon module et désque vous avez complter et réussi dîtes le moi
```

#### Échanges complémentaires

Cette demande fait suite à P-014 (JOURNAL.md) : la technique du cours retenue pour le module 1 est le RAG (Séance 4), et l'IA avait proposé de vectoriser par l'API du fournisseur quand une clé est configurée, et localement en mode mock.

### Résumé de la production de l'IA

1. **Demandé** : appliquer au module 1 la technique du cours attribuée dans `docs/PARTIE_IA.md` (RAG), jusqu'à une version vérifiée, documentée et prête pour le rapport.
2. **Réalisé** :
   - **base de connaissances** : 12 fiches métier Markdown (une par domaine suggéré), 36 situations au même format (organisation, interlocuteur, sujet, situation actuelle, demande typique, besoin réel, 5 contraintes, outils existants), sans organisation ni loi inventée ;
   - **pipeline RAG du cours** :
     - découpage en blocs avec chevauchement ;
     - vectorisation par embeddings (service partagé) ou TF-IDF local ;
     - similarité cosinus, seuil de pertinence et sélection MMR, qui écarte les situations déjà exploitées par les scénarios existants du domaine ;
     - injection des blocs dans le prompt ;
   - **prompt système v0.3** : section « Fiches métier » (`{{knowledge}}`), faits du secteur pris uniquement dans les fiches, sources citées (`knowledgeSources`) ;
   - **Zod** : les sources doivent faire partie des fiches fournies, au moins une si des fiches existent ;
   - **API** : `POST /scenarios` renvoie `{ scenario, knowledge }`. `knowledge` donne le mode, le nombre de fiches retrouvées et utilisées, et leur domaine, mais jamais leur contenu ni leur identifiant ;
   - **interface** : encadré « Client généré à partir de la base de connaissances (RAG) » après chaque génération ;
   - **mock** : il lit les fiches injectées dans le prompt, comme le LLM, et accorde le nom du client à sa fonction ;
   - **base commune (signalée)** : service d'embeddings partagé (`embedTexts`, fournisseurs OpenAI et Ollama, mêmes garanties que `callLLM`), code `AI_EMBEDDINGS_UNAVAILABLE`, variables `AI_EMBEDDING_PROVIDER` et `AI_EMBEDDING_MODEL`. Si les embeddings échouent, le module bascule sur la vectorisation locale pendant 5 minutes.
3. **Fichiers** :
   - créés :
     - `server/src/modules/client-generator/knowledge/` (README + 12 fiches) ;
     - `rag/knowledgeBase.js`, `rag/vectorizer.js`, `rag/similarity.js`, `rag/retriever.js` ;
     - `tests/rag.test.js` ;
     - `server/src/shared/ai/embeddings.js`, `server/tests/embeddings.test.js` ;
     - captures `p-m1-001-02-ecran-rag.png` et `p-m1-001-03-prompt-fiches.png` ;
   - modifiés :
     - module : `client-generator.service.js`, `.controller.js`, `.schemas.js`, `prompts/generate-scenario.md`, `mocks/generate-scenario.mock.js`, `tests/schemas.test.js`, `tests/endpoints.test.js`, README ;
     - client : `api.js`, `GenerateScenarioForm.jsx`, `client-generator.css` ;
     - base commune : `shared/ai/index.js` (exports), `shared/ai/errors.js`, `config/env.js`, `server/.env.example` ;
     - documentation : `CLAUDE.md` (mémo technique), `docs/ARCHITECTURE.md`, `docs/PARTIE_IA.md`, section 5.1 et chapitres 3.6 et 6 du rapport (`scripts/rapport/generer-rapport.cjs`), `docs/rapport/captures/README.md`.
4. **Vérifications** :
   - `npm test` : 148 tests sur 148 réussis (base commune 23, M1 35, M2 26, M3 38, M4 26) ;
   - `npm run build` réussi ;
   - calibrage des scores de similarité sur les 12 domaines et sur des domaines inconnus ;
   - parcours réel dans l'application : deux générations « Santé » successives ont exploité deux situations différentes, car celle du scénario de démonstration était déjà prise. Un domaine inconnu (« Aéronautique ») ne retrouve aucune fiche. Aucun contenu de fiche n'apparaît dans les réponses. Les scénarios de test ont été supprimés ensuite ;
   - captures réalisées dans Chrome sans interface ;
   - rapport régénéré et validé (63 figures, 29 tableaux).
5. **Problèmes et corrections** :
   - la vérification visuelle a révélé des guillemets imbriqués dans l'encadré et des noms mal accordés à la fonction dans le mock ; les deux ont été corrigés ;
   - le test du prompt v0.2 échouait sans la nouvelle variable `{{knowledge}}` ; il a été mis à jour pour la v0.3.
6. **Limites** :
   - pas de test avec un vrai fournisseur (aucune clé API) : les seuils des embeddings sont à recalibrer ;
   - la vectorisation TF-IDF est lexicale : « Transport aérien » retrouve aussi une fiche du commerce ;
   - 36 situations seulement, qui se répètent après trois générations dans un même domaine ;
   - à faire par l'auteur : capture `p-m1-001-01-prompt.png` (prompt et résumé final).

### Modifications de l'équipe

<!-- À remplir par le responsable du module -->

---

## P-M1-002 — Formulaire pré-rempli par la recommandation du tableau de bord

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `develop` (dans le cadre de P-015, voir [JOURNAL.md](JOURNAL.md))

### Prompt

```text
On est presque a la derniére étape non ? Je dois avoir tout les modules ready et parfaitement fait et surtout avec leur partie AI qu'on a parler hier  , avec le rapport complet on peut terminer ceci ?
```

### Résumé de la production de l'IA

1. **Demandé** : relier la recommandation du module 5 au générateur (le bouton « Lancer ce scénario » ne pré-remplissait rien).
2. **Réalisé** :
   - `GenerateScenarioForm.jsx` lit `?domain=&level=&personality=` ; le niveau et la personnalité ne sont retenus que s'ils existent dans les options ;
   - un encadré signale « Scénario recommandé par votre tableau de bord ».
3. **Fichiers** :
   - `client/src/modules/client-generator/components/GenerateScenarioForm.jsx` ;
   - README ;
   - section 5.1 du rapport (capture `p-m1-002-01`, capture `p-m1-001-01-prompt` générée à partir du journal).
4. **Vérifications** :
   - build réussi ;
   - capture dans le navigateur avec « Éducation · débutant · client méfiant ».
5. **Problèmes** : aucun.
6. **Limites** : aucune.

### Modifications de l'équipe

<!-- À remplir par le responsable du module -->

---

## P-M1-003 — Calibrage du RAG pour les embeddings Gemini

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `develop` (dans le cadre de P-016, voir [JOURNAL.md](JOURNAL.md))

### Prompt

```text
Peut on lancer le tesst icisi j'ai une cé geminie ?
```

### Résumé de la production de l'IA

1. **Demandé** : tester le module avec un vrai LLM (Gemini), dans le cadre du parcours complet.
2. **Réalisé** :
   - mesure des scores de similarité de `gemini-embedding-001` pour les 12 domaines suggérés et 6 domaines sans fiche : 0,62 à 0,76 pour les bons blocs, 0,49 à 0,62 pour les autres ;
   - la règle générale (0,3 et 85 % du meilleur) laissait passer 9 blocs d'autres fiches pour Santé, et les 36 blocs pour Aéronautique ;
   - nouvelle règle propre au modèle dans `RELEVANCE` : score d'au moins 0,6, à moins de 0,03 du meilleur. Un domaine sans fiche n'en retrouve aucune (meilleur score 0,59 pour Aéronautique) ;
   - génération réelle : « Le Grenier Gourmand », appuyé sur une fiche Restauration ; besoin caché reformulé (au plus 4 mots consécutifs identiques à la fiche, sur 27).
3. **Fichiers** : `rag/retriever.js`, `tests/rag.test.js`, `README.md`, section 5.1 du rapport.
4. **Vérifications** : 36 tests du module, dont 1 nouveau (règle par modèle) ; 241 tests au total.
5. **Problèmes** : aucun.
6. **Limites** : une seule génération testée avec Gemini ; la règle générale reste à recalibrer pour tout autre modèle d'embeddings.

### Modifications de l'équipe

<!-- À remplir par le responsable du module -->
