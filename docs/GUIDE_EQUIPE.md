# Guide de l'équipe — travailler sur son module avec l'IA

> À lire avant de commencer. Rédigé par le chef de projet (Khalil Abdelmoumen).
> Rappel : la note individuelle dépend **de vos commits** et de **votre usage de l'IA** (prompts, vérifications, esprit critique).

| Membre | Module | Branche | Prompt de départ |
|---|---|---|---|
| Khalil Abdelmoumen | 1. client-generator | `feature/client-generator` | ✅ terminé (exemple : P-005 dans [JOURNAL.md](prompts/JOURNAL.md)) |
| Kenza Baccar | 2. interview | `feature/interview` | [prompt-m2-interview.md](prompts/modeles/prompt-m2-interview.md) |
| Ismail Ismail | 3. change-requests | `feature/change-requests` | [prompt-m3-change-requests.md](prompts/modeles/prompt-m3-change-requests.md) |
| Nadhem Hmida | 4. requirements | `feature/requirements` | [prompt-m4-requirements.md](prompts/modeles/prompt-m4-requirements.md) |
| Aziz Louati | 5. dashboard | `feature/dashboard` | [prompt-m5-dashboard.md](prompts/modeles/prompt-m5-dashboard.md) |

---

## 1. Démarrer (une seule fois)

Prérequis : Node.js 20.19 ou plus récent, Docker Desktop **démarré**, Git.

```bash
git clone https://github.com/Khaalilabd/le-client-infernal.git
cd le-client-infernal
git checkout develop

# Votre identité Git : vos commits doivent être À VOTRE NOM pour compter dans votre note.
# Utilisez l'email lié à votre compte GitHub.
git config user.name "Prénom Nom"
git config user.email "votre-email-github@exemple.com"

npm run setup          # installe tout, crée server/.env, lance la base, charge les données de démo
git checkout -b feature/<votre-module>     # ex. feature/interview
npm run dev            # http://localhost:5173 — compte etudiant1@demo.tn / Password123!
```

Vérifiez que tout marche : `npm test` doit afficher `fail 0`.

## 2. Les règles d'or

1. **Vous ne modifiez que vos dossiers** : `server/src/modules/<module>/` et `client/src/modules/<module>/`.
2. **Base commune, schéma Prisma, autre module** : on demande au chef de projet **avant**. Votre prompt le rappelle à l'IA.
3. **Le besoin caché ne quitte jamais le serveur** : jamais dans une réponse API, jamais à l'écran.
4. **Aucune donnée personnelle envoyée au LLM** : passez toujours `userId` à `callLLM`, et n'envoyez jamais un nom ni un email.
5. **Toute réponse du LLM est validée par Zod**, et les prompts système sont dans `prompts/` (jamais en dur dans le code).
6. **L'IA propose, vous décidez** : vous lisez le plan, vous répondez à ses questions, vous vérifiez le résultat.
7. **Chaque prompt est tracé** dans le journal de votre module, mot pour mot, avec des captures.
8. **Jamais de clé API dans Git** : elle va uniquement dans `server/.env`, qui n'est pas versionné.

## 3. Donner le contexte du projet à votre IA

Toutes les règles du projet sont dans [`CLAUDE.md`](../CLAUDE.md). Votre IA doit les connaître **avant** votre premier prompt.

| Outil | Ce qu'il faut faire |
|---|---|
| **Claude Code** (VS Code ou terminal) | Rien : `CLAUDE.md` est lu automatiquement. Ouvrez le dossier du projet dans VS Code et lancez Claude Code. |
| **Cursor** | Rien : Cursor lit [`AGENTS.md`](../AGENTS.md), qui renvoie vers `CLAUDE.md`. Utilisez le mode Agent. |
| **GitHub Copilot** (VS Code) | Rien : Copilot lit [`.github/copilot-instructions.md`](../.github/copilot-instructions.md). Utilisez le mode Agent du chat Copilot. |
| **Codex** | Rien : Codex lit `AGENTS.md`. |
| **Gemini CLI et autres agents** | Commencez la session par : « Lis CLAUDE.md et applique ses règles pendant toute la session. » |
| **ChatGPT, Gemini, Claude.ai (version web)** | L'IA ne voit pas vos fichiers. **Avant** le prompt, collez le contenu de `CLAUDE.md` puis celui du `README.md` de votre module. Ensuite, joignez les fichiers qu'elle vous demande. C'est **vous** qui lancez les commandes (`npm test`…) et qui collez les résultats. |

Avec une IA web, soyez encore plus vigilant : copiez son code fichier par fichier, relancez les tests après chaque modification, et ne collez jamais votre fichier `.env`.

## 4. La méthode en 6 étapes (la même pour tous)

1. **Contexte et objectif** : vous envoyez votre prompt de départ (section 5).
2. **Plan avant action** : l'IA présente son plan et ses questions. **Rien n'est créé avant votre validation.**
3. **Validation** : vous répondez aux questions et corrigez le plan si besoin. Capture du plan.
4. **Génération** : l'IA produit le code, les tests et la documentation.
5. **Vérification** : `npm test`, `npm run build`, test dans le navigateur (section 7).
6. **Traçabilité** : entrée dans votre journal, captures, résumé en 6 points.

C'est cette méthode qui est décrite au chapitre 2 du rapport : l'enseignant attend de la voir appliquée par chacun.

## 5. Votre premier prompt

Un prompt de départ complet est prêt pour chaque module dans [`docs/prompts/modeles/`](prompts/modeles/). Il est construit sur le modèle du prompt P-005 du module 1, qui a bien fonctionné, et suit le tableau officiel du projet.

1. Ouvrez le fichier de votre module et lisez-le en entier.
2. Adaptez-le si vous voulez (ajouter ou retirer une idée), et notez ce que vous avez changé.
3. Envoyez-le **en un seul message**, puis faites la capture.
4. Lisez le plan proposé. Posez des questions, refusez ce qui ne vous convient pas.

## 6. Les prompts suivants

Après le premier prompt, vous ferez des demandes plus courtes : corriger un bug, améliorer un écran, modifier un prompt système… Structure conseillée :

```text
Contexte : module <x>, fichier(s) concerné(s) : <…>.
Problème ou objectif : <ce qui ne va pas / ce que je veux, avec un exemple précis>.
Contraintes : ne modifie que mon module ; garde la validation Zod ; le besoin caché ne doit pas apparaître.
Avant de modifier, explique-moi ce que tu vas faire.
Après : lance npm test et ajoute l'entrée P-M<x>-NNN dans docs/prompts/<module>.md.
```

**Bonnes pratiques**
- Une demande = un objectif. Plusieurs petits prompts valent mieux qu'un prompt fourre-tout.
- Donnez des exemples concrets : le message d'erreur exact, la réponse attendue, la capture de l'écran.
- Demandez à l'IA d'**expliquer** ce qu'elle a fait : vous devrez le présenter à l'oral.
- Si l'IA tourne en rond, recommencez une conversation avec un prompt plus précis.

**À éviter**
- « Fais tout le module » sans contraintes ni vérification.
- Accepter le code sans le lire, ni lancer les tests.
- Laisser l'IA modifier un autre module ou la base commune « pour aller plus vite ».
- Coller une clé API, un mot de passe ou des données personnelles dans un prompt.

## 7. Vérifier le travail de l'IA

Avant chaque commit, cochez cette liste :

- [ ] `npm test` affiche `fail 0`, avec Docker lancé (sinon les tests d'intégration sont ignorés).
- [ ] `npm run build` réussit.
- [ ] `git status` : seuls vos dossiers et votre journal sont modifiés.
- [ ] Dans le navigateur (F12 → onglet Réseau), aucune réponse ne contient `hiddenNeed` ni `implicitConstraints`.
- [ ] Le serveur n'affiche pas d'alerte `[responseGuard]` dans le terminal.
- [ ] L'écran ressemble à votre maquette ([docs/ui/maquettes/](ui/maquettes/)) et respecte la [charte](ui/CHARTE.md).
- [ ] La fonctionnalité marche **sans clé API** (le mock suffit pour la démo).

Le module 1 sert d'exemple pour les tests : voir `server/src/modules/client-generator/tests/`.

## 8. Journal des prompts et captures

- **Votre journal** : `docs/prompts/<votre-module>.md` (déjà créé, avec un modèle d'entrée). Numérotation : `P-M2-001`, `P-M2-002`… (selon votre numéro de module).
- **Mot pour mot** : le prompt est copié tel quel, fautes comprises. Ajoutez aussi les questions de l'IA et vos réponses.
- **Résumé en 6 points** : demandé, réalisé, fichiers, vérifications, problèmes, limites. Votre prompt de départ demande à l'IA de le produire.
- **« Modifications de l'équipe »** : écrivez-la **vous-même** (ce que vous avez vérifié, corrigé, refusé ou décidé). C'est là que se voit votre esprit critique.
- **Captures** (Windows : Win + Maj + S) dans `docs/rapport/captures/`, nommées `p-m<x>-NNN-NN-description.png`, par exemple `p-m2-001-01-prompt.png`, `p-m2-001-02-plan.png`, `p-m2-001-03-resume.png`. Prenez aussi les écrans réalisés (`p-m2-001-04-ecran-chat.png`).

## 9. Coordination entre modules

| Sujet | Qui | Ce qu'il faut décider |
|---|---|---|
| **Versions du cahier des charges** | Ismail (M3) + Nadhem (M4) | Le tableau officiel demande au module 3 des « versions successives du cahier des charges », qui touchent les tables du module 4. Mettez-vous d'accord sur **une** solution (table de versions, endpoints, qui écrit quoi), puis présentez-la au chef de projet **avant** de modifier le schéma Prisma. |
| **Note finale d'une séance** | Aziz (M5) + tous | Comment calculer `TrainingSession.finalScore` (pondération entretien / cahier des charges / changements) : à valider en équipe. |
| **Personnalité du client** | Kenza (M2) | Le module 1 enregistre le profil dans `scenario.personality.profile`. Les descriptions des profils sont dans `server/src/modules/client-generator/data/personalities.json` (lecture seule). |
| **Recommandation → nouveau scénario** | Aziz (M5) + Khalil (M1) | Si le bouton « Lancer ce scénario » doit préremplir le formulaire du module 1, demandez au chef de projet. |

**Modifier le schéma Prisma** (seulement après accord) :
```bash
npm run db:migrate -- --name ajout_versions_cahier   # crée la migration
git add server/prisma && git commit -m "feat(requirements): table des versions du cahier des charges"
```
Après un pull contenant une nouvelle migration : `npm install && npm run db:deploy`.

## 10. Git au quotidien

```bash
git pull origin develop          # au moins une fois par jour, sur votre branche feature/<module>
git add server/src/modules/<module> client/src/modules/<module> docs/prompts/<module>.md docs/rapport/captures
git commit -m "feat(<module>): description courte en français"
git push -u origin feature/<module>
```

- Des **commits petits et fréquents**, au format `type(module): description` (`feat`, `fix`, `test`, `docs`, `refactor`).
- **Pull request** vers `develop` quand une fonctionnalité est terminée et testée. Le chef de projet relit et fusionne.
- **Conflit** : ne forcez rien (`--force` interdit), et demandez de l'aide.
- **Rapport Word** : il est **généré** (`npm run rapport`) : ne le modifiez jamais à la main et ne le committez pas depuis votre branche. Vous ne modifiez que votre fichier de section (section 11).

## 11. Votre partie du rapport

Le rapport Word est **généré** à partir de fichiers texte (mode d'emploi : [`docs/rapport/README.md`](rapport/README.md)). Chaque membre rédige **la section 5.x de son module** dans **son** fichier `docs/rapport/sections/5.x-<module>.md` (un modèle est prêt), avec la même structure que les sections 5.1 (module 1) et 5.4 (module 4), déjà rédigées :

1. Objectif et fonctionnalités (avec un tableau des endpoints).
2. Prompts utilisés : vos P-M<x>-NNN, et l'évolution de votre prompt système (v0.1 → v0.2…).
3. Réalisation et captures : les écrans réels, comparés à votre maquette.
4. Tests.
5. Difficultés et apport de l'IA : ce que l'IA a bien fait, ce que vous avez dû corriger, vos décisions.
6. Limites et perspectives.

L'essentiel de ce contenu vient du **résumé en 6 points** de vos prompts. Déposez vos captures dans `docs/rapport/captures/`, vérifiez le rendu avec `npm run rapport`, puis committez votre fichier `.md` et vos captures (pas le `.docx`). Le chef de projet régénère le rapport après chaque fusion dans `develop`.

> ⚠️ Ne modifiez pas le `.docx` dans Word : il est écrasé à chaque génération. Si votre IA vous le propose, demandez-lui plutôt de rédiger votre fichier de section.

## 12. Quand votre module est-il terminé ?

- [ ] Toutes les fonctionnalités de votre ligne du tableau officiel marchent dans le navigateur.
- [ ] Le module fonctionne sans clé API (mock), et si possible avec une vraie clé.
- [ ] Les tests de votre module existent et `npm test` affiche `fail 0`.
- [ ] Le README du module et le tableau des endpoints dans `docs/ARCHITECTURE.md` sont à jour.
- [ ] Votre journal est complet (prompts mot pour mot, résumés, « Modifications de l'équipe ») et les captures sont prises.
- [ ] Votre section `docs/rapport/sections/5.x-<module>.md` est rédigée (plus aucun encadré « À compléter ») et ses captures sont déposées.
- [ ] Votre pull request vers `develop` est fusionnée.

## 13. Questions fréquentes

| Problème | Solution |
|---|---|
| « Base de données inaccessible » | Docker Desktop n'est pas lancé : démarrez-le, puis `npm run db:up`. |
| Le port 5434 est déjà pris | `DB_PORT=5440 docker compose up -d --wait`, puis adaptez `DATABASE_URL` dans `server/.env`. |
| Les données de démo sont abîmées | `npm run db:seed` les remet à zéro. |
| Je veux tester avec une vraie IA | Ajoutez `ANTHROPIC_API_KEY=…` ou `OPENAI_API_KEY=…` dans `server/.env`, puis relancez `npm run dev`. Chaque appel est facturé. Ne committez jamais ce fichier. |
| `npm test` affiche `skipped` | Docker n'est pas lancé : les tests d'intégration sont ignorés. |
| L'IA veut modifier un autre module | Refusez, et demandez-lui une solution limitée à votre module, ou parlez-en au chef de projet. |
| Je ne sais pas quelle capture prendre | Le prompt, le plan, chaque question importante, le résumé final et les écrans réalisés. |
