# Charte graphique et principes UX — « Le Client Infernal »

> Référence commune pour l'interface. Chaque membre suit cette charte pour les pages de son module.
> Le système de design est implémenté dans [`client/src/styles.css`](../../client/src/styles.css) (base commune).
> Les maquettes ([`docs/ui/maquettes/`](maquettes/)) utilisent **ce même fichier CSS** : un écran réalisé avec les classes ci-dessous ressemble donc à sa maquette.

## 1. Intention

La plateforme met l'étudiant face à un client **exigeant, parfois de mauvaise foi**, mais l'interface doit rester **calme, lisible et rassurante** : le défi vient du client, pas de l'outil.

- **Rouge « infernal »** : identité de la marque, actions principales, élément actif.
- **Flamme (orange)** : accent rare, réservé aux indices, à la progression et aux points d'attention.
- **Neutres froids** : fond, cartes, textes, pour un rendu sobre et professionnel.

## 2. Jetons de design

### Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `--brand-700` | `#8C1D18` | survol des boutons, texte d'erreur |
| `--brand-600` (`--primary`) | `#B3261E` | boutons principaux, liens, élément actif, bulles de l'étudiant |
| `--brand-50` (`--primary-soft`) | `#FDECEB` | fond de l'élément actif, sélection |
| `--accent-500` | `#E8890C` | indices, jauges de progression |
| `--success-600` / `--success-50` | `#1E7D4F` / `#E7F5EE` | étape terminée, note correcte, niveau débutant |
| `--warning-600` / `--warning-50` | `#8A5A00` / `#FFF6E0` | en attente, niveau intermédiaire, mise en garde |
| `--info-600` / `--info-50` | `#1F5FBF` / `#E8F0FC` | astuces, statut « en cours » |
| `--gray-900` | `#161A22` | texte principal |
| `--gray-600` | `#5B6474` | texte secondaire |
| `--gray-200` | `#DDE1E8` | bordures |
| `--gray-50` | `#F7F8FA` | fond de page |

Contrastes vérifiés (WCAG AA = 4,5:1 minimum pour le texte) : rouge sur blanc 6,5:1 · texte secondaire sur fond 5,6:1 · badges succès 4,6:1, attention 5,5:1, info 5,3:1 · texte principal 16,4:1.
Le gris 400 (`#9AA3B2`, 2,5:1) ne doit **jamais** servir pour du texte à lire : il est réservé aux textes d'exemple des champs (placeholders) et aux éléments décoratifs.

### Typographie

Police système (`Segoe UI`, `system-ui`, Roboto…) : aucune police à télécharger, rendu net sur Windows, macOS et Linux.

| Rôle | Taille | Graisse |
|---|---|---|
| Titre de page (`h1`) | 28 px | 700 |
| Titre de section (`h2`) | 22 px | 650 |
| Titre de carte (`h3`) | 18 px | 600 |
| Texte courant | 15 px | 400, interligne 1,5 |
| Texte secondaire (`.small`, `.muted`) | 13 px | 400 |
| Surtitre (`.eyebrow`) | 12 px, majuscules | 700 |

### Espacements et formes

- Échelle de 4 px : `--space-1` (4) à `--space-7` (48). Marges entre cartes : 16 px ; entre sections : 32 px.
- Rayons : 6 px (champs, boutons), 10 px (cartes), arrondi complet (badges, puces).
- Ombres légères (`--shadow-sm`) ; `--shadow-md` uniquement au survol d'un élément cliquable.

## 3. Composants (classes CSS)

| Composant | Classes | Composant React (commun) |
|---|---|---|
| En-tête de page | `.page-header`, `.eyebrow`, `.page-header-actions` | `PageHeader` |
| Carte | `.card`, `.card-header`, `.card-footer`, `.card-muted` | — |
| Bouton | `.btn` (principal), `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-lg`, `.btn-block` | — |
| Badge | `.badge`, `.badge-success`, `.badge-warning`, `.badge-info`, `.badge-danger`, `.level-beginner/intermediate/advanced` | — |
| Puce | `.chip` | — |
| Alerte | `.alert` + `.alert-error/-warning/-info/-success`, `.alert-actions` | `ErrorMessage` (avec « Réessayer ») |
| Formulaire | `label`, `input`, `select`, `textarea`, `.field-hint`, `.field-error`, `.form-inline`, `.row` | — |
| Chargement | `.loader`, `.spinner`, `.skeleton` | `Loader` |
| État vide | `.empty-state` | `EmptyState` |
| Onglets | `.tabs`, `.tab`, `.tab.is-active` | — |
| Parcours de séance | `ol.stepper > li.step` + `.is-done`, `.is-current` | — |
| Jauge | `.bar > span` (+ `.bar-success`, `.bar-warning`) | — |
| Avatar | `.avatar`, `.avatar-lg` | — |
| Fiche client | `.client-card`, `.client-card-head` | — |
| Choix exclusif | `.choice-group > label.choice` (+ `.is-selected`) | — |
| Note | `.score`, `.score-value`, `.score-max`, `.criteria`, `.criterion-head` | — |
| Chronologie | `ul.timeline` | — |
| Statistiques | `.stats-grid`, `.stat-card`, `.stat-value`, `.stat-label`, `.stat-trend` | — |
| Tableau | `table.table` | — |
| Mises en page | `.grid`, `.stack`, `.cluster`, `.two-columns` (2/3 + 1/3), `.split` (contenu + panneau 320 px) | — |

Règle : **un module n'ajoute pas de couleur ni de taille en dur**. S'il a besoin d'un style spécifique, il crée un fichier CSS dans son dossier (classes préfixées par le module, ex. `.interview-…`) qui réutilise les variables `var(--…)`. Un nouveau composant utile à tous est proposé à l'équipe pour la base commune.

## 4. Principes UX

1. **Un parcours guidé.** Une séance suit 5 étapes : Scénario → Entretien → Cahier des charges → Changements → Évaluation. Le `stepper` est affiché en haut des pages des modules 2, 3 et 4 pour situer l'étudiant.
2. **La séance suit l'étudiant.** Le sélecteur de séance (`SessionPicker`) garde la séance dans l'URL (`?session=…`) : on passe d'un module à l'autre sans la perdre.
3. **Le besoin caché reste caché.** Aucun écran n'affiche le besoin caché ni les contraintes implicites, pas même de façon détournée (jauge de « proximité » exacte, par exemple). Les retours de l'IA donnent des **pistes**, pas la réponse.
4. **L'IA est lente et faillible : on le montre.** Chaque appel à l'IA affiche un état d'attente explicite (« Le client réfléchit… », « Génération… ») et désactive le bouton. Les erreurs temporaires (quota 429, délai dépassé) proposent un bouton **Réessayer** (`ErrorMessage` avec `onRetry`).
5. **Une action principale par écran.** Un seul bouton `.btn` plein par zone ; les autres actions en `.btn-secondary` ou `.btn-ghost`.
6. **Jamais d'écran vide sans issue.** Une liste vide affiche un `EmptyState` avec l'action qui permet d'avancer.
7. **Des retours pédagogiques lisibles.** Les évaluations affichent une note globale, le détail par critère (jauges) et 2 à 4 pistes d'amélioration.
8. **Rôles distincts.** L'enseignant consulte en lecture seule les écrans des étudiants et dispose de son espace (module 5) ; les boutons d'action réservés aux étudiants sont masqués pour lui.

## 5. Accessibilité

- Contraste AA, focus visible sur tous les éléments interactifs (`:focus-visible`).
- Chaque champ a un `label` ; les erreurs sont annoncées avec `role="alert"`.
- Navigation complète au clavier ; `Entrée` envoie un message dans le chat, `Maj + Entrée` passe à la ligne.
- Textes en français ; ne pas transmettre une information par la couleur seule (badge = couleur **et** libellé).
- Mise en page adaptée aux écrans étroits : le menu latéral passe en haut sous 860 px.

## 6. Écrans par module

| Écran | Maquette | Module | Responsable |
|---|---|---|---|
| Charte (référence visuelle) | [00-charte](maquettes/png/00-charte.png) | commun | équipe |
| Connexion / inscription | [01-connexion](maquettes/png/01-connexion.png) | commun | équipe |
| Accueil étudiant | [02-accueil](maquettes/png/02-accueil.png) | commun | équipe |
| Générateur de clients | [03-m1-generateur](maquettes/png/03-m1-generateur.png) | M1 | Khalil Abdelmoumen |
| Entretien client | [04-m2-entretien](maquettes/png/04-m2-entretien.png) | M2 | Kenza Baccar |
| Éditeur du cahier des charges | [05-m4-cahier-des-charges](maquettes/png/05-m4-cahier-des-charges.png) | M4 | Nadhem Hmida |
| Évaluation du cahier des charges | [06-m4-evaluation](maquettes/png/06-m4-evaluation.png) | M4 | Nadhem Hmida |
| Demande de changement | [07-m3-demande-changement](maquettes/png/07-m3-demande-changement.png) | M3 | Ismail Ismail |
| Tableau de bord étudiant | [08-m5-tableau-de-bord](maquettes/png/08-m5-tableau-de-bord.png) | M5 | Aziz Louati |
| Espace enseignant | [09-m5-espace-enseignant](maquettes/png/09-m5-espace-enseignant.png) | M5 | Aziz Louati |

Les données affichées dans les maquettes sont fictives. Les éléments présents dans une maquette mais pas encore dans l'API (ex. « Terminer l'entretien », jauge de compétences) correspondent aux endpoints 🔲 prévus dans `docs/ARCHITECTURE.md`.

## 7. Modifier les maquettes

- Ouvrir `docs/ui/maquettes/index.html` dans un navigateur pour parcourir les écrans.
- Modifier le fichier HTML de l'écran (il utilise les classes de `client/src/styles.css`).
- Régénérer les images :
  ```bash
  node scripts/export-images.mjs docs/ui/maquettes docs/ui/maquettes/png
  ```
