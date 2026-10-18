---
inclusion: always
---

# Règles du projet « Le Client Infernal » (pour l'agent Kiro)

Toutes les règles du projet sont dans `CLAUDE.md`, inclus ci-dessous : applique-les pendant toute la session.

#[[file:CLAUDE.md]]

## Rappel des règles principales

1. Avant de modifier le moindre fichier, présente un plan et attends la validation de l'utilisateur. Si une information manque, pose la question.
2. Ne modifie que les dossiers du module de l'utilisateur : `server/src/modules/<module>/` et `client/src/modules/<module>/`. Pour la base commune (`shared/`), le schéma Prisma ou un autre module, signale-le et demande avant.
3. Contraintes obligatoires :
   - aucune donnée personnelle (nom, email) envoyée au LLM ;
   - toute sortie du LLM validée par Zod ;
   - erreurs du LLM gérées ;
   - le besoin caché (`hiddenNeed`, `implicitConstraints`) ne quitte jamais le serveur.
4. Appels au LLM uniquement via `callLLM()` de `server/src/shared/ai/`. Prompts système dans `server/src/modules/<module>/prompts/`, jamais en dur dans le code.
5. Code en anglais ; commentaires, documentation et interface en français. Commits conventionnels : `feat(<module>): …`, à l'identité Git de l'utilisateur.
6. Après chaque demande, ajoute une entrée dans `docs/prompts/<module>.md` (P-M<x>-NNN) : prompt mot pour mot et résumé de ce que tu as produit.
7. Rapport : ne modifie jamais `docs/rapport/Rapport_Client_Infernal.docx`. La section du module se rédige dans `docs/rapport/sections/5.x-<module>.md`, puis `npm run rapport`.

Documentation : `docs/GUIDE_EQUIPE.md` (méthode), `docs/ARCHITECTURE.md` (architecture, API), `docs/ui/CHARTE.md` (interface), `server/src/modules/<module>/README.md` (tâches du module).
