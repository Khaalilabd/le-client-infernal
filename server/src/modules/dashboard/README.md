# Module 5 — dashboard

**Responsable : Aziz Louati** · Branche : `feature/dashboard`

Historique, statistiques, **recommandation du prochain scénario** et **espace enseignant**.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `dashboard.routes.js` | routes `/api/dashboard/*` |
| | `dashboard.controller.js` | lecture de la requête / réponse |
| | `dashboard.service.js` | statistiques de l'étudiant, vue d'ensemble pour l'enseignant |
| | `dashboard.schemas.js` | Zod : `teacherFeedbackBodySchema`, `recommendationSchema` |
| | `prompts/recommend-scenario.md` | prompt de recommandation (brouillon v0.1, **à brancher**) |
| | `mocks/recommend-scenario.mock.js` | réponse simulée |
| Client | `client/src/modules/dashboard/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/DashboardHomePage.jsx` | tableau de bord étudiant ou enseignant selon le rôle |
| | `components/StatCard.jsx` | carte de statistique |

## Tables utilisées

- **`TeacherFeedback`** (propriétaire, écriture).
- Lecture seule de toutes les autres tables : `User`, `TrainingSession`, `Scenario`, `InterviewMessage`, `ChangeRequest`, `RequirementsDocument`, `RequirementsEvaluation`, `AiCallLog`.

Le dashboard **n'écrit jamais** dans les tables des autres modules.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/dashboard/me/stats` | STUDENT |
| ✅ | GET | `/api/dashboard/teacher/overview` | TEACHER |
| 🔲 | GET | `/api/dashboard/me/history` | STUDENT |
| 🔲 | GET | `/api/dashboard/me/recommendation` | STUDENT |
| 🔲 | GET | `/api/dashboard/teacher/students/:studentId` | TEACHER |
| 🔲 | POST | `/api/dashboard/teacher/sessions/:sessionId/feedback` `{ comment, grade? }` | TEACHER |

## Règles à respecter

- **Recommandation** : envoyer au LLM uniquement un historique **anonymisé** (domaines, niveaux, scores), jamais de nom ni d'email.
- L'enseignant peut voir les noms des étudiants dans l'interface, mais pas le besoin caché (le `responseGuard` le retire de toute façon).

## Tâches

- [ ] Historique des séances de l'étudiant avec les notes de chaque module.
- [ ] Recommandation : d'abord une règle simple (niveau supérieur si moyenne > 75), puis le prompt `recommend-scenario`.
- [ ] Espace enseignant : fiche étudiant, commentaire et note sur une séance (`TeacherFeedback`), filtres.
- [ ] Graphiques de progression (une bibliothèque comme Recharts peut être ajoutée à `client/package.json` ; à signaler à l'équipe).
- [ ] Définir avec l'équipe le calcul de `TrainingSession.finalScore` (pondération entretien / cahier des charges / demandes de changement).
- [ ] Tracer chaque version du prompt dans `docs/prompts/dashboard.md`.
