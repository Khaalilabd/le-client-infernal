# Base de connaissances du RAG — module client-generator

Ces fiches métier alimentent la génération des scénarios (RAG, Séance 4 du cours). Pour chaque génération, le serveur :

1. **découpe** les fiches en blocs, un par situation, avec un chevauchement si une situation est trop longue ;
2. **vectorise** les blocs : embeddings du fournisseur IA, ou vectorisation locale TF-IDF à défaut ;
3. **recherche** les blocs les plus proches du domaine demandé (similarité cosinus), en écartant ceux que les scénarios existants exploitent déjà (MMR) ;
4. **injecte** les blocs retenus dans le prompt `generate-scenario`.

Les fiches restent sur le serveur : elles décrivent des besoins réels typiques et ne sont jamais envoyées au front-end.

## Format d'une fiche

Un fichier `.md` par domaine (ce README est ignoré) :

```markdown
# Nom du domaine (identique à data/domains.json)

Mots-clés : mots, qui, aident, la, recherche

## Titre interne de la situation (jamais affiché)
- Organisation : type d'organisation, sans nom propre
- Interlocuteur : fonction du client
- Sujet : objet de la demande, affiché dans le titre du scénario
- Situation actuelle : symptômes visibles, sans nommer le besoin réel
- Demande typique : ce que le client demande, à la première personne (« je veux… »)
- Besoin réel : le vrai problème et son impact
- Contraintes fréquentes : cinq contraintes séparées par « ; »
- Outils existants : ce que l'organisation utilise aujourd'hui
```

Règles de rédaction : aucune marque, organisation ou personne réelle ; aucune loi, norme ni statistique précise dont on n'est pas sûr. Les tests (`tests/rag.test.js`) vérifient le format de chaque situation.
