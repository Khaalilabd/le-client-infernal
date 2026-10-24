# Rapport technique

Le rapport Word est **généré** à partir de fichiers texte : plus de conflit Git sur un fichier binaire, et personne n'écrase le travail des autres.

```bash
npm run rapport        # régénère docs/rapport/Rapport_Client_Infernal.docx
```

| Élément | Emplacement | Qui le modifie |
|---|---|---|
| Rapport Word (**généré, ne pas modifier à la main**) | [`Rapport_Client_Infernal.docx`](Rapport_Client_Infernal.docx) | personne : `npm run rapport` |
| Chapitres communs (1 à 4, 6, conclusion, annexes) | [`scripts/rapport/generer-rapport.cjs`](../../scripts/rapport/generer-rapport.cjs) | chef de projet |
| **Section de chaque module (chapitre 5)** | [`sections/5.x-<module>.md`](sections/) | responsable du module |
| Captures d'écran | [`captures/`](captures/) | chacun |
| Diagrammes d'architecture (PNG) | [`images/`](images/), générés depuis `docs/ARCHITECTURE.md` | `node scripts/export-diagrams.mjs` |

## Rédiger sa section (membres de l'équipe)

1. Ouvrez votre fichier `docs/rapport/sections/5.x-<module>.md` (un modèle avec des encadrés « À compléter » est prêt).
2. Inspirez-vous des sections déjà rédigées : [5.1 (module 1)](sections/5.1-client-generator.md) et [5.4 (module 4)](sections/5.4-requirements.md).
3. Syntaxe :

   | Pour obtenir | Écrire |
   |---|---|
   | Sous-titre | `### Tests` |
   | Gras / code | `**important**` / `` `npm test` `` |
   | Puce | `- texte` |
   | Tableau | lignes `\| a \| b \|` (la 1re ligne est l'en-tête), puis la ligne `Tableau : légende` |
   | Capture | `![Légende de la figure](../captures/p-m2-001-04-ecran-chat.png)` (plusieurs lignes de même légende = une figure en plusieurs parties) |
   | Encadré orange | `> À compléter : …` |
   | Encadré bleu | `> texte` |

4. Déposez vos captures dans `captures/`, puis lancez `npm run rapport` pour vérifier le résultat dans Word.
5. Committez **votre fichier `.md` et vos captures** sur votre branche. Le `.docx` sera régénéré par le chef de projet après la fusion : ne le committez pas depuis votre branche, pour éviter les conflits.

Une capture référencée mais absente apparaît sous forme de cadre rouge « Capture à insérer », et l'annexe B indique automatiquement l'état de chaque capture.

## Ouvrir le rapport

- Dans Word, mettez à jour le sommaire : clic droit → « Mettre à jour les champs » (F9).
- Export final : Fichier → Enregistrer sous → PDF.
