# Module 5 — dashboard

**Responsable : Aziz Louati** · Branche : `feature/dashboard`

Historique, statistiques, **recommandation du prochain scénario** et **espace enseignant**.

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `dashboard.routes.js` | routes `/api/dashboard/*` |
| | `dashboard.controller.js` | lecture de la requête / réponse |
| | `dashboard.service.js` | statistiques, historique anonymisé, recommandation IA |
| | `dashboard.schemas.js` | Zod : `teacherFeedbackBodySchema`, `recommendationSchema`, `studentIdParamsSchema` |
| | `prompts/recommend-scenario.md` | prompt v0.2 Few-shot avec 3 exemples |
| | `mocks/recommend-scenario.mock.js` | réponse simulée intelligente |
| | `tests/schemas.test.js` | tests unitaires des schémas et mocks (24 tests) |
| | `tests/endpoints.test.js` | tests d'intégration des 6 endpoints (17 tests) |
| | `tests/security.test.js` | tests de sécurité et contrôle d'accès (12 tests) |
| Client | `client/src/modules/dashboard/routes.jsx` | menu + routes |
| | `api.js` | appels HTTP |
| | `pages/DashboardHomePage.jsx` | tableau de bord étudiant (stats, recommandation, historique) |
| | `components/StatCard.jsx` | carte de statistique |
| | `components/RecommendationCard.jsx` | carte de recommandation IA |
| | `components/HistoryTable.jsx` | tableau historique des séances |

## Tables utilisées

- **`TeacherFeedback`** (propriétaire, écriture).
- Lecture seule de toutes les autres tables : `User`, `TrainingSession`, `Scenario`, `InterviewMessage`, `ChangeRequest`, `RequirementsDocument`, `RequirementsEvaluation`, `AiCallLog`.

Le dashboard **n'écrit jamais** dans les tables des autres modules.

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/dashboard/me/stats` | STUDENT |
| ✅ | GET | `/api/dashboard/teacher/overview` | TEACHER |
| ✅ | GET | `/api/dashboard/me/history` | STUDENT |
| ✅ | GET | `/api/dashboard/me/recommendation` | STUDENT |
| ✅ | GET | `/api/dashboard/teacher/students/:studentId` | TEACHER |
| ✅ | POST | `/api/dashboard/teacher/sessions/:sessionId/feedback` `{ comment, grade? }` | TEACHER |

## Règles à respecter

- **Recommandation** : envoyer au LLM uniquement un historique **anonymisé** (domaines, niveaux, scores), jamais de nom ni d'email.
- L'enseignant peut voir les noms des étudiants dans l'interface, mais pas le besoin caché (le `responseGuard` le retire de toute façon).

## Tâches

- [x] Historique des séances de l'étudiant avec les notes de chaque module.
- [x] Recommandation : d'abord une règle simple (niveau supérieur si moyenne > 75), puis le prompt `recommend-scenario` v0.2 (Few-shot).
- [x] Espace enseignant : fiche étudiant, commentaire et note sur une séance (`TeacherFeedback`).
- [x] Tests complets : 53 tests (schémas, mocks, sécurité, intégration).
- [ ] Graphiques de progression (une bibliothèque comme Recharts peut être ajoutée à `client/package.json` ; à signaler à l'équipe).
- [ ] Filtres et export CSV pour l'espace enseignant.
- [ ] Définir avec l'équipe le calcul de `TrainingSession.finalScore` (pondération entretien / cahier des charges / demandes de changement).

## État actuel

✅ **Module complet et fonctionnel** (Phases 1, 2, 3, 4 terminées)

- Backend : 6 endpoints opérationnels
- Frontend : Dashboard étudiant complet (stats, recommandation Few-shot, historique)
- Tests : 53 tests (100% de réussite)
- Sécurité : historique anonymisé, besoin caché protégé, contrôle des rôles
- Documentation : journal, rapport, captures
