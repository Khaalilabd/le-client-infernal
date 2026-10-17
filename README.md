# Le Client Infernal

Plateforme web d'entraînement au **recueil des besoins**. L'étudiant joue l'ingénieur ; un LLM joue un client fictif doté d'une personnalité et d'un **besoin caché**. L'étudiant doit découvrir ce besoin pendant un entretien en chat, rédiger un cahier des charges et gérer des demandes de changement. Il est ensuite évalué.

> Projet ESPRIT — module « IA for Software Engineering » — A.U 2026-2027.
> Architecture détaillée : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Journal des prompts : [docs/prompts/JOURNAL.md](docs/prompts/JOURNAL.md)

## Équipe et modules

| # | Module | Responsable | Branche | Dossiers |
|---|---|---|---|---|
| 1 | Générateur de clients (`client-generator`) | Khalil Abdelmoumen (chef de projet) | `feature/client-generator` | `server/src/modules/client-generator/`, `client/src/modules/client-generator/` |
| 2 | Entretien (`interview`) | Kenza Baccar | `feature/interview` | `server/src/modules/interview/`, `client/src/modules/interview/` |
| 3 | Demandes de changement (`change-requests`) | Ismail Ismail | `feature/change-requests` | `server/src/modules/change-requests/`, `client/src/modules/change-requests/` |
| 4 | Cahier des charges (`requirements`) | Nadhem Hmida | `feature/requirements` | `server/src/modules/requirements/`, `client/src/modules/requirements/` |
| 5 | Tableau de bord (`dashboard`) | Aziz Louati | `feature/dashboard` | `server/src/modules/dashboard/`, `client/src/modules/dashboard/` |

La base commune (authentification, layout, gestion des erreurs, service IA, schéma Prisma) se trouve dans `server/src/shared/`, `client/src/shared/` et `server/prisma/`. Toute modification de la base commune doit être signalée à l'équipe.

Chaque module a son propre `README.md` qui décrit le travail à réaliser.

## Stack

React 19 (Vite) + React Router · Node.js + Express 5 · PostgreSQL 16 + Prisma 6 (Docker) · Zod · service LLM abstrait (claude, openai, ollama, mock).

## Prérequis

- Node.js **20.19 ou plus récent** (testé avec Node 24)
- Docker Desktop **démarré**
- Git

## Installation

```bash
git clone <url-du-depot>
cd Projet_IA_FOR_SOFTWARE
npm run setup
```

`npm run setup` installe les dépendances et crée `server/.env` à partir de `server/.env.example`. Il démarre ensuite PostgreSQL, applique les migrations et charge les données de démonstration.

## Lancement

```bash
npm run dev
```

- Application : http://localhost:5173
- API : http://localhost:4000/api (état du serveur : `/api/health`)

### Comptes de démonstration (mot de passe : `Password123!`)

| Email | Rôle | Données |
|---|---|---|
| `enseignant@demo.tn` | TEACHER | espace enseignant |
| `etudiant1@demo.tn` | STUDENT | une séance en cours (messages, demande de changement, cahier des charges) |
| `etudiant2@demo.tn` | STUDENT | une séance terminée, notée par l'enseignant |

### Fournisseur IA

Sans clé API, le fournisseur **mock** est utilisé automatiquement : tout fonctionne avec des réponses simulées. Pour utiliser un vrai LLM, renseignez `server/.env` :

```env
AI_PROVIDER=auto          # auto | mock | claude | openai | ollama
ANTHROPIC_API_KEY=...     # ou OPENAI_API_KEY=...
```

Ne committez jamais le fichier `.env`.

## Scripts utiles

| Commande | Effet |
|---|---|
| `npm run setup` | installation complète (première fois) |
| `npm run dev` | lance le serveur et le client |
| `npm run dev:server` / `npm run dev:client` | lance un seul des deux |
| `npm test` | tests du serveur (service IA, protection du besoin caché) |
| `npm run build` | build de production du client |
| `npm run db:up` / `npm run db:down` | démarre ou arrête PostgreSQL |
| `npm run db:migrate -- --name <nom>` | crée une migration après modification de `schema.prisma` |
| `npm run db:deploy` | applique les migrations récupérées après un pull |
| `npm run db:seed` | réinitialise les données de démonstration |
| `npm run db:reset` | supprime la base, la recrée et relance le seed |
| `npm run db:studio` | interface graphique Prisma Studio |

### Port PostgreSQL

La base écoute sur le port **5434** de votre machine, pour éviter un conflit avec un PostgreSQL déjà installé (5432) ou un autre projet (5433). Si ce port est déjà pris chez vous :

```bash
DB_PORT=5440 docker compose up -d --wait
```

Modifiez alors le port dans `DATABASE_URL` (`server/.env`).

## Conventions Git

- `main` : version stable · `develop` : intégration · `feature/<module>` : une branche par membre.
- Commits conventionnels en français : `feat(interview): ajout de l'historique du chat`, `fix(core): …`, `docs(prompts): …`.
- On travaille sur sa branche `feature/<module>`, puis on ouvre une pull request vers `develop`.
- Code (identifiants) en anglais ; documentation, commentaires et interface en français.
- Chaque prompt adressé à une IA pour le projet est ajouté dans `docs/prompts/JOURNAL.md`.

### Démarrer sur son module (après le premier pull)

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<module>      # ex. feature/interview
npm run setup                         # la première fois
npm run dev
# ... travail, commits ...
git push -u origin feature/<module>
```

Après un `git pull` qui contient de nouvelles migrations : `npm install && npm run db:deploy`.

## Points connus

- `npm audit` signale une faille « high » dans `deepmerge-ts`, une dépendance de l'outil en ligne de commande `prisma`. Cet outil sert uniquement au développement (migrations), pas à l'application en fonctionnement. La correction impose Prisma 7, une version majeure : on garde Prisma 6 pour l'instant.
- Prisma affiche un avertissement sur `package.json#prisma` (déprécié en vue de Prisma 7) : sans effet avec Prisma 6.
