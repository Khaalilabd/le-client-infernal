# Prompt de départ — Module 5 « Tableau de bord » (Aziz Louati)

**Comment l'utiliser :** copiez tout le bloc ci-dessous et envoyez-le **tel quel** comme premier message à votre IA (voir `docs/GUIDE_EQUIPE.md`, section 3, selon l'outil). Faites une capture du prompt envoyé, du plan proposé et du résumé final. Ce prompt sera l'entrée **P-M5-001** de `docs/prompts/dashboard.md`.

💡 Votre module lit les données de tous les autres. Vous pouvez commencer tout de suite grâce aux données de démonstration (`npm run db:seed`), puis brancher les vraies données au fur et à mesure que les autres modules avancent.

```text
Tu es le développeur du module 5 « dashboard » (responsable : Aziz Louati). Le contexte du projet, l'architecture et les conventions sont dans CLAUDE.md, docs/ARCHITECTURE.md, docs/ui/CHARTE.md et server/src/modules/dashboard/README.md : lis-les avant de commencer. Le module 1 (client-generator) est terminé et sert d'exemple de structure (server/src/modules/client-generator/).

Objectif : faire passer le module 5 du squelette actuel à une version complète et démontrable, conforme au tableau officiel du projet :
- Partie web : profil, historique, graphiques, espace enseignant.
- Rôle de l'IA : analyser les sessions passées, repérer les points faibles récurrents et recommander le prochain scénario.

Avant de modifier le moindre fichier, présente-moi ton plan (fichiers créés ou modifiés, endpoints, choix techniques) et attends ma validation. Si une information manque, pose la question.

# 1. Fonctionnalités attendues

Espace étudiant
- Les statistiques existantes (GET /api/dashboard/me/stats) restent la base : améliore-les.
- Profil : informations du compte et synthèse de la progression.
- Historique des séances avec, pour chacune, le scénario, le niveau, le statut et les notes obtenues dans chaque module.
- Graphiques de progression (évolution des notes, répartition par niveau et par domaine, compétences). L'ajout d'une bibliothèque de graphiques modifie client/package.json (base commune) : propose-la et demande-moi avant.

Analyse et recommandation par l'IA
- Nouvel endpoint GET /api/dashboard/me/recommendation : construit un historique ANONYMISÉ (domaines, niveaux, notes, nombre de questions… jamais de nom ni d'email), appelle le prompt recommend-scenario (version 0.2), qui repère les points faibles récurrents et recommande le prochain scénario (domaine, niveau, personnalité, compétence à travailler, justification).
- La réponse du LLM reste validée par un schéma Zod (recommendationSchema) ; enrichis-le pour inclure les points faibles repérés.
- Le bouton « Lancer ce scénario » ouvre le générateur du module 1 avec les paramètres recommandés (sans modifier le module 1 : passe-les par l'URL et signale-moi si le module 1 doit les lire).

Espace enseignant
- La vue d'ensemble existante (GET /api/dashboard/teacher/overview) reste la base.
- Fiche d'un étudiant (séances, notes, progression).
- Commentaire et note de l'enseignant sur une séance (table TeacherFeedback, endpoint POST /api/dashboard/teacher/sessions/:sessionId/feedback), visibles par l'étudiant.
- Filtres (statut, niveau, domaine) et export CSV si le temps le permet.

Interface
- Les pages respectent les maquettes docs/ui/maquettes/08-m5-tableau-de-bord.html et 09-m5-espace-enseignant.html et la charte : cartes de statistiques, chronologie, carte de recommandation, tableau, états de chargement et erreurs avec bouton « Réessayer ».

Mode sans clé API
- Le mock de recommend-scenario produit une recommandation cohérente avec l'historique fourni, pour que la démo fonctionne sans clé API.

# 2. Contraintes

- Respecte les 4 contraintes obligatoires de CLAUDE.md. En particulier, aucune donnée personnelle (nom, prénom, email) ne doit être envoyée au LLM, ni hiddenNeed ni implicitConstraints ne doivent apparaître dans une réponse API ou dans l'interface (y compris dans l'espace enseignant).
- Le module 5 LIT les tables des autres modules mais n'écrit que dans sa propre table (TeacherFeedback).
- Ne modifie que server/src/modules/dashboard/ et client/src/modules/dashboard/. Si tu dois toucher la base commune, le schéma Prisma ou un autre module, signale-le et demande-moi avant. Le calcul de la note finale d'une séance (TrainingSession.finalScore) concerne toute l'équipe : propose une règle et attends mon accord.
- Les prompts restent dans le dossier prompts/ du module, jamais en dur dans le code.

# 3. Vérification

- Crée la branche feature/dashboard à partir de develop.
- Ajoute des tests automatisés dans server/src/modules/dashboard/tests/ : validation des schémas, mock conforme, historique envoyé au LLM sans aucune donnée personnelle, absence du besoin caché dans les réponses, contrôle des rôles (un étudiant n'accède pas à l'espace enseignant ni aux données d'un autre étudiant).
- Lance npm test et npm run build, démarre le serveur, puis appelle chaque endpoint du module. Corrige les erreurs éventuelles.
- Mets à jour le README du module et le tableau des endpoints du module 5 dans docs/ARCHITECTURE.md.
- Fais plusieurs petits commits conventionnels « feat(dashboard): … », puis pousse la branche feature/dashboard, sans fusionner dans develop.

# 4. Traçabilité pour le rapport

- Ajoute l'entrée P-M5-001 dans docs/prompts/dashboard.md, avec ce prompt mot pour mot.
- Termine par un résumé au format suivant, que je reprendrai dans le rapport :
  1. Ce qui était demandé.
  2. Ce qui a été réalisé.
  3. Fichiers créés et modifiés.
  4. Vérifications effectuées et résultats.
  5. Problèmes rencontrés et corrections.
  6. Limites et ce qui reste à faire.
```
