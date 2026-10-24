# P-M4-003 — Résumé final de l'IA

> Claude Code — Claude Opus 5.5 · 2026-10-24

## 1. Ce qui était demandé
Ajouter à l'évaluation du cahier des charges un **matching par le LLM** (option A) entre le besoin caché et les exigences de l'étudiant : sans migration, notes de couverture calculées par le serveur, besoin caché découpé par phrase.

## 2. Ce qui a été réalisé
1. **Découpage côté serveur** : chaque phrase du besoin caché devient un point `N1…`, chaque contrainte implicite un point `C1…`.
2. **Appel 1 — `match-requirements` v0.1** : pour chaque point, le LLM renvoie `COVERED`, `PARTIAL` ou `MISSING`, les codes des exigences et une confiance, **sans aucun texte**. Zod vérifie un résultat par point, des codes existants et des statuts cohérents.
3. **Appel 2 — `evaluate-document` v0.3** : notation selon la grille, avec le matching dans le prompt.
4. **Notes calculées par le serveur** : couverture /30 et contraintes /15 (couvert = 1, partiel = ½).
5. **Stockage sans migration** : le matching est joint aux deux critères concernés dans `criteria`, dont le format reste inchangé (lisible par le module 5).
6. **Interface** : panneau « Correspondance avec le besoin réel » (Point clé 1 : Couvert — EF-01…), sans jamais afficher le texte du point.

## 3. Fichiers créés et modifiés
| | Fichiers |
|---|---|
| Créés | `requirements.matching.js`, `prompts/match-requirements.md`, `mocks/match-requirements.mock.js`, `tests/matching.test.js`, `components/MatchingPanel.jsx` |
| Modifiés | `requirements.service.js`, `prompts/evaluate-document.md` (v0.3), `tests/schemas.test.js`, `tests/endpoints.test.js`, `README.md`, `RequirementsEvaluationPage.jsx`, `requirements.css`, `docs/ARCHITECTURE.md` (partie M4), `docs/prompts/requirements.md` |

## 4. Vérifications effectuées et résultats
- `npm test` : **68 tests, 68 réussis, 0 échec** (tests d'intégration compris, base lancée), dont 11 nouveaux tests de matching.
- `npm run build` : réussi.
- Chaîne complète vérifiée (client `callLLM` + mock + deux prompts + Zod) : aucun texte du besoin caché ni des contraintes dans l'évaluation.

## 5. Problèmes rencontrés et corrections
- Transformer `criteria` en objet aurait cassé la page d'évaluation et le futur module 5 → matching joint aux critères, format conservé.
- Test du mock trop strict (le mot « patients » apparaissait dans une exigence) → test corrigé, car le mock compare des mots et non le sens.
- Colonne de gauche décalée par la marge de `.stack` → classe `requirements-side` réutilisée.

## 6. Limites et ce qui reste à faire
- Tester le matching réel avec une clé API : le mock ne reconnaît pas les synonymes.
- L'étudiant voit le nombre de points (« 1 / 2 couverts ») sans leur contenu : choix à valider en équipe.
- Deux appels au LLM par évaluation au lieu d'un.
- Le découpage par phrase dépend de la rédaction du besoin caché par le module 1.
