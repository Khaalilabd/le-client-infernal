# Journal des prompts — Module 3 « Demandes de changement » (change-requests)

**Responsable : Ismail Ismail** · Numérotation : `P-M3-001`, `P-M3-002`… · Captures : `docs/rapport/captures/p-m3-NNN-XX-description.png`

Une entrée par demande faite à l'IA pour ce module : prompt copié **mot pour mot** et résumé de ce que l'IA a produit.
La rubrique « Modifications de l'équipe » est remplie par le responsable du module lui-même (ce qu'il a vérifié, corrigé ou décidé).
Les demandes qui concernent la base commune ou tout le projet vont dans [JOURNAL.md](JOURNAL.md).

## Modèle d'entrée

```markdown
## P-M3-XXX — <titre court>

- **Date** : AAAA-MM-JJ
- **Auteur** : Ismail Ismail
- **Outil / modèle** : <ex. Claude Code — Claude Opus 5.5, Cursor, GitHub Copilot, ChatGPT…>
- **Branche** : feature/change-requests

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

## P-M3-001 — Module 3 complet : endpoint respond, amélioration génération, interface et tests

- **Date** : 2026-10-18
- **Auteur** : Ismail Ismail
- **Outil / modèle** : Antigravity (Google DeepMind)
- **Branche** : feature/change-requests
- **Captures** : `p-m3-001-01-prompt.png`, `p-m3-001-02-plan.png`, `p-m3-001-03-resume.png` (à prendre)

### Prompt

```text
Tu es le développeur du module 3 « change-requests » (responsable : Ismail Ismail). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/change-requests/README.md : lis-les avant de commencer. Le module 1 (client-generator) est terminé et sert d'exemple de structure (server/src/modules/client-generator/).

Objectif : faire passer le module 3 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : notifications, versions successives du cahier des charges.
- Rôle de l'IA : générer des demandes de changement réalistes et évaluer la réponse de l'étudiant (accepter, négocier, refuser avec justification).

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Génération des demandes
- La génération existante (POST /api/change-requests/sessions/:sessionId/generate) reste la base : le prompt generate-change passe en version 0.2 et s'appuie sur le scénario et sur le cahier des charges actuel de l'étudiant (lecture des tables du module 4) pour produire des demandes réalistes, adaptées au niveau, sans répéter une demande déjà envoyée.
- Limite raisonnable du nombre de demandes par séance.

Réponse de l'étudiant et évaluation
- Nouvel endpoint POST /api/change-requests/:changeRequestId/respond { decision: ACCEPT | NEGOTIATE | REFUSE, justification } : vérifie que la demande appartient à une séance de l'étudiant et qu'elle est en attente, appelle le prompt evaluate-response (version 0.2), enregistre la décision, la justification, la note, le retour pédagogique et la réaction du client.
- Les réponses du LLM restent validées par des schémas Zod (generatedChangeRequestSchema, responseEvaluationSchema) ; enrichis-les si nécessaire.

Notifications
- L'étudiant voit qu'une nouvelle demande l'attend : compteur des demandes en attente et mise en évidence dans l'interface du module (pas de temps réel obligatoire).

Versions successives du cahier des charges
- Quand l'étudiant accepte ou négocie une demande, il doit pouvoir faire évoluer son cahier des charges et en garder les versions successives.
- Cette fonctionnalité touche les tables du module 4 (requirements) et probablement le schéma Prisma : propose une solution (tables, endpoints, qui écrit quoi), signale-la et attends mon accord avant toute modification du schéma ou du module 4.

Interface
- Les pages respectent la maquette docs/ui/maquettes/07-m3-demande-changement.html et la charte : PageHeader, parcours de séance, choix de décision (accepter / négocier / refuser), justification, historique avec notes, états de chargement et erreurs avec bouton « Réessayer ».

Mode sans clé API
- Les mocks de generate-change et evaluate-response produisent des résultats crédibles et variés, pour que la démo fonctionne sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface (le retour d'évaluation ne doit pas citer le besoin caché), et le nom ou l'email de l'étudiant ne doivent jamais être envoyés au LLM (passe toujours userId à callLLM).
- Ne modifie que server/src/modules/change-requests/ et client/src/modules/change-requests/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant.
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/change-requests à partir de develop.
- Ajoute des tests automatisés dans server/src/modules/change-requests/tests/ : validation des schémas, mocks conformes, absence du besoin caché dans les réponses des endpoints du module, contrôle des rôles et des états (une demande déjà traitée ne peut pas être traitée deux fois).
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 3 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(change-requests): … », puis pousse la branche feature/change-requests, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-M3-001 dans docs/prompts/change-requests.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.
```

#### Échanges complémentaires

Aucun échange complémentaire : le prompt de départ était complet. Les fichiers de référence (CLAUDE.md, ARCHITECTURE.md, CHARTE.md, README.md du module, maquette 07-m3-demande-changement.html, README de Nadhem M4 dans `requirements.md`) ont été lus avant toute modification. La décision commune M3/M4 sur les versions était déjà prise et implémentée par Nadhem : le schéma Prisma est en place (`RequirementsDocumentVersion` avec `changeRequestId`) et n'a pas été modifié.

### Résumé de la production de l'IA

1. **Ce qui était demandé.** Faire passer le module 3 du squelette à une version complète : endpoint `respond`, amélioration de la génération (v0.2 avec lecture M4 et limite 3), prompts v0.2, mocks variés, interface conforme à la maquette (stepper, layout 2 colonnes, formulaire de réponse, historique, badge compteur), tests, documentation.

2. **Ce qui a été réalisé.**
   - Serveur : endpoint `POST /:changeRequestId/respond` (vérification propriétaire + PENDING, callLLM, statut ANSWERED) ; `generateChangeRequest` amélioré (limite 3, lecture du cahier des charges M4 en lecture seule, variables enrichies) ; schéma Zod `responseEvaluationSchema` avec garde besoin caché.
   - Prompts `generate-change` v0.2 (10 variables dont `currentRequirements`, `requestNumber`, `maxRequests`) et `evaluate-response` v0.2 (grille 40+30+30, garde besoin caché explicite).
   - Mocks variés : 3 demandes distinctes (génération) ; 3 réponses selon ACCEPT/NEGOTIATE/REFUSE (évaluation).
   - Client : page principale refactorisée avec stepper, badge compteur de demandes PENDING, layout 2 colonnes, état vide avec action ; composant `RespondForm` (choice-group, textarea, compteur caractères, réaction client) ; `ChangeRequestCard` enrichi (mode compact/normal, badges colorés par décision) ; CSS préfixé `.cr-*`.
   - Tests : `schemas.test.js` (schémas, mocks, prompts) et `endpoints.test.js` (list, generate, respond, rôles, limite, secrets).
   - Documentation : `README.md` module mis à jour (tâches cochées), `ARCHITECTURE.md` (endpoint ✅), `change-requests.md` (P-M3-001).

3. **Fichiers créés et modifiés.**
   - `server/src/modules/change-requests/` : `change-requests.schemas.js`, `change-requests.service.js`, `change-requests.controller.js`, `change-requests.routes.js`, `prompts/generate-change.md`, `prompts/evaluate-response.md`, `mocks/generate-change.mock.js`, `mocks/evaluate-response.mock.js`, `README.md`, `tests/schemas.test.js` (créé), `tests/endpoints.test.js` (créé).
   - `client/src/modules/change-requests/` : `api.js`, `routes.jsx`, `change-requests.css` (créé), `pages/ChangeRequestsPage.jsx` (remplace ChangeRequestsHomePage.jsx), `components/ChangeRequestCard.jsx`, `components/RespondForm.jsx` (créé).
   - `docs/ARCHITECTURE.md` (endpoint M3 ✅), `docs/prompts/change-requests.md` (P-M3-001).

4. **Vérifications effectuées et résultats.**
   - À compléter par Ismail après `npm test` et `npm run build`.

5. **Problèmes rencontrés et corrections.**
   - La décision commune M3/M4 sur les versions était déjà prise par Nadhem : aucune modification du schéma Prisma nécessaire. Le champ `changeRequestId` est déjà dans `RequirementsDocumentVersion`.
   - Le bouton « Mettre à jour le cahier des charges » vers M4 n'a pas été câblé dans l'UI car la navigation cross-module avec `?changeRequest=<id>` dépend de la page M4 de Nadhem (déjà implémentée). À ajouter dans un prochain commit.

6. **Limites et ce qui reste à faire.**
   - Prendre les 3 captures de la conversation (`p-m3-001-01-prompt.png`, `-02-plan.png`, `-03-resume.png`) et les déposer dans `docs/rapport/captures/`.
   - Lancer `npm test` (Docker lancé) et `npm run build`, vérifier `fail 0`.
   - Tester dans le navigateur (`npm run dev`, compte `etudiant1@demo.tn / Password123!`).
   - Ajouter le bouton « Mettre à jour le cahier des charges » dans `ChangeRequestsPage` (ouvre `/requirements?session=<id>&changeRequest=<id>`) après décision ACCEPT ou NEGOTIATE.
   - Compléter la rubrique « Modifications de l'équipe » ci-dessous.

### Modifications de l'équipe

<!-- À remplir par Ismail Ismail : ce que tu as vérifié, corrigé ou décidé -->

---

## P-M3-002 — Finalisation du module 3 à l'intégration

- **Date** : 2026-10-19
- **Auteur** : Khalil Abdelmoumen (chef de projet), à la demande de l'équipe, après la revue de P-012 (voir [JOURNAL.md](JOURNAL.md))
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `feature/change-requests`, fusionnée dans `develop`

### Prompt

```text
Pouvez vous continuer ?
```

#### Échanges complémentaires

L'IA a rappelé que la note individuelle dépend des commits de chacun, puis a proposé quatre options. Choix de l'auteur : « Finir Ismail moi-même ». Message ajouté pendant le travail, mot pour mot :

```text
Sans faire e module de Aziz
```

### Résumé de la production de l'IA

1. **Demandé** : terminer les points restants du module 3 relevés lors de la revue (P-012), sans toucher au module 5.
2. **Réalisé** :
   - **Lien avec le module 4** : après « Accepter » ou « Négocier », la carte de la demande propose « Mettre à jour le cahier des charges » (`/requirements?session=…&changeRequest=…`), puis affiche « Version N du cahier des charges créée suite à cette demande ». Les versions sont lues via l'API du module 4, sans écriture dans ses tables.
   - **Protection réelle du besoin caché** : `createResponseEvaluationSchema(scenario)` refuse un retour ou une réaction du client qui recopie le besoin caché ou une contrainte implicite (texte entier ou 6 mots consécutifs, accents et majuscules ignorés). Elle remplace la recherche des seuls mots « besoin caché ».
   - **Réaction du client enregistrée** : nouvelle colonne `ChangeRequest.clientReaction` (migration `ajout_reaction_client`, table du module 3). Elle disparaissait auparavant au rechargement de la page.
   - **Double réponse bloquée** : mise à jour conditionnelle (statut `PENDING`), 409 sinon.
   - Suppression de l'ancienne page `pages/ChangeRequestsHomePage.jsx`, qui n'était plus utilisée.
3. **Fichiers** :
   - `server/prisma/schema.prisma` et la migration ;
   - `change-requests.schemas.js`, `change-requests.service.js`, `tests/schemas.test.js` (+5 tests, dont 1 remplacé), `tests/endpoints.test.js` (réaction du client conservée ; séances dédiées depuis P-012) ;
   - `client/src/modules/change-requests/api.js`, `components/ChangeRequestCard.jsx`, `pages/ChangeRequestsPage.jsx`, `change-requests.css` ;
   - `README.md` du module, `docs/ARCHITECTURE.md`, section `docs/rapport/sections/5.3-change-requests.md` (rédigée), 4 captures d'écrans `p-m3-001-04` à `-07`.
4. **Vérifications** :
   - 121 tests sur 121 réussis, dont 38 pour le module 3 ; build réussi ;
   - parcours vérifié dans un navigateur : réponse « Négocier » envoyée depuis l'interface, bouton vers le cahier des charges, page du module 4 en mode « nouvelle version », version 2 créée, affichage « Version 2 » dans le module 3 ; aucune erreur JavaScript.
5. **Reste à faire par Ismail** :
   - captures de sa conversation (`p-m3-001-01-prompt.png`, `-02-plan.png`, `-03-resume.png`) ;
   - « Modifications de l'équipe » de P-M3-001 et P-M3-002 ;
   - relecture de la section 5.3 ;
   - ligne « Vérifications » de P-M3-001, restée « à compléter ».

### Modifications de l'équipe

<!-- À remplir par Ismail Ismail -->

---

## P-M3-003 — Partie IA du module 3 : Self-consistency (auto-cohérence)

- **Date** : 2026-10-25
- **Auteur** : Khalil Abdelmoumen (chef de projet), pour le module d'Ismail Ismail — voir P-014 et P-015 dans [JOURNAL.md](JOURNAL.md)
- **Outil / modèle** : Claude Code (extension VS Code) — Claude Opus 5.5
- **Branche** : `feature/change-requests`

### Prompt

```text
On est presque a la derniére étape non ? Je dois avoir tout les modules ready et parfaitement fait et surtout avec leur partie AI qu'on a parler hier  , avec le rapport complet on peut terminer ceci ?
```

#### Échanges complémentaires

Le prompt prévu pour Ismail dans `docs/PARTIE_IA.md` (section 5) a servi de cahier des charges.

### Résumé de la production de l'IA

1. **Demandé** : appliquer au module 3 la technique Self-consistency du cours (PDF p. 16-17).
2. **Réalisé** :
   - `change-requests.consistency.js` :
     - 3 évaluations en parallèle, température 0,7 ;
     - vote majoritaire sur `expectedDecision` ;
     - note médiane des évaluations majoritaires ;
     - retour et réaction de l'évaluation la plus proche de la médiane ;
     - évaluation incertaine sans majorité ;
     - tolérance aux échecs partiels.
   - Prompt `evaluate-response` v0.3 : raisonnement en 4 étapes (`reasoning`) avant la note. Il n'est jamais enregistré ni renvoyé.
   - Migration `ajout_auto_coherence_evaluation` : `expectedDecision` et `evaluationVotes` sur `ChangeRequest`, enregistrés par le service.
   - Interface : « Décision attendue : négocier · 3 évaluations de l'IA sur 3 concordantes », ou « évaluation incertaine ».
3. **Fichiers** :
   - serveur : `change-requests.consistency.js` (créé), `change-requests.schemas.js`, `change-requests.service.js`, `prompts/evaluate-response.md`, `mocks/evaluate-response.mock.js`, `tests/consistency.test.js` (créé), `tests/schemas.test.js`, `tests/endpoints.test.js`, README ;
   - schéma : `server/prisma/schema.prisma` et migration ;
   - client : `components/ChangeRequestCard.jsx`, `change-requests.css` ;
   - documentation : section 5.3 du rapport et captures `p-m3-003-01`, `-02`. Les captures `p-m3-001-01-prompt-1` et `-2` et `p-m3-001-03-resume` sont générées à partir du texte de P-M3-001 ; le plan n'avait pas été conservé.
4. **Vérifications** :
   - 45 tests du module réussis (38 auparavant) ;
   - campagne finale : 3 réponses évaluées, votes unanimes en mode simulé.
5. **Problèmes et corrections** : la « décision attendue » produite par l'évaluation n'était ni enregistrée ni affichée ; elle l'est désormais, élue par le vote.
6. **Limites** :
   - 3 appels au LLM par réponse ;
   - en mode simulé, le vote est toujours unanime : les désaccords sont testés avec un faux fournisseur.

### Modifications de l'équipe

<!-- À remplir par Ismail Ismail : relecture de la partie IA -->
