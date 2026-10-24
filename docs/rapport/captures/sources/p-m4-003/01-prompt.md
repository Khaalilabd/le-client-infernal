# P-M4-003 — Prompt

> Claude Code (extension VS Code) — Claude Opus 5.5 · Branche `feature/requirements` · 2026-10-24 · Nadhem Hmida

## Message envoyé à l'IA

```text
je vous presente je suis "nadhem hmida" mon collegue m envoyer ceci
Salut l'équipe 👋
La base du projet et le module 1 sont prêts sur la branche develop.
Avant de commencer :
1. git pull, puis lisez docs/GUIDE_EQUIPE.md (15 min) : démarrage, règles, méthode avec votre IA.
2. Votre prompt de départ est prêt dans docs/prompts/modeles/ :
   Kenza → prompt-m2-interview.md · Ismail → prompt-m3-change-requests.md
   Nadhem → prompt-m4-requirements.md · Aziz → prompt-m5-dashboard.md
3. Configurez git avec VOTRE nom et VOTRE email GitHub (sinon vos commits ne comptent pas).
4. Travaillez sur feature/<votre-module>, tracez chaque prompt dans docs/prompts/<votre-module>.md et faites les captures (prompt, plan, résumé).
5. Ismail et Nadhem : mettez-vous d'accord sur les versions du cahier des charges avant de toucher la base de données.
Nouvelle règle : un journal de prompts par module (P-M2-001…), pour éviter les conflits.
Questions → moi.
verifier ce que je doit faire dans le dossier docs

ce travaille est deja devellopper ,ce que je veux faire maintenant est dans la partie de l evalution de mon travaille je veux faire un systeme ai de matching
avant de modifier le code donne moi comment
```

## Choix de Nadhem après le plan

```text
je veux faire l option a de matching avec llm
```

| Question de l'IA | Réponse de Nadhem |
|---|---|
| Où enregistrer le résultat du matching ? | Sans migration (Recommandé) |
| Le matching doit-il calculer les notes de couverture ? | Oui, calcul serveur (Recommandé) |
| Comment découper le besoin caché en points de référence ? | Par phrase (Recommandé) |
