# P-M4-003 — Plan proposé par l'IA (avant toute modification)

> Claude Code — Claude Opus 5.5 · 2026-10-24 · Aucun fichier modifié à cette étape

## Le problème actuel
Le LLM donne directement une note de « Couverture du besoin réel » (/30) et de « Contraintes implicites » (/15), sans dire **quelle exigence couvre quel point** : la note n'est ni expliquée ni reproductible.

## L'idée : mettre en correspondance avant de noter

```
Points de référence (côté serveur)        Exigences de l'étudiant
  N1  (morceau du besoin caché)   ──────►  EF-02, US-01   COUVERT    (0.9)
  N2                              ──────►  EF-04          PARTIEL    (0.5)
  C1  (contrainte implicite 1)    ──────►  ENF-01         COUVERT
  C2                              ──────►  —              MANQUANT
                                           EF-05          hors du besoin caché
```

Le **serveur calcule** ensuite les deux notes de couverture :
- Couverture = 30 × (couverts + 0,5 × partiels) / nombre de points N
- Contraintes = 15 × (couvertes + 0,5 × partielles) / nombre de points C

## Garder le besoin caché secret
- Le LLM reçoit les points sous forme d'**identifiants** (N1, C1…) et ne renvoie **que des identifiants, des codes d'exigences, un statut et une confiance**.
- Zod vérifie les identifiants, les codes, les statuts et qu'aucun point ne manque.
- L'interface affiche « Point clé 1 : couvert par EF-02 », jamais le texte du point.

## Options techniques

| Option | Avis |
|---|---|
| **A. Matching par le LLM via `callLLM()` + prompt `match-requirements.md`** | ✅ Recommandée : respecte l'architecture, marche avec tous les fournisseurs |
| B. Embeddings (similarité vectorielle) | ❌ Le service IA partagé ne gère pas les embeddings et Claude n'en fournit pas : il faudrait modifier la base commune |
| C. Hybride : présélection lexicale locale puis LLM | ✅ En complément : sert au mock sans clé API |

## Fichiers prévus
- **Serveur** : points de référence, prompt `match-requirements.md` v0.1, mock, schéma Zod, `evaluateDocument` (matching → évaluation → notes calculées), prompt `evaluate-document` v0.3, tests.
- **Client** : composant `MatchingPanel.jsx` dans la page d'évaluation.
- **Base commune ⚠️** : champ `matching Json?` éventuel (migration), ou stockage dans `criteria` sans migration.
- **Traçabilité** : P-M4-003, README du module, `docs/ARCHITECTURE.md`.

## Questions posées avant de coder
1. Migration `matching Json?` ou stockage sans toucher au schéma Prisma ?
2. Le serveur calcule-t-il les notes de couverture à partir du matching, ou le matching sert-il seulement d'explication ?
3. Découpage du besoin caché par phrase, ou par le LLM ?
