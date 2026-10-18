# Instructions pour GitHub Copilot

Les règles de ce projet sont dans `CLAUDE.md` (racine du dépôt) et s'appliquent à tous les assistants IA. Résumé :

- Présente un plan et attends la validation avant de modifier des fichiers ; pose une question si une information manque.
- Ne modifie que `server/src/modules/<module>/` et `client/src/modules/<module>/` ; demande avant de toucher `shared/`, `server/prisma/schema.prisma` ou un autre module.
- Contraintes obligatoires :
  - aucune donnée personnelle (nom, email) envoyée au LLM ;
  - sorties du LLM validées par Zod ;
  - erreurs du LLM gérées ;
  - `hiddenNeed` et `implicitConstraints` ne quittent jamais le serveur.
- Appels au LLM uniquement via `callLLM()` (`server/src/shared/ai/`) ; prompts système dans le dossier `prompts/` du module.
- Code en anglais ; commentaires, documentation et interface en français ; commits `feat(<module>): …`.
- Après chaque demande, ajoute une entrée dans `docs/prompts/<module>.md` (P-M<x>-NNN) : prompt mot pour mot et résumé.

Voir aussi `docs/GUIDE_EQUIPE.md`, `docs/ARCHITECTURE.md`, `docs/ui/CHARTE.md` et le `README.md` du module.
