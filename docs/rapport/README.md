# Rapport technique

| Élément | Emplacement |
|---|---|
| Rapport Word (à compléter par l'équipe) | [`Rapport_Client_Infernal.docx`](Rapport_Client_Infernal.docx) |
| Diagrammes d'architecture (PNG) | [`images/`](images/) — générés depuis `docs/ARCHITECTURE.md` |
| Sources HTML des diagrammes | [`diagrammes/`](diagrammes/) |
| Captures d'écran de la démarche | [`captures/`](captures/) |
| Maquettes de l'interface (PNG) | [`../ui/maquettes/png/`](../ui/maquettes/png/) |

## Compléter le rapport

1. Ouvrir `Rapport_Client_Infernal.docx` dans Word (ou LibreOffice / Google Docs).
2. Mettre à jour le sommaire : clic droit → « Mettre à jour les champs » (F9).
3. Remplacer chaque cadre rouge « [CAPTURE N À INSÉRER] » par la capture correspondante (liste en annexe B du rapport). Enregistrer aussi chaque capture dans `captures/` sous le nom indiqué.
4. Compléter les encadrés orange « À compléter » : chaque membre rédige la section de son module (chapitre 5).
5. Export final : Fichier → Enregistrer sous → PDF.

Pour éviter les conflits Git sur le fichier Word (fichier binaire), **une seule personne à la fois** le modifie : prévenez l'équipe avant de l'ouvrir, puis committez et poussez aussitôt (`docs(rapport): …`).

## Régénérer les images

```bash
node scripts/export-diagrams.mjs                                   # diagrammes (Mermaid, connexion internet requise)
node scripts/export-images.mjs docs/ui/maquettes docs/ui/maquettes/png   # maquettes
```

Les images du rapport Word n'étant pas liées aux fichiers, une image régénérée doit être réinsérée à la main dans le document.
