# Prompt de départ — Module 2 « Entretien client » (Kenza Baccar)

**Comment l'utiliser :** copiez tout le bloc ci-dessous et envoyez-le **tel quel** comme premier message à votre IA (voir `docs/GUIDE_EQUIPE.md`, section 3, selon l'outil). Faites une capture du prompt envoyé, du plan proposé et du résumé final. Ce prompt sera l'entrée **P-M2-001** de `docs/prompts/interview.md`.

Vous pouvez l'adapter avant l'envoi (ajouter une idée, retirer une fonctionnalité) : notez alors vos modifications dans le journal.

```text
Tu es le développeur du module 2 « interview » (responsable : Kenza Baccar). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/interview/README.md : lis-les avant de commencer. Le module 1 (client-generator) est terminé et sert d'exemple de structure (server/src/modules/client-generator/).

Objectif : faire passer le module 2 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : interface de chat, historique, compteur de questions.
- Rôle de l'IA : jouer le client en restant fidèle à sa personnalité, et ne révéler le besoin caché que si les questions de l'étudiant s'en approchent.

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Entretien
- Le chat existant (GET et POST /api/interview/sessions/:sessionId/messages) reste la base : améliore-le.
- Le prompt système client-reply passe en version 0.2 : le client respecte sa personnalité (traits, style, humeur et profil personality.profile fourni par le module 1 ; les descriptions des profils sont dans server/src/modules/client-generator/data/personalities.json, en lecture seule), révèle son besoin caché progressivement selon la pertinence des questions, ne sort jamais de son rôle et ne cite jamais le besoin caché mot pour mot.
- La réponse du LLM reste validée par un schéma Zod (clientReplySchema) ; enrichis-le si nécessaire.
- Limite la taille de l'historique envoyé au LLM pour les longs entretiens.

Suivi de l'entretien
- Compteur de questions posées par l'étudiant, visible dans l'interface.
- Indicateur de progression qui ne révèle rien du besoin caché (la valeur proximity reste côté serveur).
- Fin d'entretien : l'étudiant termine l'entretien et obtient une synthèse de ce qu'il a appris (nouveau prompt dans prompts/, schéma Zod et mock associés). La synthèse ne doit pas révéler ce qu'il n'a pas découvert.

Interface
- Les pages respectent la maquette docs/ui/maquettes/04-m2-entretien.html et la charte : PageHeader, parcours de séance (stepper), fiche du client (informations publiques uniquement), états de chargement (« Le client réfléchit… »), erreurs avec bouton « Réessayer ».
- L'enseignant consulte les entretiens en lecture seule.

Mode sans clé API
- Le mock de client-reply (et celui de la synthèse) produit des réponses crédibles et variées selon les questions et la personnalité, pour que la démo fonctionne sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface, et le nom ou l'email de l'étudiant ne doivent jamais être envoyés au LLM (passe toujours userId à callLLM).
- Ne modifie que server/src/modules/interview/ et client/src/modules/interview/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant. Privilégie les solutions sans migration.
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/interview à partir de develop.
- Ajoute des tests automatisés dans server/src/modules/interview/tests/ : validation des schémas, mocks conformes, absence du besoin caché dans les réponses des endpoints du module, contrôle des rôles.
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 2 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(interview): … », puis pousse la branche feature/interview, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-M2-001 dans docs/prompts/interview.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.
```
