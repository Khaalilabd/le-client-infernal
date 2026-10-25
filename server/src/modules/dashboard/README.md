# Module 5 — dashboard

**Responsable : Aziz Louati** · Branche : `feature/dashboard` · Version : **0.3** (P-M5-001, P-M5-002 par Aziz ; P-M5-003 corrections à l'intégration)

Historique, statistiques, progression, **recommandation du prochain scénario** par l'IA (technique Few-shot), **bilan de séance** avec la note finale, et **espace enseignant** (vue d'ensemble, fiche étudiant, commentaires).

## Fichiers

| Côté | Fichier | Rôle |
|---|---|---|
| Serveur | `dashboard.routes.js` | routes `/api/dashboard/*` |
| | `dashboard.controller.js` | lecture de la requête / réponse |
| | `dashboard.service.js` | statistiques, compétences, progression, historique, historique anonymisé (`buildAnonymizedHistory`), recommandation, bilan, espace enseignant |
| | `dashboard.schemas.js` | Zod : paramètres, `teacherFeedbackBodySchema`, `recommendationSchema` (domaine et personnalité du module 1) |
| | `prompts/recommend-scenario.md` | prompt v0.3 : 3 exemples Few-shot, valeurs autorisées, points faibles avant la recommandation |
| | `mocks/recommend-scenario.mock.js` | réponse simulée qui analyse réellement l'historique |
| | `tests/schemas.test.js` | 25 tests unitaires (schémas, mock, prompt) |
| | `tests/endpoints.test.js` | 21 tests d'intégration (données de test créées puis supprimées) |
| | `tests/security.test.js` | 9 tests de sécurité (anonymisation, besoin caché, rôles, isolation) |
| Client | `routes.jsx` | routes `/dashboard`, `/dashboard/sessions/:sessionId`, `/dashboard/students/:studentId` |
| | `api.js` | appels HTTP |
| | `pages/DashboardHomePage.jsx` | tableau de bord étudiant (maquette 08) ou espace enseignant (maquette 09) |
| | `pages/SessionReportPage.jsx` | bilan d'une séance, fin de séance, commentaires |
| | `pages/StudentDetailPage.jsx` | fiche d'un étudiant (enseignant) |
| | `components/` | `StatCard`, `HistoryTimeline`, `ProgressChart` (SVG), `SkillsCard`, `RecommendationCard`, `ScoreBreakdown`, `Feedbacks` |
| | `format.js`, `dashboard.css` | libellés communs, styles propres au module (préfixe `db-`) |

## Tables utilisées

- **`TeacherFeedback`** (propriétaire, écriture).
- Lecture seule : `User`, `TrainingSession`, `Scenario`, `InterviewMessage`, `InterviewSummary`, `ChangeRequest`, `RequirementsDocument`, `RequirementsEvaluation`, `AiCallLog`.
- Lecture du catalogue du module 1 (`client-generator.catalog.js`) : domaines suggérés et profils de personnalité.

Le dashboard **n'écrit jamais** dans les tables des autres modules. La fin de séance et la note finale sont dans la base commune (`server/src/shared/sessions/sessionScore.js`, endpoint `PATCH /api/sessions/:sessionId/status`).

## Endpoints

| | Méthode | Route | Rôle |
|---|---|---|---|
| ✅ | GET | `/api/dashboard/me/stats` | STUDENT |
| ✅ | GET | `/api/dashboard/me/history` | STUDENT |
| ✅ | GET | `/api/dashboard/me/recommendation` | STUDENT |
| ✅ | GET | `/api/dashboard/sessions/:sessionId/report` | propriétaire ou TEACHER |
| ✅ | GET | `/api/dashboard/teacher/overview` | TEACHER |
| ✅ | GET | `/api/dashboard/teacher/students/:studentId` | TEACHER |
| ✅ | POST | `/api/dashboard/teacher/sessions/:sessionId/feedback` `{ comment, grade? }` | TEACHER |

## Partie IA : Few-shot (cours Prompt Engineering, p. 20)

- 3 exemples « historique anonymisé → recommandation attendue » dans le prompt.
- Le modèle repère d'abord les points faibles (`weaknesses`), puis recommande.
- Domaines et personnalités limités à ceux du module 1 : listés dans le prompt et imposés par Zod, pour que « Lancer ce scénario » pré-remplisse le générateur.
- Historique anonymisé côté serveur (`buildAnonymizedHistory`) : domaines, niveaux, notes, décisions ; ni nom, ni email, ni identifiant.
- Moins de 2 séances terminées : règle simple, sans appel au LLM (`source: RULE`).

## Règles à respecter

- Envoyer au LLM uniquement un historique **anonymisé**.
- L'enseignant voit les noms des étudiants, jamais le besoin caché ; seules des notes agrégées sortent (aucune proximité individuelle).

## Tâches

- [x] Historique, statistiques, compétences et graphique de progression.
- [x] Recommandation par l'IA (Few-shot) et bouton « Lancer ce scénario ».
- [x] Bilan de séance et fin de séance avec note finale (règle commune, P-015).
- [x] Espace enseignant : vue d'ensemble, liste des étudiants, fiche étudiant, commentaire et note.
- [x] Tests : 55 tests, tous exécutés (aucun ignoré, base lancée).
- [ ] Filtres et export CSV pour l'espace enseignant.
- [ ] Tester la recommandation avec un vrai fournisseur.
