# Prompt de départ — Module 4 « Cahier des charges » (Nadhem Hmida)

**Comment l'utiliser :** copiez tout le bloc ci-dessous et envoyez-le **tel quel** comme premier message à votre IA (voir `docs/GUIDE_EQUIPE.md`, section 3, selon l'outil). Faites une capture du prompt envoyé, du plan proposé et du résumé final. Ce prompt sera l'entrée **P-M4-001** de `docs/prompts/requirements.md`.

⚠️ **Coordination avec Ismail (module 3)** : il a besoin de « versions successives du cahier des charges », qui touchent vos tables. Mettez-vous d'accord sur la solution (voir `docs/GUIDE_EQUIPE.md`, section 9).

```text
Tu es le développeur du module 4 « requirements » (responsable : Nadhem Hmida). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/requirements/README.md : lis-les avant de commencer. Le module 1 (client-generator) est terminé et sert d'exemple de structure (server/src/modules/client-generator/).

Objectif : faire passer le module 4 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : éditeur structuré du cahier des charges (exigences fonctionnelles, non fonctionnelles, user stories).
- Rôle de l'IA : comparer le cahier des charges au besoin caché et le noter selon une grille (couverture, clarté, ambiguïtés).

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Éditeur structuré
- La lecture et l'enregistrement existants (GET et PUT /api/requirements/sessions/:sessionId/document) restent la base : améliore-les.
- Ajout, modification, suppression et réordonnancement des exigences ; trois types (fonctionnelle, non fonctionnelle, user story) avec une numérotation automatique (EF-01, ENF-01, US-01) ; priorité MoSCoW ; critères d'acceptation pour les user stories ; aide à la rédaction (« En tant que… je veux… afin de… »).
- Soumission du cahier des charges pour évaluation (le document n'est plus modifiable une fois soumis, sauf nouvelle version).

Évaluation par l'IA
- Nouvel endpoint POST /api/requirements/sessions/:sessionId/document/evaluate : lit le besoin caché et les contraintes implicites côté serveur (getScenarioSecrets), appelle le prompt evaluate-document, enregistre une RequirementsEvaluation et passe le document au statut EVALUATED.
- Le prompt evaluate-document passe en version 0.2 avec la grille officielle : couverture du besoin réel, clarté, ambiguïtés (tu peux ajouter des sous-critères si tu les justifies). Les pistes d'amélioration orientent l'étudiant sans jamais révéler le besoin caché ni les contraintes implicites.
- La réponse du LLM reste validée par un schéma Zod (documentEvaluationSchema), à adapter à la grille.
- Historique des évaluations (GET …/document/evaluations).

Versions successives
- Le module 3 a besoin de versions successives du cahier des charges (évolution après une demande de changement). Propose une solution commune (tables, endpoints, qui écrit quoi), signale-la et attends mon accord avant toute modification du schéma Prisma.

Interface
- Les pages respectent les maquettes docs/ui/maquettes/05-m4-cahier-des-charges.html et 06-m4-evaluation.html et la charte : onglets par type, formulaire d'exigence, note globale, détail par critère avec jauges, pistes d'amélioration, états de chargement et erreurs avec bouton « Réessayer ».

Mode sans clé API
- Le mock de evaluate-document produit une évaluation crédible qui dépend du contenu du cahier des charges (nombre et type d'exigences), pour que la démo fonctionne sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface, et le nom ou l'email de l'étudiant ne doivent jamais être envoyés au LLM (passe toujours userId à callLLM).
- Ne modifie que server/src/modules/requirements/ et client/src/modules/requirements/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant.
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/requirements à partir de develop.
- Ajoute des tests automatisés dans server/src/modules/requirements/tests/ : validation des schémas, mock conforme, absence du besoin caché dans les réponses des endpoints du module (y compris l'évaluation), contrôle des rôles et des statuts du document.
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 4 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(requirements): … », puis pousse la branche feature/requirements, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-M4-001 dans docs/prompts/requirements.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.

# 5. Décision commune M3/M4 : versions successives du cahier des charges

Cette décision a été prise avec Ismail (module 3) et validée par le chef de projet. Elle remplace la demande « Propose une solution commune » de la section 1 : applique-la au lieu d'en proposer une autre.

- Nouvelle table RequirementsDocumentVersion (propriété du module 4) : id, documentId (relation vers RequirementsDocument, onDelete Cascade), version (1, 2, 3…), snapshot (JSON : la liste des exigences à ce moment, validée par un schéma Zod), reason (texte), changeRequestId (relation optionnelle vers ChangeRequest, unique, onDelete SetNull), createdAt. Contrainte unique (documentId, version).
- Ajout d'un champ version Int? dans RequirementsEvaluation, pour savoir quelle version a été évaluée.
- Seul le module 4 écrit dans cette table. Le module 3 la lit seulement. Le module 4 lit ChangeRequest pour vérifier que la demande appartient à la même séance, qu'elle a le statut ANSWERED et la décision ACCEPT ou NEGOTIATE (ne jamais se fier au paramètre de l'URL sans cette vérification).
- Version 1 : créée quand l'étudiant soumet son cahier des charges. Version N+1 : quand l'étudiant arrive depuis le module 3 avec une demande acceptée ou négociée, le document est rouvert pour modification ; à l'enregistrement, la nouvelle version liée à la demande est créée et le document repasse au statut SUBMITTED, prêt à être réévalué.
- Communication : le module 3 ouvre le module 4 avec ?changeRequest=<id> dans l'URL. Endpoints du module 4 :
  - POST /api/requirements/sessions/:sessionId/document/versions { changeRequestId, reason } (STUDENT propriétaire) ;
  - GET /api/requirements/sessions/:sessionId/document/versions, avec un filtre optionnel ?changeRequestId= (propriétaire ou TEACHER) ;
  - GET /api/requirements/sessions/:sessionId/document/versions/:version (propriétaire ou TEACHER).
- Priorité : commence par la migration (npm run db:migrate -- --name ajout_versions_cahier) et un commit qui ne contient que server/prisma, pour que je puisse ouvrir une pull request « migration seule » vers develop. La modification du modèle ChangeRequest se limite au champ de relation inverse exigé par Prisma (accord du module 3) : ne touche à rien d'autre dans le module 3.
```
