# Module 3 — Techniques d'IA : Chain of Thought & Self-Consistency

**Responsable :** Ismail Ismail · **Date :** 2026-10-26  
**Module :** `change-requests` — Demandes de changement  
**Projet :** Le Client Infernal — ESPRIT, IA for Software Engineering 2026-2027

---

## 1. Présentation du module

Le module 3 simule la gestion des demandes de changement en cours de projet logiciel. Le LLM joue le rôle du client et envoie jusqu'à **3 demandes réalistes** par séance. L'étudiant doit **accepter, négocier ou refuser** chaque demande avec une justification. Le LLM évalue ensuite cette réponse et joue la réaction du client.

Deux techniques d'IA du cours ont été appliquées pour rendre cette évaluation plus fiable et pédagogiquement solide.

---

## 2. Chain of Thought (Chaîne de raisonnement)

### Principe
Au lieu de demander une réponse directe au LLM, on lui impose un **chemin de raisonnement étape par étape** avant de conclure. Cela améliore la précision et la cohérence des sorties.

### Application dans `generate-change` v0.2

Le prompt force le modèle à traverser plusieurs couches de contexte avant de rédiger la demande :

```
Étape 1 → Qui est le client ? (personnalité, style, humeur)
Étape 2 → Quel est son vrai besoin sous-jacent ? (ne jamais le révéler)
Étape 3 → Qu'a-t-il déjà demandé ? (éviter la répétition)
Étape 4 → Que contient le cahier des charges actuel ? (lecture M4)
Étape 5 → Quel est le niveau de difficulté : BEGINNER / INTERMEDIATE / ADVANCED ?
──────────────────────────────────────────────────────────────────
→ Seulement alors : rédiger une demande cohérente avec tout le contexte.
```

**Bénéfice :** les demandes générées sont ancrées dans le projet réel de l'étudiant et non génériques ou répétitives.

### Application dans `evaluate-response` v0.3

L'évaluation est décomposée en **4 étapes de raisonnement** que le modèle doit écrire avant de donner la note :

```
Étape 1 → Quel est l'impact réel de la demande sur le projet ?
Étape 2 → Quel risque la décision de l'étudiant fait-elle peser ?
Étape 3 → Quelle décision était la plus adaptée et pourquoi ?
Étape 4 → La justification de l'étudiant est-elle professionnelle et argumentée ?
──────────────────────────────────────────────────────────────────
→ Seulement alors : attribuer une note sur 100 selon la grille (40 + 30 + 30).
```

Ce raisonnement est **interne au LLM**, jamais montré à l'étudiant. Il sert uniquement à produire une note plus juste.

| Critère | Poids | Ce que le modèle évalue |
|---|---|---|
| Pertinence de la décision | 40 pts | ACCEPT / NEGOTIATE / REFUSE est-il justifié par l'impact réel ? |
| Qualité de la justification | 30 pts | Délai, coût, qualité analysés ? Alternative proposée ? |
| Communication professionnelle | 30 pts | Ton adapté au client ? Émotions gérées ? |

---

## 3. Self-Consistency (Auto-cohérence)

### Principe
Pour un même problème, on génère **plusieurs raisonnements indépendants** et on retient la réponse la plus cohérente (vote majoritaire). Cela réduit les erreurs aléatoires du LLM.

### Problème résolu

Sans self-consistency, la même justification d'étudiant peut recevoir des notes très différentes selon l'appel :

| Appel 1 | Appel 2 | Appel 3 | Résultat sans SC |
|---|---|---|---|
| NEGOTIATE — 60 pts | NEGOTIATE — 70 pts | ACCEPT — 95 pts | Une seule évaluation : 60, 70 ou 95 au hasard |

Ce comportement est **injuste et inexplicable** pour un outil pédagogique.

### Solution implémentée dans `change-requests.consistency.js`

```
┌─────────────────────────────────────────────────────┐
│          Réponse de l'étudiant                      │
└──────────────┬──────────────────────────────────────┘
               │  3 appels LLM en parallèle (température 0.7)
    ┌──────────┼──────────┐
    ▼          ▼          ▼
 Éval. 1    Éval. 2    Éval. 3
NEGOTIATE  NEGOTIATE   ACCEPT
  60 pts    70 pts     95 pts
    │          │
    └────┬─────┘  ← Vote majoritaire : NEGOTIATE (2/3)
         │
    Note médiane : 65 pts  ← L'évaluation divergente (95) est écartée
         │
    Retour pédagogique + Réaction du client (de l'éval. la plus proche)
```

| Étape | Description |
|---|---|
| **3 raisonnements** | 3 appels indépendants à `evaluate-response v0.3`, en parallèle |
| **Vote majoritaire** | La décision attendue (ACCEPT/NEGOTIATE/REFUSE) la plus fréquente est retenue |
| **Note médiane** | Médiane des notes des évaluations majoritaires (élimine les extrêmes) |
| **Transparence** | Décision attendue et nombre de votes affichés à l'étudiant |
| **Incertitude** | Si aucune décision n'a de majorité (3 décisions différentes) → signalé « évaluation incertaine » |

### Avant / Après

| Cas | Sans Self-Consistency | Avec Self-Consistency |
|---|---|---|
| NEGOTIATE 60, NEGOTIATE 70, ACCEPT 95 | Note aléatoire (60, 70 ou 95) | Note **65**, décision **NEGOTIATE** (2/3 votes) |
| ACCEPT 40, NEGOTIATE 60, REFUSE 90 | Note aléatoire, sans signal de doute | Note **60**, signalé **incertain** (3 décisions différentes) |
| 3× NEGOTIATE 78 (mode simulé) | 78 | **78** — « 3 évaluations sur 3 concordantes » |

---

## 4. Bénéfices combinés

| Aspect | Sans CoT + SC | Avec CoT + SC |
|---|---|---|
| Qualité des demandes | Génériques, déconnectées du projet | Ancrées dans le scénario et le cahier des charges réel |
| Fiabilité de la note | Aléatoire, injustifiable | Stable, reproductible, explicable |
| Pédagogie | Feedback vague, score arbitraire | Feedback ciblé, décision attendue expliquée |
| Sécurité | Besoin caché peut filtrer | Raisonnement interne jamais transmis au front-end |
| Mode sans clé API | Mock unique | 3 mocks variés, vote unanime simulé |

---

## 5. Sécurité et contraintes respectées

- Le **raisonnement intermédiaire** du LLM (qui peut citer le besoin caché) n'est **jamais enregistré ni renvoyé** au front-end.
- Le retour pédagogique et la réaction du client sont validés par un schéma **Zod** qui refuse tout texte citant le besoin caché.
- Les 3 appels LLM sont lancés **en parallèle** → le temps d'attente reste celui d'un seul appel.
- Si une évaluation échoue, les deux autres sont agrégées. Si toutes échouent, un bouton « Réessayer » est affiché.

---

## 6. Conclusion

Le **Chain of Thought** force le LLM à raisonner de manière structurée avant chaque génération ou évaluation, produisant des demandes réalistes et des notes justifiables. La **Self-Consistency** élimine la variabilité aléatoire en agrégeant plusieurs raisonnements indépendants, transformant une note imprévisible en un résultat stable et pédagogiquement défendable. Ensemble, ces deux techniques font du LLM un **assistant pédagogique fiable** plutôt qu'un simple générateur de texte.
