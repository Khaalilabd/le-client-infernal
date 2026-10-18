# Prompt de départ — Module 3 « Demandes de changement » (Ismail Ismail)

**Comment l'utiliser :** copiez tout le bloc ci-dessous et envoyez-le **tel quel** comme premier message à votre IA (voir `docs/GUIDE_EQUIPE.md`, section 3, selon l'outil). Faites une capture du prompt envoyé, du plan proposé et du résumé final. Ce prompt sera l'entrée **P-M3-001** de `docs/prompts/change-requests.md`.

⚠️ **Coordination avec Nadhem (module 4)** : les « versions successives du cahier des charges » touchent les tables du module 4. Mettez-vous d'accord avec lui avant d'envoyer ce prompt (voir `docs/GUIDE_EQUIPE.md`, section 9). Le prompt demande à l'IA de proposer une solution et de **s'arrêter avant de modifier le schéma**.

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
