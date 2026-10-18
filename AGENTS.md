# Instructions pour les assistants IA (Cursor, Codex, GitHub Copilot…)

Ce projet est développé avec l'aide de plusieurs assistants IA. **Toutes les règles du projet sont dans [`CLAUDE.md`](CLAUDE.md)** : lis-le entièrement et applique-le pendant toute la session, quel que soit ton outil.

Rappel des règles principales :

1. Avant de modifier le moindre fichier, présente un plan et attends la validation de l'utilisateur. Si une information manque, pose la question.
2. Ne modifie que les dossiers du module de l'utilisateur : `server/src/modules/<module>/` et `client/src/modules/<module>/`. Pour la base commune (`shared/`), le schéma Prisma ou un autre module, signale-le et demande avant.
3. Contraintes obligatoires :
   - aucune donnée personnelle (nom, email) envoyée au LLM ;
   - toute sortie du LLM validée par Zod ;
   - erreurs du LLM gérées ;
   - le besoin caché (`hiddenNeed`, `implicitConstraints`) ne quitte jamais le serveur.
4. Appels au LLM uniquement via `callLLM()` de `server/src/shared/ai/`. Prompts système dans `server/src/modules/<module>/prompts/`, jamais en dur dans le code.
5. Identifiants du code en anglais ; commentaires, documentation et interface en français. Commits conventionnels : `feat(<module>): …`.
6. Après chaque demande, ajoute une entrée dans le journal du module, `docs/prompts/<module>.md` (P-M<x>-NNN), avec le prompt mot pour mot et un résumé de ce que tu as produit.

Documentation : `docs/ARCHITECTURE.md` (architecture, API), `docs/ui/CHARTE.md` (interface), `docs/GUIDE_EQUIPE.md` (méthode de travail), `server/src/modules/<module>/README.md` (tâches du module).
