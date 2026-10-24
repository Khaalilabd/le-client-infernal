# Captures d'écran

Captures de la démarche, insérées automatiquement dans le rapport Word (`Rapport_Client_Infernal.docx`). Une capture longue est découpée en plusieurs fichiers numérotés `-1`, `-2`…

Windows : Win + Maj + S, puis clic sur la notification → Enregistrer, dans ce dossier, avec le nom indiqué.

## État

| N° | Fichier(s) | Contenu | État |
|---|---|---|---|
| 1 | `p001-01-prompt-1.png` à `-4.png` | Prompt P-001 dans Claude Code | ✅ |
| 2 | `p001-02-plan-1.png` à `-4.png` | Plan proposé par l'IA avant la création des fichiers | ✅ |
| 3 | `p001-03-questions.png` | Questions de l'IA et réponses du chef de projet | ✅ |
| 4 | `p001-04-arborescence-1.png`, `-2.png` | Explorateur de VS Code : `server/src` puis `client/src` dépliés | ✅ |
| 5 | `p001-05-tests.png` | Terminal : `npm test` (« pass 31 / fail 0 ») | ✅ |
| 6 | `p001-06-application-connexion.png`, `p001-06-application-accueil.png` | Application dans le navigateur | ✅ (générées) |
| 7 | `p001-07-github.png` | Page des branches du dépôt GitHub | ✅ (générée) |
| 8 | `p003-01-prompt-1.png`, `-2.png` | Messages du prompt P-003 | ✅ |
| 9 | `p003-02-maquettes-navigateur.png` | Maquette ouverte dans le navigateur | ✅ (générée) |
| 10 | `p005-01-prompt-1.png`, `-2.png` | Prompt P-005 | ✅ |
| 11 | `p005-02-plan-1.png` à `-3.png` | Plan du module 1 | ✅ |
| 12 | `p005-03-question-base-commune.png` | Question avant modification de la base commune | ✅ |
| 13 | `p005-05-ecran-generateur.png` | Écran réalisé du module 1 : génération et liste | ✅ (générée) |
| 14 | `p005-06-ecran-detail-scenario.png` | Écran réalisé du module 1 : fiche d'un scénario | ✅ (générée) |
| 15 | `p005-04-resume-1.png`, `-2.png` | Résumé final de P-005 | ✅ |
| M4 | `p-m4-001-01-prompt-1.png` à `-3.png` | Prompt P-M4-001 (Nadhem) | ✅ (récupérées du Word) |
| M4 | `p-m4-001-02-plan-1.png` à `-7.png` | Plan du module 4 et questions de l'IA | ✅ (récupérées du Word) |
| M4 | `p-m4-001-03-resume-1.png`, `-2.png` | Résumé final de P-M4-001 | ✅ (récupérées du Word) |
| M4 | `p-m4-001-04` à `-07-ecran-*.png` | Écrans réalisés du module 4 | ✅ |
| M3 | `p-m3-001-01-prompt.png`, `-02-plan.png`, `-03-resume.png` | Prompt, plan et résumé de P-M3-001 | ❌ à fournir (Ismail) |
| M3 | `p-m3-001-04` à `-07-*.png` | Écrans réalisés du module 3 et lien avec le module 4 | ✅ (générées) |
| 16 | `p-m4-001-01-prompt.png` | Prompt P-M4-001 dans Claude Code | 🔲 à prendre (Nadhem) |
| 17 | `p-m4-001-02-plan.png` | Plan du module 4 et questions de l'IA | 🔲 à prendre (Nadhem) |
| 18 | `p-m4-001-03-resume.png` | Résumé final de P-M4-001 | 🔲 à prendre (Nadhem) |
| 19 | `p-m4-001-04-ecran-editeur.png` | Écran réalisé du module 4 : éditeur (brouillon) | ✅ (générée) |
| 20 | `p-m4-001-05-ecran-evaluation.png` | Écran réalisé du module 4 : évaluation de la version 1 | ✅ (générée) |
| 21 | `p-m4-001-06-ecran-nouvelle-version.png` | Écran réalisé du module 4 : nouvelle version après une demande | ✅ (générée) |
| 22 | `p-m4-001-07-ecran-versions.png` | Écran réalisé du module 4 : historique des versions (recadrée) | ✅ (générée) |
| 23 | `p-m4-003-01-prompt.png` | Prompt P-M4-003 (texte : `sources/p-m4-003/01-prompt.md`) | ✅ |
| 24 | `p-m4-003-02-plan.png` | Plan du matching et options A, B, C (texte : `sources/p-m4-003/02-plan.md`) | ✅ |
| 25 | `p-m4-003-03-resume.png` | Résumé final de P-M4-003 (texte : `sources/p-m4-003/03-resume.md`) | ✅ |
| 26 | `p-m4-003-04-ecran-matching.png` | Écran réalisé : panneau « Correspondance avec le besoin réel » (marche à suivre : `sources/p-m4-003/04-ecran-matching.md`) | ✅ |

Après avoir ajouté une capture, lancez `npm run rapport` : la capture est insérée automatiquement et l'annexe B est mise à jour. Les captures des modules sont référencées dans `docs/rapport/sections/5.x-<module>.md`.

Pour les prochains prompts : `p-m<x>-NNN-NN-description.png` pour un module (ex. `p-m2-001-01-prompt.png`), `pNNN-NN-description.png` pour un prompt commun.
