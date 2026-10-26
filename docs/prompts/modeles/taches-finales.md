# Tâches finales de chaque membre (grille de validation)

> Rédigé par le chef de projet (P-017). La grille de validation note **chaque membre** sur sa maîtrise technique, sa documentation, sa présentation et son intégration de l'IA. Elle tient compte de **vos propres commits**. Les tâches ci-dessous sont petites, réelles, et viennent des limites déjà écrites dans votre section 5.x du rapport.

## Pour tous (avant la validation)

1. `git checkout develop && git pull`, puis `npm install && npm run db:deploy` (nouvelle migration `ajout_tokens_appels_ia`).
2. Faites votre tâche ci-dessous avec votre assistant. Commitez **à votre nom** (`git config user.name` / `user.email`) avec un message conventionnel, puis poussez sur `feature/<module>` et prévenez le chef de projet.
3. Ajoutez l'entrée de journal correspondante dans `docs/prompts/<module>.md`, avec le prompt copié mot pour mot.
4. Remplissez vos rubriques « Modifications de l'équipe » encore vides : ce que vous avez relu, corrigé, refusé ou décidé.
5. Envoyez au chef de projet, pour le rapport (sections 7.4 et 8.2) et la présentation :
   - une ou deux phrases : pourquoi votre outil et votre modèle (Claude Code, Kiro, Antigravity), points forts, limites ;
   - le temps passé sur votre module avec l'IA, et votre estimation du temps qu'il aurait fallu sans IA.
6. Préparez l'oral : savoir expliquer la technique de votre module (section 2.9), le chemin d'un appel à `callLLM`, et une anomalie trouvée dans votre module (section 6.5).

Pour un test avec un vrai LLM, utilisez votre propre clé Gemini gratuite (Google AI Studio, configuration dans `server/.env.example`). Ne la collez jamais dans un prompt ni dans un fichier suivi par Git.

---

## Kenza Baccar — module 2 : campagne de prompt injection avec un vrai LLM

```text
Tu travailles sur le module 2 « interview » (responsable : Kenza Baccar). Lis CLAUDE.md, server/src/modules/interview/README.md et la section 5.2 du rapport (docs/rapport/sections/5.2-interview.md).

Objectif : mesurer la résistance du client simulé au prompt injection avec un vrai LLM (Gemini, déjà configuré dans server/.env).
1. Écris un script de campagne (dans server/src/modules/interview/scripts/) qui crée une séance de test, envoie 10 formulations d'injection différentes (directes, polies, déguisées en question métier, en anglais, en jeu de rôle…), puis supprime la séance.
2. Pour chaque formulation, relève : le type de question enregistré (MANIPULATION ou non), si la réponse sort du rôle, si un secret apparaît (contrôle des 6 mots).
3. Si une formulation passe, propose une amélioration du prompt client-reply (v0.4) et rejoue la campagne.
4. Ajoute les résultats (tableau) dans la section 5.2, sous « Limites et perspectives ».
Avant de modifier un fichier, présente ton plan et attends ma validation. Ne modifie que le module 2.
```

## Ismail Ismail — module 3 : mesurer l'auto-cohérence avec un vrai LLM

```text
Tu travailles sur le module 3 « change-requests » (responsable : Ismail Ismail). Lis CLAUDE.md, server/src/modules/change-requests/README.md et la section 5.3 du rapport (docs/rapport/sections/5.3-change-requests.md), en particulier la partie Self-consistency.

Objectif : mesurer avec un vrai LLM (Gemini, déjà configuré dans server/.env) la part d'évaluations incertaines de l'auto-cohérence, limite écrite dans la section 5.3.
1. Écris un script (dans server/src/modules/change-requests/scripts/) qui évalue au moins 10 réponses d'étudiant variées (bonnes, moyennes, hors sujet ; accepter, négocier, refuser) sur une séance de test, puis la supprime.
2. Relève pour chacune : les 3 votes, la décision retenue, la note médiane, l'écart entre les notes, et le statut « incertaine ».
3. Explique les cas de désaccord et propose, si c'est justifié, un réglage (température, consigne du prompt evaluate-response).
4. Ajoute un tableau des résultats dans la section 5.3, à la place de la limite « la proportion d'évaluations incertaines reste à mesurer ».
Avant de modifier un fichier, présente ton plan et attends ma validation. Ne modifie que le module 3.
```

## Nadhem Hmida — module 4 : un commentaire d'évaluation qui n'oriente plus vers le besoin caché

```text
Tu travailles sur le module 4 « requirements » (responsable : Nadhem Hmida). Lis CLAUDE.md, server/src/modules/requirements/README.md et la section 5.4 du rapport, en particulier la limite relevée en P-013 et confirmée en P-016 (section 6.4) : le commentaire de l'évaluation oriente l'étudiant vers le besoin caché sans le recopier (« les véritables problématiques de gestion et de chiffrage »).

Objectif : renforcer le prompt evaluate-document (nouvelle version) pour que le commentaire juge le document sans indiquer la direction du besoin caché.
1. Propose la règle à ajouter au prompt, avec un exemple de commentaire acceptable et un exemple refusé (Few-shot).
2. Ajoute un test qui vérifie la règle sur les réponses simulées.
3. Rejoue avec Gemini une évaluation d'un cahier des charges hors sujet et compare le commentaire avant et après.
4. Mets à jour la section 5.4 (avant / après).
Avant de modifier un fichier, présente ton plan et attends ma validation. Ne modifie que le module 4.
```

## Aziz Louati — module 5 : cache de la recommandation

```text
Tu travailles sur le module 5 « dashboard » (responsable : Aziz Louati). Lis CLAUDE.md, server/src/modules/dashboard/README.md, la section 5.5 du rapport et la section 7.3 (techniques d'optimisation).

Constat (P-017) : GET /api/dashboard/me/recommendation rappelle le LLM à chaque ouverture du tableau de bord, soit environ 1 800 tokens à chaque fois, alors que la recommandation ne change que lorsqu'une nouvelle séance est terminée.

Objectif : mettre la recommandation en cache.
1. Propose une solution : cache en mémoire par étudiant, invalidé quand le nombre ou la date des séances terminées change ; ou table dédiée, ce qui demande une migration à signaler au chef de projet. Explique ton choix.
2. Ajoute les tests : deux appels sans nouvelle séance = un seul appel au LLM ; une séance terminée = un nouvel appel.
3. Mesure l'effet avec la table AiCallLog (colonnes inputTokens et outputTokens) et ajoute le résultat dans la section 5.5.
Avant de modifier un fichier, présente ton plan et attends ma validation. Ne modifie que le module 5.
```
