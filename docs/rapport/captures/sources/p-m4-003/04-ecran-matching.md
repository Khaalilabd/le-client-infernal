# P-M4-003 — Capture 04 : écran du matching (à prendre dans le site)

Cette capture doit montrer **l'application réelle**, pas un fichier Markdown : le rapport compare l'écran réalisé aux maquettes.

## Marche à suivre
1. `npm run db:seed` (remet le cahier des charges de démo en brouillon), puis `npm run dev`.
2. http://localhost:5173 → connexion `etudiant1@demo.tn` / `Password123!`.
3. **Cahier des charges** (séance « Boulangerie artisanale ») → ajouter les exigences ci-dessous → **Soumettre**.
4. **Évaluation** → **Évaluer la version 1**.
5. Capturer la page avec le **Détail par critère** et le panneau **Correspondance avec le besoin réel** visibles (Win + Maj + S), puis enregistrer dans `docs/rapport/captures/p-m4-003-04-ecran-matching.png`.

## Exigences à saisir

| Type | Titre | Description | Priorité |
|---|---|---|---|
| Fonctionnelle | Suivi centralisé des commandes | Le système doit centraliser le suivi des commandes des deux boutiques, avec la date de retrait de chaque commande. | MUST |
| User story | Rappel avant le retrait | En tant que gérante, je veux recevoir un rappel la veille de la date de retrait afin de ne plus perdre de commandes. | MUST |
| Non fonctionnelle | Utilisation sur smartphone | L'application doit être utilisable uniquement depuis le smartphone du personnel, sans ordinateur. | MUST |
| Fonctionnelle | Galerie de photos | Le site doit afficher une galerie de photos des gâteaux. | COULD |

Critères d'acceptation de la user story (un par ligne) :
```
Le rappel est envoyé la veille à 18 h
Le rappel indique le client, le gâteau et la boutique
```

L'exigence « Paiement au retrait » est volontairement absente. Résultat attendu avec le mock (vérifié) :

| Point | Statut | Exigences |
|---|---|---|
| Point clé 1 | Couvert | EF-01, US-01 |
| Contrainte 1 | Couvert | ENF-01 |
| Contrainte 2 | Partiel | EF-01, US-01, ENF-01 |
| Sans lien avec le besoin réel | — | EF-02 (galerie) |
